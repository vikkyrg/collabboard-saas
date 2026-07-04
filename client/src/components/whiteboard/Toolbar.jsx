import { useState, useRef, useEffect } from "react";
import {
  MousePointer2,
  Pencil,
  Square,
  Circle,
  Minus,
  MoveRight,
  Type,
  Trash2,
  Save,
  Download,
  Shapes,
} from "lucide-react";

// Shape tools that get collapsed into the Shapes button on mobile
const SHAPE_TOOLS = [
  { id: "rect",   icon: Square,    label: "Rectangle" },
  { id: "circle", icon: Circle,    label: "Circle"    },
  { id: "line",   icon: Minus,     label: "Line"      },
  { id: "arrow",  icon: MoveRight, label: "Arrow"     },
];

function Toolbar({
  tool,
  setTool,
  onRemove,
  hasSelection,
  onSaveBoard,
  onLoadBoard,
}) {
  const [shapesOpen, setShapesOpen] = useState(false);
  const shapesRef = useRef(null);

  // Close the shapes popover when the user clicks/taps outside it
  useEffect(() => {
    if (!shapesOpen) return;
    const handleOutside = (e) => {
      if (shapesRef.current && !shapesRef.current.contains(e.target)) {
        setShapesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [shapesOpen]);

  // All tools -- used on desktop (sm+) unchanged
  const tools = [
    { id: "select", icon: MousePointer2, label: "Select"    },
    { id: "pencil", icon: Pencil,        label: "Draw"      },
    { id: "rect",   icon: Square,        label: "Rectangle" },
    { id: "circle", icon: Circle,        label: "Circle"    },
    { id: "line",   icon: Minus,         label: "Line"      },
    { id: "arrow",  icon: MoveRight,     label: "Arrow"     },
    { id: "text",   icon: Type,          label: "Text"      },
  ];

  // Is the currently active tool one of the shape tools?
  const activeShapeIsShape = SHAPE_TOOLS.some((s) => s.id === tool);

  const toolBtn = (t) => {
    const Icon = t.icon;
    const isActive = tool === t.id;
    return (
      <button
        key={t.id}
        onClick={() => setTool(t.id)}
        title={t.label}
        className={`p-1.5 sm:p-2.5 rounded-xl transition-all duration-200 ${
          isActive
            ? "bg-blue-100 text-blue-600 shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
      </button>
    );
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-wrap justify-center items-center gap-1 sm:gap-2 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg shadow-slate-200/50 border border-slate-200 p-1 sm:p-1.5 w-[96vw] sm:w-auto">

      {/* DESKTOP (sm+): render every tool exactly as before */}
      <div className="hidden sm:contents">
        {tools.map((t) => toolBtn(t))}
        <div className="w-px h-8 bg-slate-200 mx-1 shrink-0" />
        <div className="w-px h-8 bg-slate-200 mx-1 shrink-0" />
      </div>

      {/* MOBILE (<sm): compact toolbar with Shapes popover */}
      <div className="flex sm:hidden items-center gap-1">

        {toolBtn({ id: "select", icon: MousePointer2, label: "Select" })}
        {toolBtn({ id: "pencil", icon: Pencil, label: "Draw" })}

        {/* Shapes button + downward popover */}
        <div ref={shapesRef} className="relative">
          <button
            onClick={() => setShapesOpen((o) => !o)}
            title="Shapes"
            className={`p-1.5 rounded-xl transition-all duration-200 ${
              activeShapeIsShape
                ? "bg-blue-100 text-blue-600 shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Shapes size={20} strokeWidth={activeShapeIsShape ? 2.5 : 2} />
          </button>

          {shapesOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 p-1.5 flex flex-col gap-0.5 min-w-[130px] animate-in fade-in zoom-in-95 duration-150 origin-top">
              {SHAPE_TOOLS.map((s) => {
                const Icon = s.icon;
                const isActive = tool === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setTool(s.id);
                      setShapesOpen(false);
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-blue-100 text-blue-600"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {toolBtn({ id: "text", icon: Type, label: "Text" })}

        <div className="w-px h-6 bg-slate-200 mx-0.5 shrink-0" />

        <button
          onClick={onSaveBoard}
          title="Save Board Snapshot"
          className="p-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors shrink-0"
        >
          <Save size={20} />
        </button>

        <button
          onClick={onLoadBoard}
          title="Load Board Snapshot"
          className="p-1.5 rounded-xl text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors shrink-0"
        >
          <Download size={20} />
        </button>

        {hasSelection && (
          <>
            <div className="w-px h-6 bg-slate-200 mx-0.5 shrink-0" />
            <button
              onClick={onRemove}
              title="Delete Selected"
              className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
            >
              <Trash2 size={20} />
            </button>
          </>
        )}
      </div>

      {/* DESKTOP: Save / Load / Delete (unchanged) */}
      <div className="hidden sm:contents">
        <button
          onClick={onSaveBoard}
          title="Save Board Snapshot"
          className="p-1.5 sm:p-2.5 rounded-xl text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors shrink-0"
        >
          <Save size={20} />
        </button>

        <button
          onClick={onLoadBoard}
          title="Load Board Snapshot"
          className="p-1.5 sm:p-2.5 rounded-xl text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors shrink-0"
        >
          <Download size={20} />
        </button>

        {hasSelection && (
          <>
            <div className="w-px h-6 sm:h-8 bg-slate-200 mx-0.5 sm:mx-1 shrink-0" />
            <button
              onClick={onRemove}
              title="Delete Selected"
              className="p-1.5 sm:p-2.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
            >
              <Trash2 size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Toolbar;
