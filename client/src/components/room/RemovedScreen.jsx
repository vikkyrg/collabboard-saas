import { useState, useEffect } from "react";
import { ShieldX, Clock, XCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Dialog shown to a user who has been removed or is waiting for
 * host approval. Three states:
 *  - "removed"  → just kicked, show the modal with OK button
 *  - "waiting"  → awaiting host decision
 *  - "rejected" → host said no, allow retry
 */
function RemovedScreen({ state, userName, onRetry }) {
  const [dots, setDots] = useState("");
  const navigate = useNavigate();

  // Animate the ellipsis while waiting
  useEffect(() => {
    if (state !== "waiting") return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [state]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#04142C]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200/50 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
        {state === "removed" && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <ShieldX size={24} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              You have been removed from this room.
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              The host has removed you from the collaboration.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              OK
            </button>
          </>
        )}

        {state === "waiting" && (
          <>
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-blue-100" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Clock size={20} className="text-blue-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Waiting for Approval{dots}
            </h2>
            <p className="text-slate-500 text-sm mb-2">
              Your request to rejoin the room has been sent to the host.
            </p>
            <p className="text-slate-400 text-xs">Please wait while they review it.</p>
          </>
        )}

        {state === "rejected" && (
          <>
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <XCircle size={24} className="text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Request Rejected
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              The host has rejected your request to rejoin this room.
            </p>
            <div className="flex w-full gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-200 active:bg-slate-300"
              >
                Dashboard
              </button>
              <button
                onClick={onRetry}
                className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RemovedScreen;
