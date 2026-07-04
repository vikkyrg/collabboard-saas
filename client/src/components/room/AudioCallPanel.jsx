import { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { Mic, MicOff, PhoneOff, Volume2, Loader2, Users } from "lucide-react";
import { createCall } from "../../services/callService";
import socket from "../../services/socket";
import { useAuth } from "../../context/AuthContext";

AgoraRTC.setLogLevel(3);

const getNumericUidFromUserId = (userId) => {
  if (!userId) return 0;
  let hash = 5381;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 33) ^ userId.charCodeAt(i);
  }
  // Add an offset so audio UIDs never collide with video UIDs
  return ((hash >>> 0) | 0x80000000) >>> 0 || 0x80000001;
};

function AudioCallPanel({ roomId, myRole, members = [], onClose }) {
  const { user: currentUser } = useAuth();

  const clientRef = useRef(null);
  const micTrackRef = useRef(null);

  const [micOn, setMicOn] = useState(true);
  const [connecting, setConnecting] = useState(true);
  const [connectingStep, setConnectingStep] = useState("Initializing audio...");
  const [error, setError] = useState(null);
  const [speakingUids, setSpeakingUids] = useState(new Set());
  const [participantCount, setParticipantCount] = useState(1);
  // ── NEW: participants popup ──────────────────────────────────────────────────
  const [showParticipants, setShowParticipants] = useState(false);
  const [connectedUserIds, setConnectedUserIds] = useState(() => {
    // Start with self
    const selfId = currentUser?.id || currentUser?._id;
    return selfId ? new Set([selfId]) : new Set();
  });
  // ────────────────────────────────────────────────────────────────────────────

  const localUid = getNumericUidFromUserId(currentUser?.id || currentUser?._id);

  useEffect(() => {
    let cancelled = false;
    let client = null;
    let micTrack = null;

    const handleUserPublished = async (user, mediaType) => {
      if (cancelled || mediaType !== "audio") return;
      try {
        await client.subscribe(user, "audio");
        if (!cancelled) user.audioTrack?.play();
      } catch (err) {
        console.error("[AudioCall] Subscribe failed:", err);
      }
    };

    const handleUserUnpublished = (user, mediaType) => {
      if (mediaType === "audio") user.audioTrack?.stop();
    };

    const handleUserJoined = () => {
      if (!cancelled) setParticipantCount((prev) => prev + 1);
    };

    const handleUserLeft = () => {
      if (!cancelled) setParticipantCount((prev) => Math.max(1, prev - 1));
    };

    const run = async () => {
      try {
        setConnectingStep("Requesting microphone...");
        // Reuse the existing call token endpoint — same Agora app, different UID namespace
        const data = await createCall(roomId, localUid);
        if (cancelled) return;

        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);
        client.on("user-joined", handleUserJoined);
        client.on("user-left", handleUserLeft);

        // Volume indicator to show who is speaking
        client.enableAudioVolumeIndicator();
        client.on("volume-indicator", (volumes) => {
          if (cancelled) return;
          const active = new Set();
          volumes.forEach((v) => {
            if (v.level > 8) active.add(v.uid === 0 ? localUid : v.uid);
          });
          setSpeakingUids(active);
        });

        setConnectingStep("Joining audio channel...");
        await client.join(data.appId, data.channel, data.token, localUid);
        if (cancelled) { await client.leave(); return; }

        setConnectingStep("Opening microphone...");
        micTrack = await AgoraRTC.createMicrophoneAudioTrack();
        if (cancelled) {
          micTrack.close();
          await client.leave();
          return;
        }

        await client.publish([micTrack]);
        if (cancelled) {
          await client.unpublish([micTrack]);
          micTrack.close();
          await client.leave();
          return;
        }

        clientRef.current = client;
        micTrackRef.current = micTrack;

        // Notify room via socket
        if (myRole === "host") {
          socket.emit("start_audio_call", { roomId });
        }
        socket.emit("join_audio_call", { roomId });

        setConnecting(false);
      } catch (err) {
        console.error("[AudioCall] Init failed:", err);
        if (!cancelled) {
          const msg = err?.message || String(err);
          if (msg.includes("NotAllowedError") || msg.includes("Permission denied")) {
            setError("Microphone permission was denied. Please allow microphone access in your browser settings.");
          } else if (msg.includes("NotFoundError") || msg.includes("device not found")) {
            setError("No microphone found. Please connect a microphone and try again.");
          } else {
            setError(`Could not start audio: ${msg}`);
          }
          setConnecting(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;

      if (micTrack) {
        micTrack.stop();
        micTrack.close();
      }
      micTrackRef.current = null;

      if (client) {
        client.off("user-published", handleUserPublished);
        client.off("user-unpublished", handleUserUnpublished);
        client.off("user-joined", handleUserJoined);
        client.off("user-left", handleUserLeft);
        if (client.connectionState !== "DISCONNECTED") {
          client.leave().catch((e) => console.error("[AudioCall] Leave error:", e));
        }
      }
      clientRef.current = null;
    };
  }, [roomId, myRole, localUid]);

  // ── NEW: Track who joins/leaves the audio call via socket ───────────────────
  useEffect(() => {
    const onJoined = ({ userId }) => {
      setConnectedUserIds((prev) => new Set([...prev, userId]));
    };
    const onLeft = ({ userId }) => {
      setConnectedUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };
    socket.on("user_joined_audio_call", onJoined);
    socket.on("user_left_audio_call", onLeft);
    return () => {
      socket.off("user_joined_audio_call", onJoined);
      socket.off("user_left_audio_call", onLeft);
    };
  }, []);
  // ────────────────────────────────────────────────────────────────────────────

  // Microphone device disconnect handler
  useEffect(() => {
    AgoraRTC.onMicrophoneChanged = (device) => {
      if (device.state === "INACTIVE") {
        setMicOn(false);
        setError("Microphone disconnected.");
      } else {
        setError(null);
      }
    };
    return () => { AgoraRTC.onMicrophoneChanged = null; };
  }, []);

  const toggleMic = async () => {
    const track = micTrackRef.current;
    if (!track) return;
    try {
      await track.setEnabled(!micOn);
      setMicOn(!micOn);
      setError(null);
    } catch (err) {
      setError("Could not toggle microphone.");
    }
  };

  const handleLeave = async () => {
    const track = micTrackRef.current;
    if (track) {
      track.stop();
      track.close();
      micTrackRef.current = null;
    }

    if (myRole === "host") {
      socket.emit("end_audio_call", { roomId });
    } else {
      socket.emit("leave_audio_call", { roomId });
    }

    try {
      await clientRef.current?.leave();
    } catch (e) {
      console.error("[AudioCall] Leave error:", e);
    }
    clientRef.current = null;
    onClose();
  };

  // ─── Connecting screen ───────────────────────────────────────────────────────
  if (connecting) {
    return (
      <div className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[60] w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Loader2 size={20} className="text-blue-600 animate-spin" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-tight">Joining Audio</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{connectingStep}</p>
          {error && <p className="text-xs text-red-500 mt-1 leading-snug">{error}</p>}
        </div>
      </div>
    );
  }

  // ─── Error (no connection) ───────────────────────────────────────────────────
  if (error && !connecting) {
    return (
      <div className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[60] w-80 bg-white rounded-2xl shadow-2xl border border-red-200 p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <p className="text-sm font-semibold text-red-600 mb-1">Audio Error</p>
        <p className="text-xs text-slate-600 leading-snug mb-3">{error}</p>
        <button
          onClick={handleLeave}
          className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
        >
          Dismiss
        </button>
      </div>
    );
  }

  // ─── Connected: Floating audio control bar ──────────────────────────────────
  return (
    <div className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 px-3 py-2">

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 pl-1 pr-2 border-r border-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
          </span>
          <span className="text-xs font-semibold text-blue-700 whitespace-nowrap">Audio Live</span>
        </div>

        {/* Participant count — click to show/hide list */}
        <div className="relative">
          <button
            onClick={() => setShowParticipants((v) => !v)}
            title="Show participants"
            className={`flex items-center gap-1 pr-1 border-r border-slate-200 cursor-pointer rounded-lg px-1.5 py-1 transition-colors ${
              showParticipants ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users size={12} />
            <span className="text-xs font-medium">{participantCount}</span>
          </button>

          {/* Participants popup */}
          {showParticipants && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-10 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 pb-1 border-b border-slate-100">On this call</p>
              <ul className="max-h-40 overflow-y-auto">
                {Array.from(connectedUserIds).map((uid) => {
                  const isSelf = uid === (currentUser?.id || currentUser?._id);
                  const member = members.find((m) => m.userId === uid);
                  const name = isSelf
                    ? `${currentUser?.name || "You"} (You)`
                    : member?.name || "Unknown";
                  return (
                    <li key={uid} className="flex items-center gap-2 px-3 py-1.5">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold uppercase">
                        {name.charAt(0)}
                      </span>
                      <span className="text-xs text-slate-700 truncate">{name}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Speaker indicator */}
        <div
          title="Speaker active"
          className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
            speakingUids.size > 0 ? "bg-blue-100 text-blue-600" : "text-slate-400"
          }`}
        >
          <Volume2 size={14} />
        </div>

        {/* Mute / Unmute */}
        <button
          onClick={toggleMic}
          title={micOn ? "Mute microphone" : "Unmute microphone"}
          className={`flex items-center justify-center w-8 h-8 rounded-xl transition-colors ${
            micOn
              ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
              : "bg-red-100 hover:bg-red-200 text-red-600"
          }`}
        >
          {micOn ? <Mic size={15} /> : <MicOff size={15} />}
        </button>

        {/* Leave */}
        <button
          onClick={handleLeave}
          title={myRole === "host" ? "End audio call for everyone" : "Leave audio call"}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl px-3 h-8 text-xs font-semibold transition-colors shadow-sm shadow-red-600/30 whitespace-nowrap"
        >
          <PhoneOff size={13} />
          {myRole === "host" ? "End" : "Leave"}
        </button>
      </div>
    </div>
  );
}

export default AudioCallPanel;
