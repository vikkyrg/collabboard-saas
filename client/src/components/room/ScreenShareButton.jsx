import { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { createCall } from "../../services/callService";
import socket from "../../services/socket";
import { Monitor, MonitorOff } from "lucide-react";

function ScreenShareButton({ roomId, onShareChange, }) {
    const [isSharing, setIsSharing] = useState(false);

    const screenClientRef = useRef(null);
    const screenTrackRef = useRef(null);
    useEffect(() => {
        const handleForceStop = () => {
            stopScreenShare();
        };

        socket.on("force_stop_screen_share", handleForceStop);

        return () => {
            socket.off("force_stop_screen_share", handleForceStop);
        };
    }, []);

    const startScreenShare = async () => {
        try {
            const screenUid = 900000000 + Math.floor(Math.random() * 899999999);

            const data = await createCall(roomId, screenUid);

            const screenClient = AgoraRTC.createClient({
                mode: "rtc",
                codec: "vp8",
            });

            screenClientRef.current = screenClient;

            await screenClient.join(
                data.appId,
                data.channel,
                data.token,
                data.uid
            );

            const screenTrack = await AgoraRTC.createScreenVideoTrack();

            screenTrackRef.current = screenTrack;

            await screenClient.publish(screenTrack);

            socket.emit("start_screen_share", {
                roomId,
                uid: screenUid,
            });

            screenTrack.on("track-ended", () => {
                stopScreenShare();
            });

            setIsSharing(true);
            onShareChange?.(true, { uid: screenUid, track: screenTrack });
        } catch (err) {
            console.error(err);
        }
    };

    const stopScreenShare = async () => {
        try {
            if (screenTrackRef.current) {
                await screenClientRef.current?.unpublish(screenTrackRef.current);

                screenTrackRef.current.stop();
                screenTrackRef.current.close();

                screenTrackRef.current = null;
            }

            await screenClientRef.current?.leave();
            screenClientRef.current = null;

            socket.emit("stop_screen_share", {
                roomId,
            });

            setIsSharing(false);
            onShareChange?.(false);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="relative group">
            <button
                onClick={isSharing ? stopScreenShare : startScreenShare}
                className={`flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-200 hover:-translate-y-0.5 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 shadow-sm cursor-pointer ${
                    isSharing
                        ? "bg-amber-500/20 border-amber-400/40 text-amber-300 hover:bg-amber-500/30"
                        : "bg-white/10 border-white/15 text-white hover:bg-white/15"
                }`}
            >
                {isSharing ? <MonitorOff className="w-[20px] h-[20px]" /> : <Monitor className="w-[20px] h-[20px]" />}
            </button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2.5 py-1.5 text-[11px] font-semibold text-white bg-slate-800 border border-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap shadow-lg z-50">
                {isSharing ? "Stop Sharing" : "Share Screen"}
            </span>
        </div>
    );
}

export default ScreenShareButton;