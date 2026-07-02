import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { deleteRoom } from "../services/roomService";
import ConfirmModal from "./ConfirmModal";

function RoomCard({ room, isOwner }) {
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(
        room.inviteLink
      );

      setShowCopyModal(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRoom(room._id);

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Failed to delete room");
    }
  };

  return (
    <>
      <div className="rounded-3xl bg-white p-6 shadow-md transition hover:shadow-xl">

        <h3 className="text-xl font-bold text-[#04142C]">
          {room.name}
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          {new Date(room.createdAt).toLocaleDateString()}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">

          <button
            onClick={() =>
              navigate(`/room/${room._id}`)
            }
            className="flex items-center gap-2 rounded-xl bg-[#04142C] px-4 py-2 text-white"
          >
            <ExternalLink size={16} />
            Open
          </button>

          <button
            onClick={copyInviteLink}
            className="flex items-center gap-2 rounded-xl border px-4 py-2"
          >
            <Copy size={16} />
            Copy Link
          </button>

            {isOwner && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="rounded-xl bg-red-500 px-4 py-2 text-white"
              >
                Delete
              </button>
            )}

        </div>
      </div>

      <ConfirmModal
        open={showDeleteModal}
        title="Delete Room"
        message="Are you sure you want to permanently delete this room?"
        onCancel={() =>
          setShowDeleteModal(false)
        }
        onConfirm={handleDelete}
        isDestructive={true}
      />

      <ConfirmModal
        open={showCopyModal}
        title="Link Copied"
        message="The invite link has been successfully copied to your clipboard!"
        confirmText="OK"
        onCancel={() => setShowCopyModal(false)}
        onConfirm={() => setShowCopyModal(false)}
      />
    </>
  );
}

export default RoomCard;