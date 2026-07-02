import { createCall } from "../../services/callService";
import socket from "../../services/socket";
import AgoraRTC from "agora-rtc-sdk-ng";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VideoGrid from "./video/VideoGrid";
import ScreenShareView from "./video/ScreenShareView";
import CallControls from "./video/CallControls";
import { useAuth } from "../../context/AuthContext";
import { Loader2, AlertCircle, Signal, Clock, Users, Copy, Check, Video } from "lucide-react";

AgoraRTC.setLogLevel(3); // Log warnings/errors only

const getNumericUidFromUserId = (userId) => {
  if (!userId) return 0;
  let hash = 5381;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 33) ^ userId.charCodeAt(i);
  }
  return (hash >>> 0) || 1;
};

const getFriendlyErrorMessage = (err) => {
  const msg = err?.message || String(err);
  if (msg.includes("NotAllowedError") || msg.includes("Permission denied")) {
    return "Microphone or camera permission was denied. Please update your browser settings.";
  }
  if (msg.includes("NotFoundError") || msg.includes("Requested device not found")) {
    return "Camera or microphone device not found. Please connect your hardware.";
  }
  if (msg.includes("NotReadableError") || msg.includes("Could not start video source")) {
    return "Camera is already in use by another application.";
  }
  if (msg.includes("INVALID_TOKEN") || msg.includes("token expired")) {
    return "Unable to connect: Token has expired or is invalid.";
  }
  return `Unable to connect: ${msg}`;
};

