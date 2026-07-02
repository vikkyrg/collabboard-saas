import { useState } from "react";
import { joinRoom } from "../services/roomService";
import { useNavigate } from "react-router-dom";

function JoinRoomModal({ open, onClose }) {
  const navigate = useNavigate();

  const [inviteLink, setInviteLink] = useState("");

  if (!open) return null;

  const handleJoin = async () => {
    try {
      if (!inviteLink.trim()) {
        return alert("Paste invite link");
      }

      const url = new URL(inviteLink);

      const pathParts = url.pathname.split("/");
      const roomId = pathParts[pathParts.length - 1];

      const token = url.searchParams.get("token");

      if (!roomId || !token) {
        return alert("Invalid invite link");
      }

      await joinRoom(roomId, token);

      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error(error);
      alert("Unable to join room");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6">

        <h2 className="text-3xl font-bold text-[#04142C]">
          Join Room
        </h2>

        <p className="mt-2 text-slate-500">
          Paste the invite link shared by the host.
        </p>

        <textarea
          placeholder="Paste invite link here..."
          value={inviteLink}
          onChange={(e) => setInviteLink(e.target.value)}
          rows={4}
          className="mt-6 w-full rounded-xl border p-4 outline-none"
        />

        <button
          onClick={handleJoin}
          className="mt-4 w-full rounded-xl bg-[#04142C] p-4 text-white"
        >
          Join Room
        </button>

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-xl border p-4"
        >
          Close
        </button>

      </div>
    </div>
  );
}

export default JoinRoomModal;