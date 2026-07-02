import {
  MousePointer2,
  Pencil,
  Square,
  Circle,
  Type,
  Trash2,
  Save,
  Download,
} from "lucide-react";

function Toolbar({
  tool,
  setTool,
  onRemove,
  hasSelection,
  onSaveBoard,
  onLoadBoard,
}) {
  const tools = [
    { id: "select", icon: MousePointer2, label: "Select" },
    { id: "pencil", icon: Pencil, label: "Draw" },
    { id: "rect", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "text", icon: Type, label: "Text" },
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-wrap justify-center items-center gap-1 sm:gap-2 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg shadow-slate-200/50 border border-slate-200 p-1 sm:p-1.5 w-[96vw] sm:w-auto">
      {tools.map((t) => {
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
      })}

      <div className="w-px h-6 sm:h-8 bg-slate-200 mx-0.5 sm:mx-1 shrink-0" />



      <div className="w-px h-6 sm:h-8 bg-slate-200 mx-0.5 sm:mx-1 shrink-0" />

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
  );
}

export default Toolbar;
