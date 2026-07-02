import React, { useState, useEffect } from "react";
import { Palette, X } from "lucide-react";

const COLORS = [
  "#ffffff", "#fa5252", "#40c057", "#228be6", "#fab005", "#000000"
];

const BG_COLORS = [
  "transparent", "#ffffff", "#fa5252", "#40c057", "#228be6", "#fab005", "#000000"
];

const FONT_FAMILIES = [
  { label: "Sans Serif", value: "Inter, sans-serif" },
  { label: "Serif", value: "Georgia, serif" },
  { label: "Monospace", value: "monospace" },
  { label: "Hand Drawn", value: "'Comic Sans MS', cursive" }
];

function StylePanel({ tool, currentStyle, onStyleChange, hasSelection }) {
  const type = tool === "select" ? currentStyle.type : tool;
  const isMixed = currentStyle.isMultiple;
  const isText = isMixed ? currentStyle.hasText : (type === "text" || type === "i-text");
  const isPencil = type === "pencil" || type === "path";
  const isRect = type === "rect";
  const isCircle = type === "circle";
  const isShapeOrPencil = isMixed ? currentStyle.hasShape : (isPencil || isRect || isCircle);

  const shouldBeVisible = (tool !== "select" || hasSelection) && (isText || isShapeOrPencil);

  const [isRendered, setIsRendered] = useState(shouldBeVisible);
  const [isVisible, setIsVisible] = useState(shouldBeVisible);

  useEffect(() => {
    if (shouldBeVisible) {
      setIsRendered(true);
      const raf = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 150); // matches closing duration
      return () => clearTimeout(timer);
    }
  }, [shouldBeVisible]);

  const handleChange = (property, value, isFinal = true) => {
    onStyleChange(property, value, isFinal);
  };

  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // Auto-open on mobile when switching tools or selecting objects
    setIsOpen(true);
  }, [tool, hasSelection]);

  if (!isRendered) return null;

  return (
    <>
      {/* Collapsed Mobile Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="sm:hidden absolute top-20 left-4 z-10 p-2.5 bg-white shadow-lg shadow-slate-200/50 rounded-xl border border-slate-200 text-blue-600 animate-in fade-in zoom-in duration-200"
        >
          <Palette size={20} />
        </button>
      )}

      {/* Main Panel */}
      <div className={`absolute sm:top-20 sm:left-4 top-[72px] left-2 right-2 sm:right-auto z-10 sm:w-[300px] bg-white shadow-xl shadow-slate-200/50 border border-slate-100 rounded-2xl p-4 sm:p-5 flex-col gap-4 sm:gap-4 overflow-y-auto max-h-[calc(100vh-100px)] sm:max-h-[calc(100vh-120px)] hide-scrollbar transition-all origin-top-left ${isOpen ? 'flex' : 'hidden sm:flex'} ${isVisible ? 'opacity-100 translate-x-0 scale-100 duration-[200ms] ease-out' : 'opacity-0 translate-x-3 scale-[0.98] duration-[150ms] ease-in'}`}>
        
        {/* Mobile Header with Close Button */}
        <div className="flex sm:hidden items-center justify-between mb-[-5px]">
          <span className="font-bold text-slate-700 text-[13px] tracking-wide">Style Options</span>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      
        {isShapeOrPencil && (
        <>
          {/* Stroke Color */}
          <div className="flex flex-col gap-2 sm:gap-3">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 tracking-wider">STROKE</span>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color, index) => (
                <button
                  key={color}
                  onClick={() => handleChange("strokeColor", color)}
                  className={`w-[28px] h-[28px] sm:w-[34px] sm:h-[34px] rounded-lg border transition-all ${index >= 3 ? 'hidden sm:block' : ''} ${
                    currentStyle.strokeColor === color 
                      ? "ring-2 ring-blue-500 ring-offset-1 border-transparent" 
                      : "border-slate-200 hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <div 
                className={`relative w-[28px] h-[28px] sm:w-[34px] sm:h-[34px] rounded-lg border transition-all ${
                  !COLORS.includes(currentStyle.strokeColor) 
                    ? "ring-2 ring-blue-500 ring-offset-1 border-transparent" 
                    : "border-slate-200 hover:scale-105"
                }`}
                style={{ 
                  backgroundColor: !COLORS.includes(currentStyle.strokeColor) ? currentStyle.strokeColor : "#f8f9fa",
                  backgroundImage: !COLORS.includes(currentStyle.strokeColor) ? 'none' : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'
                }}
                title="Custom Color"
              >
                <input 
                  type="color" 
                  value={currentStyle.strokeColor || "#000000"}
                  onChange={(e) => handleChange("strokeColor", e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Background Color */}
          {(isRect || isCircle || isMixed) && (
            <div className="flex flex-col gap-2 sm:gap-3">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 tracking-wider">BACKGROUND</span>
              <div className="flex flex-wrap gap-2">
                {BG_COLORS.map((color, index) => (
                  <button
                    key={color}
                    onClick={() => handleChange("backgroundColor", color)}
                    className={`w-[28px] h-[28px] sm:w-[34px] sm:h-[34px] rounded-lg border relative transition-all ${index >= 3 && color !== 'transparent' ? 'hidden sm:block' : ''} ${
                      currentStyle.backgroundColor === color 
                        ? "ring-2 ring-blue-500 ring-offset-1 border-transparent" 
                        : "border-slate-200 hover:scale-105"
                    }`}
                    style={{ 
                      backgroundColor: color === "transparent" ? "transparent" : color,
                      backgroundImage: color === "transparent" ? 'url("data:image/svg+xml,%3Csvg width=\'10\' height=\'10\' viewBox=\'0 0 10 10\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h5v5H0V0zm5 5h5v5H5V5z\' fill=\'%23e5e7eb\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' : 'none'
                    }}
                    title={color === "transparent" ? "Transparent" : color}
                  />
                ))}
                <div 
                  className={`relative w-[28px] h-[28px] sm:w-[34px] sm:h-[34px] rounded-lg border transition-all ${
                    !BG_COLORS.includes(currentStyle.backgroundColor) 
                      ? "ring-2 ring-blue-500 ring-offset-1 border-transparent" 
                      : "border-slate-200 hover:scale-105"
                  }`}
                  style={{ 
                    backgroundColor: !BG_COLORS.includes(currentStyle.backgroundColor) ? currentStyle.backgroundColor : "#f8f9fa",
                    backgroundImage: !BG_COLORS.includes(currentStyle.backgroundColor) ? 'none' : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'
                  }}
                  title="Custom Background Color"
                >
                  <input 
                    type="color" 
                    value={currentStyle.backgroundColor !== "transparent" ? currentStyle.backgroundColor : "#ffffff"}
                    onChange={(e) => handleChange("backgroundColor", e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stroke Width */}
          <div className="flex flex-col gap-2 sm:gap-3">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 tracking-wider">STROKE WIDTH</span>
            <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
              {[
                { value: 1, label: "Thin" },
                { value: 3, label: "Medium" },
                { value: 5, label: "Thick" }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleChange("strokeWidth", opt.value)}
                  className={`flex-1 flex items-center justify-center py-1.5 sm:py-2 rounded-lg text-[12px] sm:text-[13px] transition-all font-medium ${
                    currentStyle.strokeWidth === opt.value 
                      ? "bg-white text-blue-600 shadow-sm border border-slate-200" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stroke Style - Hidden on Mobile */}
          <div className="hidden sm:flex flex-col gap-3">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider">STROKE STYLE</span>
            <div className="flex gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              {[
                { value: "solid", label: "Solid" },
                { value: "dashed", label: "Dashed" },
                { value: "dotted", label: "Dotted" }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleChange("strokeStyle", opt.value)}
                  className={`flex-1 flex items-center justify-center py-2 rounded-lg text-[13px] transition-all font-medium ${
                    currentStyle.strokeStyle === opt.value 
                      ? "bg-white text-blue-600 shadow-sm border border-slate-200" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Edges - Hidden on Mobile */}
          {(isRect || isMixed) && (
            <div className="hidden sm:flex flex-col gap-3">
              <span className="text-[11px] font-bold text-slate-500 tracking-wider">EDGES</span>
              <div className="flex gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                {[
                  { value: "sharp", label: "Sharp" },
                  { value: "round", label: "Round" }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleChange("edgeStyle", opt.value)}
                    className={`flex-1 flex items-center justify-center py-2 rounded-lg text-[13px] transition-all font-medium ${
                      currentStyle.edgeStyle === opt.value 
                        ? "bg-white text-blue-600 shadow-sm border border-slate-200" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Opacity - Hidden on Mobile */}
          <div className="hidden sm:flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 tracking-wider">OPACITY</span>
              <span className="text-xs font-medium text-slate-400">{Math.round(currentStyle.opacity * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="1" 
              step="0.05"
              value={currentStyle.opacity}
              onChange={(e) => handleChange("opacity", parseFloat(e.target.value), false)}
              onMouseUp={(e) => handleChange("opacity", parseFloat(e.target.value), true)}
              onTouchEnd={(e) => handleChange("opacity", parseFloat(e.target.value), true)}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </>
      )}

      {isText && (
        <>
          {/* Text Color (Labeled as STROKE in reference) */}
          <div className="flex flex-col gap-2 sm:gap-3">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 tracking-wider">COLOR</span>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color, index) => (
                <button
                  key={color}
                  onClick={() => handleChange("textColor", color)}
                  className={`w-[28px] h-[28px] sm:w-[34px] sm:h-[34px] rounded-lg border transition-all ${index >= 3 ? 'hidden sm:block' : ''} ${
                    currentStyle.textColor === color 
                      ? "ring-2 ring-blue-500 ring-offset-1 border-transparent" 
                      : "border-slate-200 hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <div 
                className={`relative w-[28px] h-[28px] sm:w-[34px] sm:h-[34px] rounded-lg border transition-all ${
                  !COLORS.includes(currentStyle.textColor) 
                    ? "ring-2 ring-blue-500 ring-offset-1 border-transparent" 
                    : "border-slate-200 hover:scale-105"
                }`}
                style={{ 
                  backgroundColor: !COLORS.includes(currentStyle.textColor) ? currentStyle.textColor : "#f8f9fa",
                  backgroundImage: !COLORS.includes(currentStyle.textColor) ? 'none' : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'
                }}
                title="Custom Color"
              >
                <input 
                  type="color" 
                  value={currentStyle.textColor || "#000000"}
                  onChange={(e) => handleChange("textColor", e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Text Opacity - Hidden on Mobile */}
          <div className="hidden sm:flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 tracking-wider">OPACITY</span>
              <span className="text-xs font-medium text-slate-400">{Math.round(currentStyle.textOpacity * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="1" 
              step="0.05"
              value={currentStyle.textOpacity}
              onChange={(e) => handleChange("textOpacity", parseFloat(e.target.value), false)}
              onMouseUp={(e) => handleChange("textOpacity", parseFloat(e.target.value), true)}
              onTouchEnd={(e) => handleChange("textOpacity", parseFloat(e.target.value), true)}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Font Family - Reduced size on mobile */}
          <div className="flex flex-col gap-2 sm:gap-3">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 tracking-wider">FONT FAMILY</span>
            <div className="relative">
              <select
                value={currentStyle.fontFamily}
                onChange={(e) => handleChange("fontFamily", e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-1.5 sm:py-2.5 px-3 sm:px-4 pr-8 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-[12px] sm:text-[14px]"
                style={{ fontFamily: currentStyle.fontFamily }}
              >
                {FONT_FAMILIES.map(font => (
                  <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-800">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          {/* Font Size */}
          <div className="flex flex-col gap-2 sm:gap-3">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 tracking-wider">FONT SIZE</span>
            <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
              {[
                { value: 16, label: "S" },
                { value: 24, label: "M" },
                { value: 32, label: "L" },
                { value: 48, label: "XL" }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleChange("fontSize", opt.value)}
                  className={`flex-1 flex items-center justify-center py-1.5 sm:py-2 rounded-lg transition-all font-medium ${
                    currentStyle.fontSize === opt.value 
                      ? "bg-white text-blue-600 shadow-sm border border-slate-200" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span className="text-[13px]">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      
      </div>
    </>
  );
}

export default StylePanel;
