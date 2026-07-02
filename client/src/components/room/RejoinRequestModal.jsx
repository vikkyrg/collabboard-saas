import { UserCheck, UserX } from "lucide-react";

/**
 * Stacked non-blocking notifications shown to the HOST when removed users request to rejoin.
 *
 * Props:
 *   requests array of { userId, userName, roomId }
 *   onAllow(userId)
 *   onReject(userId)
 */
function RejoinRequestModal({ requests, onAllow, onReject }) {
  if (!requests || requests.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-3 pointer-events-none">
      {requests.map((request) => {
        const initials = request.userName
          ? request.userName.slice(0, 2).toUpperCase()
          : "?";

        // Generate a consistent avatar colour from the name
        const avatarColors = [
          "from-blue-500 to-indigo-600",
          "from-emerald-500 to-teal-600",
          "from-purple-500 to-violet-600",
          "from-amber-500 to-orange-600",
          "from-pink-500 to-rose-600",
          "from-cyan-500 to-sky-600",
        ];
        let colorSum = 0;
        for (let i = 0; i < (request.userName || "").length; i++) {
          colorSum += request.userName.charCodeAt(i);
        }
        const avatarGradient = avatarColors[colorSum % avatarColors.length];

        return (
          <div
            key={request.userId}
            className="w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 pointer-events-auto animate-in slide-in-from-right-8 fade-in duration-300"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 shrink-0 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-sm`}
              >
                <span className="text-white font-bold text-sm">{initials}</span>
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-slate-800 text-sm truncate">
                  {request.userName}
                </h4>
                <p className="text-xs text-slate-500 truncate">
                  wants to join the room
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onReject(request.userId)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold py-2 rounded-xl transition-colors"
              >
                <UserX size={14} />
                Reject
              </button>
              <button
                onClick={() => onAllow(request.userId)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
              >
                <UserCheck size={14} />
                Allow
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RejoinRequestModal;
