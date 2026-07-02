function ScreenShareView() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-100">
      <div
        id="screen-share-player"
        className="flex h-full w-full items-center justify-center rounded-xl"
      >
        <span className="text-slate-500">
          No one is sharing their screen
        </span>
      </div>
    </div>
  );
}

export default ScreenShareView;