import React from "react";

function NotificationBadge({ count }) {
  if (!count || count <= 0) return null;
  const displayCount = count > 99 ? "99+" : count;
  
  return (
    <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] h-[20px] flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in duration-200 z-10 pointer-events-none select-none leading-none">
      {displayCount}
    </div>
  );
}

export default NotificationBadge;
