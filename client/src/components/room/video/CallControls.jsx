import ScreenShareButton from "../ScreenShareButton";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

function CallControls({
    micOn,
    cameraOn,
    connecting,
    toggleMic,
    toggleCamera,
    roomId,
    handleLeave,
    myRole,
    onScreenShareChange,
}) {
    return (
        <div className="flex items-center justify-center gap-2.5 py-3 px-5 rounded-full bg-[#1a1f2e]/90 backdrop-blur-md border border-white/10 shadow-2xl mx-auto max-w-[calc(100vw-2rem)] overflow-x-auto no-scrollbar">
                {/* Mic Control */}
                <div className="relative group">
                    <button
                        onClick={toggleMic}
                        disabled={connecting}
                        className={`flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-200 hover:-translate-y-0.5 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 shadow-sm cursor-pointer ${
                            micOn
                                ? "bg-white/10 border-white/15 text-white hover:bg-white/15"
                                : "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                        }`}
                    >
                        {micOn ? <Mic className="w-[20px] h-[20px]" /> : <MicOff className="w-[20px] h-[20px]" />}
                    </button>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2.5 py-1.5 text-[11px] font-semibold text-white bg-slate-800 border border-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap shadow-lg z-50">
                        {micOn ? "Mute Mic" : "Unmute Mic"}
                    </span>
                </div>

                {/* Camera Control */}
                <div className="relative group">
                    <button
                        onClick={toggleCamera}
                        disabled={connecting}
                        className={`flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-200 hover:-translate-y-0.5 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 shadow-sm cursor-pointer ${
                            cameraOn
                                ? "bg-white/10 border-white/15 text-white hover:bg-white/15"
                                : "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                        }`}
                    >
                        {cameraOn ? <Video className="w-[20px] h-[20px]" /> : <VideoOff className="w-[20px] h-[20px]" />}
                    </button>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2.5 py-1.5 text-[11px] font-semibold text-white bg-slate-800 border border-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap shadow-lg z-50">
                        {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
                    </span>
                </div>

                {/* Screen Share Control */}
                <ScreenShareButton
                    roomId={roomId}
                    onShareChange={onScreenShareChange}
                />


                {/* Leave Control */}
                <div className="relative group">
                    <button
                        onClick={handleLeave}
                        className="flex items-center justify-center w-14 h-12 rounded-[20px] border border-red-500 bg-red-500 text-white hover:bg-red-600 hover:-translate-y-0.5 active:scale-95 focus:outline-none shadow-md hover:shadow-lg hover:shadow-red-500/30 transition-all duration-200 cursor-pointer"
                    >
                        <PhoneOff className="w-[20px] h-[20px]" />
                    </button>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2.5 py-1.5 text-[11px] font-semibold text-white bg-slate-800 border border-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap shadow-lg z-50">
                        {myRole === "host" ? "End Meeting" : "Leave Meeting"}
                    </span>
                </div>
            </div>
    );
}

export default CallControls;