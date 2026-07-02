import { ShieldAlert, User, UserMinus, X } from "lucide-react";

/**
 * MemberPanel — lists active room members.
 * When myRole === "host", a remove button is shown next to each non-host member.
 *
 * Props:
 *   members      array  — active presence members
 *   hideTitle    bool   — suppress the header (used in tablet drawer)
 *   myRole       string — "host" | "member" | ""
 *   onRemoveUser func   — (userId, userName) => void — called when host clicks remove
 */
function MemberPanel({ members, hideTitle = false, myRole = "", onRemoveUser, onClose }) {
  // Helper to generate a consistent color based on name
  const getAvatarColor = (name) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-emerald-100 text-emerald-700",
      "bg-purple-100 text-purple-700",
      "bg-amber-100 text-amber-700",
      "bg-pink-100 text-pink-700",
      "bg-cyan-100 text-cyan-700",
    ];
    let sum = 0;
    for (let i = 0; i < (name || "").length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  return (
    <div className="h-full overflow-y-auto bg-white p-4">
      {!hideTitle && (
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Room Members
          </h2>
          <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
            {members?.length || 0}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-auto p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Close panel"
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}

      <div className="space-y-1">
        {!members || members.length === 0 ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl">
                <div className="w-10 h-10 rounded-full skeleton shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 rounded-md skeleton" />
                  <div className="h-3 w-16 rounded-md skeleton" />
                </div>
              </div>
            ))}
          </>
        ) : (
          members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-2.5 rounded-xl"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(member.name)}`}>
                    {member.name ? member.name.charAt(0).toUpperCase() : <User size={16} />}
                  </div>
                  {/* Online Indicator */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800 text-sm truncate">
                    {member.name || "Unknown User"}
                  </h3>
                  <p className="text-xs text-slate-500 capitalize flex items-center gap-1">
                    {member.role === "host" ? (
                      <ShieldAlert size={12} className="text-blue-500" />
                    ) : null}
                    {member.role}
                  </p>
                </div>
              </div>

              {/* Remove button — only visible to host, only for non-host members */}
              {myRole === "host" && member.role !== "host" && onRemoveUser && (
                <button
                  id={`remove-member-${member.userId}`}
                  title={`Remove ${member.name || "user"}`}
                  onClick={() => onRemoveUser(member.userId, member.name || "User")}
                  className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 shrink-0"
                >
                  <UserMinus size={15} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MemberPanel;
