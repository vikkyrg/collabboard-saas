import { useState, useEffect } from "react";
import socket from "../../services/socket";
import Toolbar from "./Toolbar";
import CanvasBoard from "./CanvasBoard";
import StylePanel from "./StylePanel";

function Whiteboard({ roomId }) {
  const [cursors, setCursors] = useState({});
  const [tool, setTool] = useState("pencil");
  const [currentStyle, setCurrentStyle] = useState({
    strokeColor: "#000000",
    backgroundColor: "transparent",
    strokeWidth: 3,
    strokeStyle: "solid",
    sloppiness: "smooth",
    edgeStyle: "sharp",
    opacity: 1,
    textColor: "#000000",
    fontFamily: "Inter, sans-serif",
    fontSize: 24,
    textAlign: "left",
    textOpacity: 1,
    isText: false,
    type: null
  });
  const [hasSelection, setHasSelection] = useState(false);
  useEffect(() => {
    const handleCursorMove = (data) => {
      if (!data.userId) return;

      setCursors((prev) => ({
        ...prev,
        [data.userId]: {
          ...(prev[data.userId] || {}),
          userId: data.userId,
          userName: data.userName,
          color: data.color,
          x: data.x,
          y: data.y,
        },
      }));
    };

    const handleUserJoined = (data) => {
      setCursors((prev) => ({
        ...prev,
        [data.userId]: {
          userId: data.userId,
          userName: data.userName,
          color: data.color,
          x: 0,
          y: 0,
        },
      }));
    };

    const handleUserLeft = (data) => {
      setCursors((prev) => {
        const copy = { ...prev };
        delete copy[data.userId];
        return copy;
      });
    };

    socket.on("cursor_moved", handleCursorMove);
    socket.on("user_joined", handleUserJoined);
    socket.on("user_left", handleUserLeft);

    return () => {
      socket.off("cursor_moved", handleCursorMove);
      socket.off("user_joined", handleUserJoined);
      socket.off("user_left", handleUserLeft);
    };
  }, []);
  useEffect(() => {
    const handleUsersLoaded = (event) => {
      const users = event.detail;

      const initialCursors = {};

      users.forEach((user) => {
        initialCursors[user.userId] = user;
      });

      setCursors(initialCursors);
    };

    window.addEventListener(
      "room-users-loaded",
      handleUsersLoaded
    );

    return () => {
      window.removeEventListener(
        "room-users-loaded",
        handleUsersLoaded
      );
    };
  }, []);

  useEffect(() => {
    const handleSelectionInfo = (e) => {
      if (e.detail) {
        setCurrentStyle(prev => ({
          ...prev,
          ...e.detail
        }));
      }
    };

    window.addEventListener("selection-info-updated", handleSelectionInfo);

    const handleChangeTool = (e) => setTool(e.detail);
    window.addEventListener("change-tool", handleChangeTool);

    return () => {
      window.removeEventListener("selection-info-updated", handleSelectionInfo);
      window.removeEventListener("change-tool", handleChangeTool);
    };
  }, []);

  const handleStyleChange = (property, value, isFinal = true) => {
    setCurrentStyle(prev => ({ ...prev, [property]: value }));
    window.dispatchEvent(new CustomEvent("update-selected-style", {
      detail: { property, value, isFinal }
    }));
  };

  return (
    <div className="relative flex h-full w-full min-h-0 bg-slate-50 overflow-hidden">

      <Toolbar
        tool={tool}
        setTool={setTool}
        hasSelection={hasSelection}
        onRemove={() =>
          window.dispatchEvent(
            new CustomEvent("remove-selected-shape")
          )
        }
        onSaveBoard={() =>
          window.dispatchEvent(
            new CustomEvent("save-board")
          )
        }
        onLoadBoard={() =>
          window.dispatchEvent(
            new CustomEvent("load-board")
          )
        }
      />

      <StylePanel 
        tool={tool} 
        currentStyle={currentStyle} 
        onStyleChange={handleStyleChange} 
        hasSelection={hasSelection}
      />

      <div className="absolute inset-0 z-0 w-full h-full">
        <CanvasBoard
          roomId={roomId}
          tool={tool}
          currentStyle={currentStyle}
          cursors={cursors}
          setHasSelection={setHasSelection}
        />
      </div>

    </div>
  );
}

export default Whiteboard;