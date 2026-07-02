import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../services/roomService";

function CreateRoomModal({ open, onClose, onCreated }) {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleCreate = async () => {
    try {
      if (!roomName.trim()) {
        alert("Room name is required");
        return;
      }

      setLoading(true);

      const data = await createRoom(roomName);

      await navigator.clipboard.writeText(
        data.inviteLink
      );

      if (onCreated) {
        await onCreated();
      }

      setRoomName("");
      onClose();

      navigate(`/room/${data.roomId}`);
    } catch (error) {
      console.error(error);

      const message =
        error?.response?.data?.message ||
        "Failed to create room";

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">

        <h2 className="text-2xl font-bold text-[#04142C]">
          Create Room
        </h2>

        <p className="mt-2 text-slate-500">
          Create a new collaboration room.
        </p>

        <input
          type="text"
          placeholder="Room Name"
          value={roomName}
          onChange={(e) =>
            setRoomName(e.target.value)
          }
          className="mt-5 w-full rounded-xl border border-slate-300 p-4 outline-none focus:border-[#04142C]"
        />

        <button
          onClick={handleCreate}
          disabled={loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#04142C] p-4 text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            "Create Room"
          )}
        </button>

        <button
          onClick={onClose}
          disabled={loading}
          className="mt-3 w-full rounded-xl border border-slate-300 p-3"
        >
          Cancel
        </button>

      </div>

    </div>
  );
}

export default CreateRoomModal;