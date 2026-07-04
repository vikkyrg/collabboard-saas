import { useState } from "react";
import { Copy, ArrowLeft, Users, Video, PhoneCall, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationBadge from "./NotificationBadge";
import ConfirmModal from "../ConfirmModal";

function RoomHeader({
  room,
  onStartCall,
  callActive,
  myRole,
  onToggleMembers,
  unreadMembersCount,
  // ── NEW: Audio call props ──
  onStartAudioCall,
  audioCallActive,
}) {
  const navigate = useNavigate();

  const [showCopyModal, setShowCopyModal] = useState(false);

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(room?.inviteLink);
      setShowCopyModal(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between shrink-0 z-20">
      
      {/* Left side: Room Name & Status */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
              {room?.name}
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">Collaborative Room</p>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2">
        {/* Members toggle for Tablet */}
        <button
          onClick={onToggleMembers}
          className="md:flex lg:hidden hidden relative items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors px-3 h-9 text-sm font-medium text-slate-700"
        >
          <NotificationBadge count={unreadMembersCount} />
          <Users size={16} />
          Members
        </button>

        {/* ── NEW: Audio Call button (host: start | member: join) ── */}
        {myRole === "host" && !audioCallActive && (
          <button
            onClick={onStartAudioCall}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors px-3 h-9 text-sm font-medium text-white shadow-sm shadow-blue-600/20"
          >
            <Mic size={16} />
            Start Audio
          </button>
        )}

        {audioCallActive && (
          <button
            onClick={onStartAudioCall}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors px-3 h-9 text-sm font-medium text-white shadow-sm shadow-blue-600/20"
          >
            <Mic size={16} />
            Join Audio
          </button>
        )}
        {/* ── END NEW ── */}

        {/* Existing: Video Call button (host: start | member: join) */}
        {myRole === "host" && !callActive && (
          <button
            onClick={onStartCall}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 transition-colors px-3 h-9 text-sm font-medium text-white shadow-sm shadow-emerald-600/20"
          >
            <Video size={16} />
            Start Video
          </button>
        )}

        {callActive && (
          <button
            onClick={onStartCall}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors px-3 h-9 text-sm font-medium text-white shadow-sm shadow-blue-600/20"
          >
            <Video size={16} />
            Join Video
          </button>
        )}
        
        <button
          onClick={copyInviteLink}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors px-3 h-9 text-sm font-medium text-slate-700 shadow-sm"
        >
          <Copy size={16} className="text-slate-400" />
          Invite
        </button>

        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors px-3 h-9 text-sm font-medium text-white shadow-sm shadow-slate-900/20 ml-1"
        >
          <ArrowLeft size={16} />
          Exit
        </button>
      </div>

      <ConfirmModal
        open={showCopyModal}
        title="Link Copied"
        message="The invite link has been successfully copied to your clipboard!"
        confirmText="OK"
        onCancel={() => setShowCopyModal(false)}
        onConfirm={() => setShowCopyModal(false)}
      />
    </div>
  );
}

export default RoomHeader;
