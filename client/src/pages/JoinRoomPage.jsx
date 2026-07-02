import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { joinRoom } from "../services/roomService";

function JoinRoomPage() {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const join = async () => {
      try {
        const token = searchParams.get("token");

        await joinRoom(roomId, token);

        navigate(`/room/${roomId}`);
      } catch (error) {
        console.error(error);
        alert("Unable to join room");
        navigate("/dashboard");
      }
    };

    join();
  }, [roomId]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      Joining room...
    </div>
  );
}

export default JoinRoomPage;