function VideoCallPanel({ roomId, room, myRole, onClose, members = [] }) {
  const { user: currentUser } = useAuth();
  const clientRef = useRef(null);
  const localTracksRef = useRef({ micTrack: null, cameraTrack: null });

  const [copied, setCopied] = useState(false);
  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  const [connecting, setConnecting] = useState(true);
  const [connectingStep, setConnectingStep] = useState("Initializing...");
  const [error, setError] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localScreenTrack, setLocalScreenTrack] = useState(null);
  const [remoteScreenTrack, setRemoteScreenTrack] = useState(null);
  const screenShareInfoRef = useRef({ uid: null, presenterUserId: null });
  const pendingScreenTracksRef = useRef({});
  const membersRef = useRef(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);
  const [remoteUsers, setRemoteUsers] = useState([]);

  // Local tracks state for React rendering
  const [localCameraTrack, setLocalCameraTrack] = useState(null);

  // Call metrics
  const [activeSpeakerUid, setActiveSpeakerUid] = useState(null);
  const [connState, setConnState] = useState("DISCONNECTED");
  const [networkQuality, setNetworkQuality] = useState("Excellent");
  const [duration, setDuration] = useState(0);

  const localUid = getNumericUidFromUserId(currentUser?.id || currentUser?._id);

  // Active screen track resolution (Local or Remote)
  const activeScreenTrack = localScreenTrack || remoteScreenTrack || remoteUsers.find((u) => u.screenTrack)?.screenTrack;
  const participantCount = remoteUsers.length + 1;

  // Map remote users to name and mic/camera state
  const resolvedParticipants = remoteUsers.map((user) => {
    const matchedMember = members?.find(
      (m) => getNumericUidFromUserId(m.userId) === user.uid
    );
    return {
      ...user,
      name: matchedMember ? matchedMember.name : `User ${user.uid}`,
      cameraOn: !user.videoMuted && !!user.videoTrack,
      micOn: !user.audioMuted && !!user.audioTrack,
    };
  });

  // Timer effect
  useEffect(() => {
    if (connecting) return;
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [connecting]);

  // Re-evaluate pending tracks whenever room members update
  useEffect(() => {
    if (!members || members.length === 0) return;
    Object.entries(pendingScreenTracksRef.current).forEach(([uidStr, track]) => {
      const numericUid = Number(uidStr);
      const isMember = members.some(
        (m) => getNumericUidFromUserId(m.userId) === numericUid
      );
      if (isMember) {
        setRemoteUsers((prev) => {
          const exists = prev.some((u) => u.uid === numericUid);
          if (exists) {
            return prev.map((u) => (u.uid === numericUid ? { ...u, videoTrack: track } : u));
          }
          return [
            ...prev,
            {
              uid: numericUid,
              videoTrack: track,
              name: `User ${numericUid}`,
            },
          ];
        });
        delete pendingScreenTracksRef.current[uidStr];
      }
    });
  }, [members]);

  const formatDuration = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [
      h > 0 ? String(h).padStart(2, '0') : null,
      String(m).padStart(2, '0'),
      String(s).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  useEffect(() => {
    let cancelled = false;
    let client = null;
    let localTracks = { micTrack: null, cameraTrack: null };

    const handleUserPublished = async (user, mediaType) => {
      if (cancelled) return;
      try {
        await client.subscribe(user, mediaType);
      } catch (err) {
        console.error("Failed to subscribe user:", user.uid, err);
        return;
      }

      if (cancelled) return;

      // 1. First check if published UID matches active screen share UID
      const isCurrentScreenShare =
        screenShareInfoRef.current?.uid &&
        String(user.uid) === String(screenShareInfoRef.current.uid);

      if (isCurrentScreenShare) {
        if (mediaType === "video" && user.videoTrack) {
          pendingScreenTracksRef.current[user.uid] = user.videoTrack;
          setRemoteScreenTrack(user.videoTrack);
          setIsScreenSharing(true);

          if (screenShareInfoRef.current?.presenterUserId) {
            const presenterUid = getNumericUidFromUserId(
              screenShareInfoRef.current.presenterUserId
            );
            setRemoteUsers((prev) =>
              prev.map((u) =>
                u.uid === presenterUid ? { ...u, screenTrack: user.videoTrack } : u
              )
            );
          }
        }
        return;
      }

      // 2. Check if published UID belongs to a known room member (Camera/Mic Client)
      const isMemberUid = membersRef.current?.some(
        (m) => getNumericUidFromUserId(m.userId) === user.uid
      );

      if (!isMemberUid) {
        if (
    screenShareInfoRef.current?.uid &&
    String(user.uid) === String(screenShareInfoRef.current.uid)
) {
    pendingScreenTracksRef.current[user.uid] = user.videoTrack;
    setRemoteScreenTrack(user.videoTrack);

    return;
}
        // Track published before socket event arrived - store in pending buffer
        if (mediaType === "video" && user.videoTrack) {
          pendingScreenTracksRef.current[user.uid] = user.videoTrack;
          setRemoteScreenTrack(user.videoTrack);
        }
        return;
      }

      // 3. Authenticated Room Member Camera/Microphone Track
      if (mediaType === "video") {
        setRemoteUsers((prev) => {
          const exists = prev.some((u) => u.uid === user.uid);
          if (exists) {
            return prev.map((u) =>
              u.uid === user.uid
                ? { ...u, videoTrack: user.videoTrack, videoMuted: user.videoMuted }
                : u
            );
          }
          return [
            ...prev,
            {
              uid: user.uid,
              videoTrack: user.videoTrack,
              audioTrack: user.audioTrack,
              videoMuted: user.videoMuted,
              audioMuted: user.audioMuted,
              name: `User ${user.uid}`,
            },
          ];
        });
      }

      if (mediaType === "audio") {
        user.audioTrack?.play();
        setRemoteUsers((prev) => {
          const exists = prev.some((u) => u.uid === user.uid);
          if (exists) {
            return prev.map((u) =>
              u.uid === user.uid
                ? { ...u, audioTrack: user.audioTrack, audioMuted: user.audioMuted }
                : u
            );
          }
          return [
            ...prev,
            {
              uid: user.uid,
              videoTrack: user.videoTrack,
              audioTrack: user.audioTrack,
              videoMuted: user.videoMuted,
              audioMuted: user.audioMuted,
              name: `User ${user.uid}`,
            },
          ];
        });
      }
    };

    const handleUserUnpublished = (user, mediaType) => {
      const isMemberUid = membersRef.current?.some(
        (m) => getNumericUidFromUserId(m.userId) === user.uid
      );

      if (!isMemberUid) {
        if (mediaType === "video") {
          delete pendingScreenTracksRef.current[user.uid];
          setRemoteScreenTrack(null);
          setRemoteUsers((prev) => prev.map((u) => ({ ...u, screenTrack: null })));
        }
        return;
      }

      if (mediaType === "video") {
        user.videoTrack?.stop();
        setRemoteUsers((prev) =>
          prev.map((u) => (u.uid === user.uid ? { ...u, videoTrack: null } : u))
        );
      }
      if (mediaType === "audio") {
        user.audioTrack?.stop();
        setRemoteUsers((prev) =>
          prev.map((u) => (u.uid === user.uid ? { ...u, audioTrack: null } : u))
        );
      }
    };

    const handleUserLeft = (user) => {
      const isMemberUid = membersRef.current?.some(
        (m) => getNumericUidFromUserId(m.userId) === user.uid
      );

      if (!isMemberUid) {
        delete pendingScreenTracksRef.current[user.uid];
        setRemoteScreenTrack(null);
        setRemoteUsers((prev) => prev.map((u) => ({ ...u, screenTrack: null })));
        return;
      }

      user.videoTrack?.stop();
      user.audioTrack?.stop();
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    };

    const handleUserMuteUpdated = (user) => {
      setRemoteUsers((prev) =>
        prev.map((u) =>
          u.uid === user.uid
            ? {
                ...u,
                videoMuted: user.videoMuted,
                audioMuted: user.audioMuted,
              }
            : u
        )
      );
    };

    const run = async () => {
      try {
        setConnectingStep("Connecting to Agora...");
        const data = await createCall(roomId, localUid);
        if (cancelled) return;

        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        if (cancelled) return;

        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);
        client.on("user-left", handleUserLeft);
        client.on("user-mute-updated", handleUserMuteUpdated);

        // Connection state & network quality events
        client.on("connection-state-change", (curState) => {
          if (!cancelled) setConnState(curState);
        });
        client.on("network-quality", (stats) => {
          if (cancelled) return;
          const q = stats.downlinkNetworkQuality;
          if (q === 1) setNetworkQuality("Excellent");
          else if (q === 2) setNetworkQuality("Good");
          else if (q === 3 || q === 4) setNetworkQuality("Poor");
          else if (q > 4) setNetworkQuality("Bad");
          else setNetworkQuality("Excellent");
        });

        // Hardware Disconnect/Reconnect Handlers
        AgoraRTC.onMicrophoneChanged = async (changedDevice) => {
          if (cancelled) return;
          if (changedDevice.state === "INACTIVE") {
            const { micTrack } = localTracksRef.current || {};
            if (micTrack) {
              try {
                await micTrack.setEnabled(false);
              } catch (e) {
                console.error("Error disabling mic on disconnect:", e);
              }
            }
            setMicOn(false);
            setError("Microphone disconnected or unavailable.");
          } else if (changedDevice.state === "ACTIVE") {
            setError(null);
          }
        };

        AgoraRTC.onCameraChanged = async (changedDevice) => {
          if (cancelled) return;
          if (changedDevice.state === "INACTIVE") {
            const { cameraTrack } = localTracksRef.current || {};
            if (cameraTrack) {
              try {
                await cameraTrack.setEnabled(false);
              } catch (e) {
                console.error("Error disabling camera on disconnect:", e);
              }
            }
            setCameraOn(false);
            setError("Camera disconnected or unavailable.");
          } else if (changedDevice.state === "ACTIVE") {
            setError(null);
          }
        };

        // Volume Indicator
        client.enableAudioVolumeIndicator();
        client.on("volume-indicator", (volumes) => {
          if (cancelled) return;
          let maxLevel = 0;
          let speakerUid = null;
          volumes.forEach((vol) => {
            const resolvedUid = vol.uid === 0 ? localUid : vol.uid;
            if (vol.level > maxLevel) {
              maxLevel = vol.level;
              speakerUid = resolvedUid;
            }
          });
          if (maxLevel > 8) {
            setActiveSpeakerUid(speakerUid);
          } else {
            setActiveSpeakerUid(null);
          }
        });

        setConnectingStep("Joining Meeting...");
        await client.join(
          data.appId,
          data.channel,
          data.token,
          data.uid
        );

        if (cancelled) {
          await client.leave();
          return;
        }

        setConnectingStep("Publishing Camera & Microphone...");
        const [micTrack, cameraTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();

        if (cancelled) {
          micTrack.close();
          cameraTrack.close();
          await client.leave();
          return;
        }

        localTracks.micTrack = micTrack;
        localTracks.cameraTrack = cameraTrack;

        // Bind references and trigger state updates only if not cancelled
        clientRef.current = client;
        localTracksRef.current = localTracks;
        setLocalCameraTrack(cameraTrack);

        await client.publish([micTrack, cameraTrack]);

        if (cancelled) {
          await client.unpublish([micTrack, cameraTrack]);
          micTrack.close();
          cameraTrack.close();
          if (clientRef.current === client) {
            clientRef.current = null;
            localTracksRef.current = { micTrack: null, cameraTrack: null };
            setLocalCameraTrack(null);
          }
          await client.leave();
          return;
        }

        if (myRole === "host") {
          socket.emit("start_call", {
            roomId,
          });
        }

        socket.emit("join_call", {
          roomId,
        });

        // Query active screen share status for late-join synchronization
        socket.emit("get_screen_share_status", { roomId }, (response) => {
          if (response?.presenter) {
            const { uid, userId } = response.presenter;
            screenShareInfoRef.current = { uid, presenterUserId: userId };
            setIsScreenSharing(true);

            const pendingTrack = pendingScreenTracksRef.current[uid];
            if (pendingTrack) {
              setRemoteScreenTrack(pendingTrack);
            }
          }
        });

        setConnecting(false);
      } catch (err) {
        console.error("Agora init failed:", err);
        if (!cancelled) {
          setError(getFriendlyErrorMessage(err));
          setConnecting(false);
        }
      }
    };

    socket.on("screen_share_started", ({ uid, userId }) => {
      screenShareInfoRef.current = { uid, presenterUserId: userId };
      setIsScreenSharing(true);

      // Check pending screen track buffer for instant resolution
      const pendingTrack = pendingScreenTracksRef.current[uid];
      if (pendingTrack) {
        setRemoteScreenTrack(pendingTrack);
      }

      const presenterNumericUid = getNumericUidFromUserId(userId);
      setRemoteUsers((prev) =>
        prev.map((u) =>
          u.uid === presenterNumericUid
            ? { ...u, screenTrack: pendingTrack || u.screenTrack }
            : u
        )
      );
    });

    socket.on("screen_share_stopped", () => {
      screenShareInfoRef.current = { uid: null, presenterUserId: null };
      setIsScreenSharing(false);
      setRemoteScreenTrack(null);
      setLocalScreenTrack(null);
      setRemoteUsers((prev) => prev.map((u) => ({ ...u, screenTrack: null })));
    });

    run();

    return () => {
      cancelled = true;

      if (localTracks.micTrack) {
        localTracks.micTrack.stop();
        localTracks.micTrack.close();
      }
      if (localTracks.cameraTrack) {
        localTracks.cameraTrack.stop();
        localTracks.cameraTrack.close();
      }

      if (client) {
        client.off("user-published", handleUserPublished);
        client.off("user-unpublished", handleUserUnpublished);
        client.off("user-left", handleUserLeft);
        client.off("user-mute-updated", handleUserMuteUpdated);
        if (client.connectionState !== "DISCONNECTED") {
          client.leave().catch((e) => console.error("Error leaving channel on cleanup:", e));
        }
      }

      if (clientRef.current === client) {
        clientRef.current = null;
        localTracksRef.current = { micTrack: null, cameraTrack: null };
        setLocalCameraTrack(null);
      }

      socket.off("screen_share_started");
      socket.off("screen_share_stopped");

      AgoraRTC.onMicrophoneChanged = null;
      AgoraRTC.onCameraChanged = null;
    };
  }, [roomId, myRole, members, currentUser]);

  const toggleMic = async () => {
    const { micTrack } = localTracksRef.current || {};
    if (!micTrack) return;

    try {
      await micTrack.setEnabled(!micOn);
      setMicOn(!micOn);
      setError(null);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  const toggleCamera = async () => {
    const { cameraTrack } = localTracksRef.current || {};
    if (!cameraTrack) return;

    try {
      await cameraTrack.setEnabled(!cameraOn);
      setCameraOn(!cameraOn);
      setError(null);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  const handleLeave = async () => {
    const { micTrack, cameraTrack } = localTracksRef.current || {};

    micTrack?.stop();
    cameraTrack?.stop();

    micTrack?.close();
    cameraTrack?.close();

    if (myRole === "host") {
      socket.emit("end_call", { roomId });
    } else {
      socket.emit("leave_call", { roomId });
    }

    try {
      await clientRef.current?.leave();
    } catch (e) {
      console.error("Error leaving client:", e);
    }
    
    localTracksRef.current = {
      micTrack: null,
      cameraTrack: null,
    };
    setLocalCameraTrack(null);
    setRemoteUsers([]);
    onClose();
    clientRef.current = null;
  };

  const presenterMember = members?.find((m) => m.userId === screenShareInfoRef.current?.presenterUserId);
  const presenterName = presenterMember
    ? presenterMember.userId === (currentUser?.id || currentUser?._id)
      ? "You"
      : presenterMember.name
    : "Someone";

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden pointer-events-none transition-colors duration-300">
      <AnimatePresence mode="wait">
        {connecting ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/45 backdrop-blur-[6px] pointer-events-auto"
          >
             <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4 border border-zinc-100 max-w-sm w-full mx-4"
             >
                <Loader2 className="w-8 h-8 text-[#FFB94A] animate-spin" />
                <span className="text-[#04142C] font-semibold tracking-wide text-sm text-center">
                  {connectingStep}
                </span>
                {error && (
                  <div className="mt-2 text-xs text-red-500 font-medium text-center">
                    {error}
                  </div>
                )}
             </motion.div>
          </motion.div>
        ) : (
          <motion.div 
             key="call-panel"
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.3, ease: "easeOut" }}
             className="flex flex-col flex-1 h-full w-full bg-transparent text-white relative z-10 pointer-events-none overflow-hidden"
          >

      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center bg-[#0F1117]/80 backdrop-blur-md border-b border-white/8 px-4 md:px-5 lg:px-6 py-2.5 relative z-10 w-full shrink-0 pointer-events-auto">
        {/* Left Stats */}
        <div className="flex items-center justify-self-start gap-3">
          <div className="flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 border border-white/10 h-7 shrink-0">
            <span className={`h-2 w-2 rounded-full shrink-0 ${
              connState === "CONNECTED"
                ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                : connState === "RECONNECTING"
                ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)] animate-pulse"
                : "bg-red-400"
            }`} />
            <span className="text-[10px] md:text-[11px] font-semibold text-white/80 leading-none">
              {connState === "CONNECTED" ? "Connected" : connState === "RECONNECTING" ? "Reconnecting" : "Disconnected"}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] text-white/40 font-medium shrink-0">
            <Clock className="w-3 h-3 text-white/30" />
            <span className="leading-none tabular-nums">{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Center Room Name */}
        <div className="flex items-center justify-self-center">
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[13px] font-semibold text-white/90 tracking-wide truncate max-w-[250px] leading-none">
              {room?.name || "Meeting Room"}
            </span>
            <button 
              onClick={handleCopyInvite}
              className="flex items-center justify-center h-6 w-6 rounded-md bg-white/8 hover:bg-white/12 text-white/50 hover:text-white/80 transition-colors border border-white/10 shrink-0"
              title="Copy Invite Link"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Right Stats */}
        <div className="flex items-center justify-self-end gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-[10px] md:text-[11px] border border-white/10 text-white/70 shrink-0 h-7">
            <Users className="w-3 h-3 text-white/40" />
            <span className="font-semibold leading-none">{participantCount}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-[10px] md:text-[11px] border border-white/10 text-white/70 shrink-0 h-7">
            <Signal className="w-3 h-3 text-white/40" />
            <span className="font-medium leading-none">{networkQuality}</span>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-hidden px-3 py-3 relative min-h-0 flex flex-col z-10 max-w-[1600px] mx-auto w-full pointer-events-none">
        {/* Reconnecting Overlay */}
        {connState === "RECONNECTING" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-amber-500/10 border border-amber-400/20 px-5 py-2.5 shadow-xl backdrop-blur-xl animate-in slide-in-from-top-5 fade-in duration-300 pointer-events-auto">
            <Loader2 className="animate-spin h-4 w-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-amber-300 tracking-wide leading-none">Reconnecting...</span>
              <span className="text-[10px] text-amber-400/60 mt-1 leading-none">Trying to restore meeting...</span>
            </div>
          </div>
        )}

        {/* Error Notification (Toast) */}
        {error && (
          <div className="absolute bottom-24 right-4 md:bottom-6 md:right-6 z-50 flex items-start gap-3 w-[340px] max-w-[calc(100vw-2rem)] rounded-xl bg-slate-900/95 border border-red-500/20 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-400">Meeting Alert</h4>
              <p className="text-[12px] text-white/60 mt-1 leading-relaxed">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-white/30 hover:text-white/70 p-1 rounded-lg hover:bg-white/8 transition-colors shrink-0"
              title="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}



        {isScreenSharing ? (
          <div className="flex flex-col lg:flex-row flex-1 gap-3 overflow-hidden h-full min-h-0 pb-24 md:pb-24 pointer-events-none">
            <div className="flex-1 min-h-[260px] lg:min-h-0 relative h-full bg-[#0d1117] rounded-2xl shadow-xl border border-white/8 overflow-hidden pointer-events-auto">
              <ScreenShareView videoTrack={activeScreenTrack} />
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white shadow-lg font-medium">
                🖥️ {presenterName} is presenting
              </div>
            </div>
            <div className="w-full lg:w-72 h-40 lg:h-full overflow-auto no-scrollbar shrink-0 pt-3 lg:pt-0 lg:pl-0 pointer-events-none">
              <VideoGrid
                remoteUsers={resolvedParticipants}
                myRole={myRole}
                cameraTrack={localCameraTrack}
                cameraOn={cameraOn}
                micOn={micOn}
                isSidebar={true}
                localUid={localUid}
                localName={currentUser?.name}
                activeSpeakerUid={activeSpeakerUid}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 h-full min-h-0 pb-24 pointer-events-none">
            <VideoGrid
              remoteUsers={resolvedParticipants}
              myRole={myRole}
              cameraTrack={localCameraTrack}
              cameraOn={cameraOn}
              micOn={micOn}
              isSidebar={false}
              localUid={localUid}
              localName={currentUser?.name}
              activeSpeakerUid={activeSpeakerUid}
            />
          </div>
        )}



        {/* Floating Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 pb-5" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))' }}>
          <div className="pointer-events-auto">
            <CallControls
              micOn={micOn}
              cameraOn={cameraOn}
              connecting={connecting}
              toggleMic={toggleMic}
              toggleCamera={toggleCamera}
              roomId={roomId}
              handleLeave={handleLeave}
              myRole={myRole}
              onScreenShareChange={(sharing, details) => {
                if (sharing && details) {
                  screenShareInfoRef.current = {
                    uid: details.uid,
                    presenterUserId: currentUser?.id || currentUser?._id,
                  };
                  if (details.track) {
                    setLocalScreenTrack(details.track);
                  }
                  setIsScreenSharing(true);
                } else {
                  screenShareInfoRef.current = { uid: null, presenterUserId: null };
                  setLocalScreenTrack(null);
                  setIsScreenSharing(false);
                }
              }}
            />
          </div>
        </div>
      </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default VideoCallPanel;