import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertCircle } from "lucide-react";

function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirm",
  onConfirm,
  onCancel,
  isDestructive = false,
  hideCancel = false,
}) {
  // Lock underlying viewport scrolling when modal frame is active
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#04142C]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200/50 animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()} // Stop bubble closing on inner click
      >
        <div className="flex items-start gap-3.5">
          {isDestructive && (
            <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100">
              <AlertCircle size={20} />
            </div>
          )}
          
          <div>
            <h2 
              id="modal-title" 
              className="text-xl font-extrabold text-[#04142C] tracking-tight"
            >
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 font-medium">
              {message}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex gap-3 sm:justify-end">
          {!hideCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-none sm:px-5 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50 hover:text-[#04142C] active:scale-[0.98]"
            >
              Cancel
            </button>
          )}
          
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 sm:flex-none sm:px-6 rounded-xl py-2.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700 shadow-red-600/10"
                : "bg-[#04142C] hover:bg-[#0b2144] shadow-[#04142C]/10"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmModal;