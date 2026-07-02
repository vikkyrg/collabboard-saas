import { useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function LocalVideoPlayer({ cameraTrack, cameraOn, micOn, myRole, isSpeaking, name }) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (cameraTrack && cameraOn && containerRef.current) {
            cameraTrack.play(containerRef.current, { fit: "cover", mirror: true });

            return () => {
                cameraTrack.stop();
            };
        }
    }, [cameraTrack, cameraOn]);

    const getInitials = (n) => {
        if (!n) return "Y";
        const parts = n.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return parts[0][0].toUpperCase();
    };

    return (
        <div className={`relative w-full aspect-video overflow-hidden rounded-2xl bg-[#1a1f2e] border transition-all duration-300 hover:shadow-2xl pointer-events-auto ${
            isSpeaking
                ? "border-green-500/70 border-2 shadow-[0_0_20px_rgba(34,197,94,0.20)]"
                : "border-white/8 hover:border-white/15"
        }`}>
            {/* Status Badges */}
            <div className="absolute top-3 right-3 flex gap-1.5 z-20">
                {micOn ? (
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/10" title="Mic ON">
                        <Mic className="w-3.5 h-3.5 text-white/70" />
                    </div>
                ) : (
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20 border border-red-500/30" title="Mic OFF">
                        <MicOff className="w-3.5 h-3.5 text-red-400" />
                    </div>
                )}
                {cameraOn ? null : (
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/10" title="Camera OFF">
                        <VideoOff className="w-3.5 h-3.5 text-white/50" />
                    </div>
                )}
            </div>

            {/* Video or Placeholder */}
            {cameraOn && cameraTrack ? (
                <div ref={containerRef} className="h-full w-full bg-[#0d1117]" />
            ) : (
                <div className="flex flex-col h-full w-full items-center justify-center p-4 bg-[#1a1f2e]">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/25 to-indigo-500/25 text-3xl font-bold text-white border border-white/10 shadow-lg">
                        {getInitials(name)}
                    </div>
                    <span className="text-xs text-slate-400 font-medium mt-3 tracking-wide">
                        Camera Off
                    </span>
                </div>
            )}

            {/* Name Overlay & Speaking Indicator */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 text-xs text-white tracking-wide font-medium shadow-sm">
                <span className="max-w-[120px] truncate">{name || "You"} (You)</span>
                {isSpeaking && (
                    <div className="flex items-end gap-0.5 h-3 ml-1">
                        <span className="w-0.5 bg-green-400 rounded animate-bounce [animation-duration:0.8s] h-2.5" />
                        <span className="w-0.5 bg-green-400 rounded animate-bounce [animation-duration:0.5s] h-3.5" />
                        <span className="w-0.5 bg-green-400 rounded animate-bounce [animation-duration:0.7s] h-2" />
                    </div>
                )}
            </div>
        </div>
    );
}

function RemoteVideoPlayer({ user, isSpeaking }) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (user.videoTrack && user.cameraOn && containerRef.current) {
            user.videoTrack.play(containerRef.current, { fit: "cover", mirror: true });
            return () => {
                user.videoTrack.stop();
            };
        }
    }, [user.videoTrack, user.cameraOn]);

    const getInitials = (n) => {
        if (!n) return "?";
        const parts = n.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return parts[0][0].toUpperCase();
    };

    return (
        <div className={`relative w-full aspect-video overflow-hidden rounded-2xl bg-[#1a1f2e] border transition-all duration-300 hover:shadow-2xl pointer-events-auto ${
            isSpeaking
                ? "border-green-500/70 border-2 shadow-[0_0_20px_rgba(34,197,94,0.20)]"
                : "border-white/8 hover:border-white/15"
        }`}>
            {/* Status Badges */}
            <div className="absolute top-3 right-3 flex gap-1.5 z-20">
                {user.micOn ? (
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/10" title="Mic ON">
                        <Mic className="w-3.5 h-3.5 text-white/70" />
                    </div>
                ) : (
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20 border border-red-500/30" title="Mic OFF">
                        <MicOff className="w-3.5 h-3.5 text-red-400" />
                    </div>
                )}
                {user.cameraOn ? null : (
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/10" title="Camera OFF">
                        <VideoOff className="w-3.5 h-3.5 text-white/50" />
                    </div>
                )}
            </div>

            {/* Video or Placeholder */}
            {user.cameraOn && user.videoTrack ? (
                <div
                    ref={containerRef}
                    className="h-full w-full bg-[#0d1117]"
                />
            ) : (
                <div className="flex flex-col h-full w-full items-center justify-center p-4 bg-[#1a1f2e]">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/25 to-indigo-500/25 text-3xl font-bold text-white border border-white/10 shadow-lg">
                        {getInitials(user.name)}
                    </div>
                    <span className="text-xs text-slate-400 font-medium mt-3 tracking-wide">
                        Camera Off
                    </span>
                </div>
            )}

            {/* Name Overlay & Speaking Indicator */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 text-xs text-white tracking-wide font-medium shadow-sm">
                <span className="max-w-[120px] truncate">{user.name}</span>
                {isSpeaking && (
                    <div className="flex items-end gap-0.5 h-3 ml-1">
                        <span className="w-0.5 bg-green-400 rounded animate-bounce [animation-duration:0.8s] h-2.5" />
                        <span className="w-0.5 bg-green-400 rounded animate-bounce [animation-duration:0.5s] h-3.5" />
                        <span className="w-0.5 bg-green-400 rounded animate-bounce [animation-duration:0.7s] h-2" />
                    </div>
                )}
            </div>
        </div>
    );
}

function VideoGrid({
    remoteUsers = [],
    myRole,
    cameraTrack,
    cameraOn,
    micOn,
    isSidebar = false,
    localUid,
    localName,
    activeSpeakerUid,
}) {
    const totalUsers = remoteUsers.length + 1;
    const localIsSpeaking = localUid === activeSpeakerUid;

    if (isSidebar) {
        return (
            <div className="flex flex-row lg:flex-col gap-3 h-full overflow-auto no-scrollbar w-full pr-1 pb-1">
                <AnimatePresence mode="popLayout">
                    {/* Local Video */}
                    <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="w-48 sm:w-56 lg:w-full shrink-0"
                    >
                        <LocalVideoPlayer
                            cameraTrack={cameraTrack}
                            cameraOn={cameraOn}
                            micOn={micOn}
                            myRole={myRole}
                            isSpeaking={localIsSpeaking}
                            name={localName}
                        />
                    </motion.div>
                    {/* Remote Videos */}
                    {remoteUsers.map((user) => (
                        <motion.div 
                            key={user.uid} 
                            layout
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="w-48 sm:w-56 lg:w-full shrink-0"
                        >
                            <RemoteVideoPlayer 
                                user={user} 
                                isSpeaking={user.uid === activeSpeakerUid} 
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        );
    }

    let gridClass = "grid-cols-1 sm:grid-cols-2 gap-4";
    let containerClass = "grid w-full place-items-center overflow-auto no-scrollbar p-2 md:p-3 max-w-[1600px] mx-auto h-full";

    if (totalUsers === 1) {
        gridClass = "flex flex-col items-center justify-center w-full";
    } else if (totalUsers === 2) {
        gridClass = "grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-6xl mx-auto content-center";
    } else if (totalUsers === 3) {
        gridClass = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 w-full max-w-5xl mx-auto content-center [&>div:last-child]:lg:col-span-2 [&>div:last-child]:lg:w-1/2 [&>div:last-child]:lg:mx-auto";
    } else if (totalUsers === 4) {
        gridClass = "grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-5xl mx-auto content-center";
    } else if (totalUsers <= 6) {
        gridClass = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl mx-auto content-center";
    } else if (totalUsers <= 8) {
        gridClass = "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 w-full mx-auto content-center";
    } else {
        gridClass = "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 w-full mx-auto content-start";
    }

    const itemWrapperClass = totalUsers === 1 
        ? "w-full max-w-[900px] max-h-[600px]" 
        : "w-full";

    return (
        <div className={containerClass}>
            <div className={gridClass}>
                <AnimatePresence mode="popLayout">
                    {/* Local Video */}
                    <motion.div 
                        key="local"
                        layout
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className={itemWrapperClass}
                    >
                        <LocalVideoPlayer
                            cameraTrack={cameraTrack}
                            cameraOn={cameraOn}
                            micOn={micOn}
                            myRole={myRole}
                            isSpeaking={localIsSpeaking}
                            name={localName}
                        />
                    </motion.div>

                    {/* Empty State */}
                    {totalUsers === 1 && (
                        <motion.div 
                            key="empty-state"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, delay: 0.15 }}
                            className="mt-6 w-full max-w-sm"
                        >
                        </motion.div>
                    )}

                    {/* Remote Videos */}
                    {remoteUsers.map((user) => (
                        <motion.div 
                            key={user.uid} 
                            layout
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className={itemWrapperClass}
                        >
                            <RemoteVideoPlayer 
                                user={user} 
                                isSpeaking={user.uid === activeSpeakerUid} 
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default VideoGrid;