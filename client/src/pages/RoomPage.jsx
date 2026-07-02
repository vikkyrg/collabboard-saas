import { useEffect, useState, useCallback, useRef } from "react";
import socket from "../services/socket";
import { useParams } from "react-router-dom";
import VideoCallPanel from "../components/room/VideoCallPanel";
import { getRoomById } from "../services/roomService";

import { useAuth } from "../context/AuthContext";
import NotificationBadge from "../components/room/NotificationBadge";
import RoomHeader from "../components/room/RoomHeader";
import MemberPanel from "../components/room/MemberPanel";
import ChatPanel from "../components/room/ChatPanel";
import AIChatPanel from "../components/room/AIChatPanel";
import Whiteboard from "../components/whiteboard/Whiteboard";
import RemovedScreen from "../components/room/RemovedScreen";
import RejoinRequestModal from "../components/room/RejoinRequestModal";
import ConfirmModal from "../components/ConfirmModal";
import { MessageSquare, Users, Bot, PenTool, X, Check, LogOut } from "lucide-react";

function RoomPage() {
  const { roomId } = useParams();

  const [removeConfirm, setRemoveConfirm] = useState(null);

  const [room, setRoom] = useState(null);
  const [activeMembers, setActiveMembers] = useState([]);
  const [myRole, setMyRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [rightPanel, setRightPanel] = useState(null); // null, "chat", "ai"
  const [mobileTab, setMobileTab] = useState("canvas"); // "canvas", "chat", "ai", "members"

  // Notification States
  const [unreadMembersCount, setUnreadMembersCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Toasts State
  const [toasts, setToasts] = useState([]);

  const { user: currentUser } = useAuth();
  const panelStateRef = useRef({ showMembers, rightPanel, mobileTab, userId: currentUser?.id });

  useEffect(() => {
    panelStateRef.current = { showMembers, rightPanel, mobileTab, userId: currentUser?.id };
  }, [showMembers, rightPanel, mobileTab, currentUser?.id]);

  // Reset Badges when panels open
  useEffect(() => {
    if (showMembers || mobileTab === "members") {
      setUnreadMembersCount(0);
    }
  }, [showMembers, mobileTab]);

  useEffect(() => {
    if (rightPanel === "chat" || mobileTab === "chat") {
      setUnreadChatCount(0);
    }
  }, [rightPanel, mobileTab]);

  // ─── Moderation State ───────────────────────────────────────────────────────
  // null | "removed" | "waiting" | "rejected"
  const [removedState, setRemovedState] = useState(null);

  // Queue of pending rejoin requests (host side): [{ userId, userName, roomId }, ...]
  const [rejoinQueue, setRejoinQueue] = useState([]);

  // Derived: the request the host is currently looking at (first in queue)
  const currentRejoinRequest = rejoinQueue[0] || null;
  // ────────────────────────────────────────────────────────────────────────────

  const addToast = (message, type = "join") => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const loadRoom = async () => {
    try {
      const data = await getRoomById(roomId);
      setRoom(data.room);
      setMyRole(data.myRole);
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to load room");
    } finally {
      setLoading(false);
    }
  };

  // ─── Socket join helper ──────────────────────────────────────────────────────
  // Extracted so it can be called both on mount and after approval
  const doSocketJoin = useCallback(() => {
    const token = localStorage.getItem("token");
    socket.auth = { token };
    
    const join = () => {
      socket.emit("join_room", { roomId, token }, (response) => {
        if (response && response.success) {
          setActiveMembers(
            (response.users || []).map((u) => ({
              ...u,
              name: u.name || u.userName || "Unknown",
            }))
          );
          if (response.role) setMyRole(response.role);
          setRemovedState(null);
        } else if (response && response.removed) {
          setRemovedState("waiting");
        } else {
          console.error("Failed to join room via socket:", response?.message);
        }
      });
    };

    socket.on("connect", join);

    if (socket.connected) {
      join();
    } else {
      socket.connect();
    }
    
    return () => {
      socket.off("connect", join);
    };
  }, [roomId]);
  // ────────────────────────────────────────────────────────────────────────────

  // ─── Host: remove a live member ─────────────────────────────────────────────
  const handleRemoveUser = useCallback(
    (userId, userName) => {
      setRemoveConfirm({ userId, userName });
    },
    []
  );

  const confirmRemoveUser = useCallback(() => {
    if (!removeConfirm) return;
    socket.emit("host_remove_user", { roomId, userId: removeConfirm.userId }, (response) => {
      if (!response?.success) {
        console.error("Remove failed:", response?.message);
      }
    });
    setRemoveConfirm(null);
  }, [roomId, removeConfirm]);

  // ─── Host: approve a rejoin request ─────────────────────────────────────────
  const handleAllowRejoin = useCallback((targetUserId) => {
    if (!targetUserId) return;
    socket.emit("host_approve_rejoin", { roomId, userId: targetUserId }, (response) => {
      if (response?.success) {
        // Remove this request from the queue
        setRejoinQueue((prev) => prev.filter((r) => r.userId !== targetUserId));
      }
    });
  }, [roomId]);

  // ─── Host: reject a rejoin request ──────────────────────────────────────────
  const handleRejectRejoin = useCallback((targetUserId) => {
    if (!targetUserId) return;
    socket.emit("host_reject_rejoin", { roomId, userId: targetUserId }, (response) => {
      if (response?.success) {
        setRejoinQueue((prev) => prev.filter((r) => r.userId !== targetUserId));
      }
    });
  }, [roomId]);

  // ─── Removed user: retry joining ────────────────────────────────────────────
  const handleRetryJoin = useCallback(() => {
    setRemovedState("waiting");
    doSocketJoin();
  }, [doSocketJoin]);

  useEffect(() => {
    loadRoom();
    const cleanupJoin = doSocketJoin();

    socket.emit("get_call_status", { roomId }, ({ active }) => {
      setCallActive(active);
    });

    socket.on("call_started", () => setCallActive(true));
    socket.on("call_ended", () => {
      setCallActive(false);
      setShowVideo(false);
    });

    const handleUserJoined = (user) => {
      if (!user || !user.userId) return;
      
      const { showMembers: currentShowMembers, mobileTab: currentMobileTab, userId: currentUserId } = panelStateRef.current;
      
      // Increment unread members count if the user is not the current user and the panel is closed
      if (user.userId !== currentUserId && !currentShowMembers && currentMobileTab !== "members") {
        setUnreadMembersCount((prev) => prev + 1);
      }
      
      setActiveMembers((prev) => {
        if (prev.find((m) => m.userId === user.userId)) return prev;
        return [...prev, { ...user, name: user.name || user.userName || "Unknown" }];
      });
      addToast(`${user.name || user.userName || "Unknown"} joined the collaboration`, "join");
    };

    const handleUserLeft = (data) => {
      if (!data || !data.userId) return;
      setActiveMembers((prev) => {
        const member = prev.find((m) => m.userId === data.userId);
        if (member) {
          addToast(`${member.name || "Unknown"} left the room`, "leave");
        }
        return prev.filter((m) => m.userId !== data.userId);
      });
    };

    // ── Moderation event listeners ──────────────────────────────────────────
    const handleYouWereRemoved = () => {
      setRemovedState("removed");
      // Clear member list from local perspective (we're out)
      setActiveMembers([]);
    };

    const handleRejoinRequest = (data) => {
      // Host receives a request — add to queue (deduplicate by userId)
      setRejoinQueue((prev) => {
        if (prev.find((r) => r.userId === data.userId)) return prev;
        return [...prev, data];
      });
    };

    const handleYouWereApproved = (data) => {
      // Re-admitted — restore full room state
      setRemovedState(null);
      if (data.users) {
        setActiveMembers(
          data.users.map((u) => ({ ...u, name: u.name || u.userName || "Unknown" }))
        );
      }
      if (data.role) setMyRole(data.role);
    };

    const handleYouWereRejected = () => {
      setRemovedState("rejected");
    };

    const handleNewChat = (message) => {
      const { rightPanel: currentRightPanel, mobileTab: currentMobileTab, userId: currentUserId } = panelStateRef.current;
      if (message.userId !== currentUserId && currentRightPanel !== "chat" && currentMobileTab !== "chat") {
        setUnreadChatCount((prev) => prev + 1);
      }
    };

    const handleRoomDeleted = (data) => {
      alert(data?.message || "This room has been deleted.");
      window.location.href = "/dashboard";
    };

    socket.on("chat_new", handleNewChat);
    socket.on("user_joined", handleUserJoined);
    socket.on("user_left", handleUserLeft);
    socket.on("you_were_removed", handleYouWereRemoved);
    socket.on("rejoin_request", handleRejoinRequest);
    socket.on("you_were_approved", handleYouWereApproved);
    socket.on("you_were_rejected", handleYouWereRejected);
    socket.on("room_deleted", handleRoomDeleted);
    // ────────────────────────────────────────────────────────────────────────

    return () => {
      cleanupJoin();
      socket.emit("leave_room", { roomId });
      socket.off("call_started");
      socket.off("call_ended");
      socket.off("chat_new", handleNewChat);
      socket.off("user_joined", handleUserJoined);
      socket.off("user_left", handleUserLeft);
      socket.off("you_were_removed", handleYouWereRemoved);
      socket.off("rejoin_request", handleRejoinRequest);
      socket.off("you_were_approved", handleYouWereApproved);
      socket.off("you_were_rejected", handleYouWereRejected);
      socket.off("room_deleted", handleRoomDeleted);
    };
  }, [roomId]);

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col bg-slate-50 overflow-hidden">
        {/* Header Skeleton */}
        <div className="h-16 border-b border-slate-200 bg-white px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-32 rounded-lg skeleton" />
            <div className="h-6 w-24 rounded-md skeleton hidden sm:block" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-28 rounded-xl skeleton hidden sm:block" />
            <div className="h-9 w-9 rounded-xl skeleton" />
            <div className="h-9 w-9 rounded-xl skeleton" />
          </div>
        </div>

        {/* Main Canvas Area Skeleton */}
        <div className="flex-1 relative flex bg-slate-50">
          <div className="absolute top-4 left-4 h-11 w-11 rounded-xl skeleton hidden sm:block shadow-sm" />
          <div className="absolute top-4 right-4 flex flex-col gap-2 hidden sm:flex">
            <div className="h-11 w-11 rounded-xl skeleton shadow-sm" />
            <div className="h-11 w-11 rounded-xl skeleton shadow-sm" />
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 h-14 w-80 rounded-2xl skeleton hidden sm:block shadow-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50 relative overflow-hidden">

      {!showVideo && (
        <RoomHeader
          room={room}
          myRole={myRole}
          callActive={callActive}
          onStartCall={() => setShowVideo(true)}
          onToggleMembers={() => setShowMembers(!showMembers)}
          unreadMembersCount={unreadMembersCount}
        />
      )}

      {/* Main Content Area - Full Screen Whiteboard */}
      <div className={`flex-1 relative flex flex-col min-h-0 w-full overflow-hidden ${showVideo ? 'hidden' : ''}`}>
        
        {/* Floating Toggle Buttons (Desktop) */}
        <div className="hidden sm:block absolute top-4 left-4 z-20">
          <button 
            onClick={() => setShowMembers(!showMembers)}
            className={`relative p-2.5 rounded-xl shadow-md border transition-colors ${showMembers ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            title="Room Members"
          >
            <NotificationBadge count={unreadMembersCount} />
            <Users size={20} />
          </button>
        </div>

        <div className="hidden sm:flex flex-col gap-2 absolute top-4 right-4 z-20">
          <button 
            onClick={() => setRightPanel(rightPanel === 'chat' ? null : 'chat')}
            className={`relative p-2.5 rounded-xl shadow-md border transition-colors ${rightPanel === 'chat' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            title="Chat"
          >
            <NotificationBadge count={unreadChatCount} />
            <MessageSquare size={20} />
          </button>
          <button 
            onClick={() => setRightPanel(rightPanel === 'ai' ? null : 'ai')}
            className={`p-2.5 rounded-xl shadow-md border transition-colors ${rightPanel === 'ai' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            title="AI Assistant"
          >
            <Bot size={20} />
          </button>
        </div>

        {/* Absolute Drawers */}
        {showMembers && (
          <div className="absolute top-0 left-0 h-full w-72 bg-white shadow-2xl z-30 border-r border-slate-200 flex flex-col animate-in slide-in-from-left-8 duration-200">
             <div className="flex items-center justify-between p-4 border-b border-slate-100">
               <h2 className="font-bold text-slate-800">Room Members</h2>
               <button onClick={() => setShowMembers(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                 <X size={20} />
               </button>
             </div>
             <div className="flex-1 overflow-hidden">
               <MemberPanel
                 members={activeMembers}
                 hideTitle
                 myRole={myRole}
                 onRemoveUser={handleRemoveUser}
               />
             </div>
          </div>
        )}

        {rightPanel && (
          <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-2xl z-30 border-l border-slate-200 flex flex-col animate-in slide-in-from-right-8 duration-200">
             <div className="flex items-center justify-between p-4 border-b border-slate-100">
               <h2 className="font-bold text-slate-800">{rightPanel === 'chat' ? 'Chat' : 'AI Assistant'}</h2>
               <button onClick={() => setRightPanel(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                 <X size={20} />
               </button>
             </div>
             <div className="flex-1 overflow-hidden flex flex-col">
               {rightPanel === 'chat' ? <ChatPanel roomId={roomId} /> : <AIChatPanel roomId={roomId} />}
             </div>
          </div>
        )}

        {/* Middle Canvas (Always present for md+, hidden on mobile if another tab is active) */}
        <main className={`absolute inset-0 z-0 ${mobileTab === 'canvas' ? 'flex flex-col' : 'hidden sm:flex sm:flex-col'}`}>
          <Whiteboard roomId={roomId} />
          
          {/* Toast Notifications Container */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
            {toasts.map((toast) => (
              <div 
                key={toast.id}
                className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-300"
              >
                {toast.type === "join" ? (
                  <div className="bg-emerald-100 p-1 rounded-full text-emerald-600 shrink-0">
                    <Check size={14} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="bg-slate-100 p-1 rounded-full text-slate-500 shrink-0">
                    <LogOut size={14} strokeWidth={2} />
                  </div>
                )}
                <p className="text-sm font-medium text-slate-700 truncate">{toast.message}</p>
              </div>
            ))}
          </div>
        </main>

        {/* Mobile Overlays for Chat/AI/Members */}
        <div className={`sm:hidden absolute inset-0 bg-white z-40 ${mobileTab !== 'canvas' ? 'flex flex-col' : 'hidden'}`}>
          {mobileTab === 'chat' && <ChatPanel roomId={roomId} />}
          {mobileTab === 'ai' && <AIChatPanel roomId={roomId} />}
          {mobileTab === 'members' && (
            <MemberPanel
              members={activeMembers}
              myRole={myRole}
              onRemoveUser={handleRemoveUser}
            />
          )}
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className={`sm:hidden flex border-t border-slate-200 bg-white shrink-0 items-center justify-around p-2 pb-safe z-20 ${showVideo ? 'hidden' : ''}`}>
         <button onClick={() => setMobileTab("canvas")} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${mobileTab === 'canvas' ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}>
            <PenTool size={20} />
            <span className="text-[10px] font-medium mt-1">Canvas</span>
         </button>
         <button onClick={() => setMobileTab("chat")} className={`relative flex flex-col items-center p-2 rounded-xl transition-colors ${mobileTab === 'chat' ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}>
            <div className="relative">
              <NotificationBadge count={unreadChatCount} />
              <MessageSquare size={20} />
            </div>
            <span className="text-[10px] font-medium mt-1">Chat</span>
         </button>
         <button onClick={() => setMobileTab("ai")} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${mobileTab === 'ai' ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}>
            <Bot size={20} />
            <span className="text-[10px] font-medium mt-1">AI</span>
         </button>
         <button onClick={() => setMobileTab("members")} className={`relative flex flex-col items-center p-2 rounded-xl transition-colors ${mobileTab === 'members' ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}>
            <div className="relative">
              <NotificationBadge count={unreadMembersCount} />
              <Users size={20} />
            </div>
            <span className="text-[10px] font-medium mt-1">Members</span>
         </button>
      </div>

      {showVideo && (
        <VideoCallPanel
          roomId={roomId}
          room={room}
          myRole={myRole}
          callActive={callActive}
          setCallActive={setCallActive}
          onClose={() => setShowVideo(false)}
          members={activeMembers}
        />
      )}

      {/* ── Moderation Overlays ──────────────────────────────────────────────── */}

      {/* Removed/Waiting/Rejected screen — shown to the affected user */}
      {removedState && (
        <RemovedScreen
          state={removedState}
          onRetry={handleRetryJoin}
        />
      )}

      {/* Rejoin approval dialog — shown only to the host */}
      {myRole === "host" && rejoinQueue.length > 0 && (
        <RejoinRequestModal
          requests={rejoinQueue}
          onAllow={handleAllowRejoin}
          onReject={handleRejectRejoin}
        />
      )}
      {/* ──────────────────────────────────────────────────────────────────────── */}

      {/* Toast Notifications */}
      <div className={`absolute bottom-20 right-4 md:bottom-6 md:right-6 z-[100] flex flex-col gap-2 pointer-events-none ${showVideo ? 'hidden' : ''}`}>
        {toasts.map((toast) => (
          <div key={toast.id} className="bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-xl px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
            {toast.type === "join" ? (
              <span className="text-emerald-400 text-lg">✅</span>
            ) : (
              <span className="text-slate-400 text-lg">ℹ️</span>
            )}
            <span className="text-sm font-medium text-slate-200">
              {toast.message}
            </span>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={!!removeConfirm}
        title={`${window.location.host} says`}
        message={removeConfirm ? `Remove ${removeConfirm.userName} from the room?` : ""}
        confirmText="OK"
        onCancel={() => setRemoveConfirm(null)}
        onConfirm={confirmRemoveUser}
      />
    </div>
  );
}

export default RoomPage;
