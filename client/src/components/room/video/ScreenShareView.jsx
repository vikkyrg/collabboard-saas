import { useEffect, useRef } from "react";

function ScreenShareView({ videoTrack }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (videoTrack && containerRef.current) {
      videoTrack.play(containerRef.current, { fit: "contain", mirror: false });
      return () => {
        videoTrack.stop();
      };
    }
  }, [videoTrack]);

  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 shadow-2xl relative">
      {videoTrack ? (
        <div
          ref={containerRef}
          className="h-full w-full rounded-2xl"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="animate-pulse flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-white">
            🖥️
          </div>
          <span className="text-sm font-medium tracking-wide">
            Connecting screen presentation...
          </span>
        </div>
      )}
    </div>
  );
}

export default ScreenShareView;