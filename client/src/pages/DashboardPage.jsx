import { useEffect, useState } from "react";
import { Plus, Users, LogOut, Loader2, LayoutGrid } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "../assets/icon.png";

import { useAuth } from "../context/AuthContext";
import { getMyRooms } from "../services/roomService";

import RoomCard from "../components/RoomCard";
import CreateRoomModal from "../components/CreateRoomModal";
import JoinRoomModal from "../components/JoinRoomModal";

function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const loadRooms = async () => {
    try {
      const data = await getMyRooms();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F5F2EC] selection:bg-[#04142C]/10 text-[#04142C]">
      
      {/* Modal Components */}
      <CreateRoomModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={loadRooms}
      />

      <JoinRoomModal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />

      {/* Global SaaS Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-300/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4">
          
          <div className="flex items-center gap-1.5 text-2xl font-extrabold tracking-tight">
            <img src={heroImage} alt="CollabBoard Logo" className="h-8 w-auto object-contain" />
            <h1>Collab<span className="text-[#FFB94A]">Board</span></h1>
            <span className="hidden sm:inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 border border-zinc-200 ml-1">
              Workspace
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* User Presence Card */}
            <div className="hidden sm:block text-right border-r border-neutral-200 pr-4">
              <p className="text-sm font-bold leading-none">
                {user?.name}
              </p>
              <p className="mt-1 text-xs font-medium text-zinc-500">
                {user?.email}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="group flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:bg-red-50 hover:border-red-200 hover:text-red-600 active:scale-[0.98]"
            >
              <LogOut size={16} className="text-zinc-400 group-hover:text-red-500 transition-colors" />
              <span className="hidden xs:inline">Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main View Layout Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Welcome Section Header */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {user?.name || "Collaborator"}
          </h2>
          <p className="mt-1.5 text-sm sm:text-base text-zinc-600 font-medium">
            Create a pristine canvas environment or access an existing shared space.
          </p>
        </div>

        {/* Bento Board Action Grid */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">

          {/* Create Room Primary Grid Module */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="group relative flex flex-col justify-between rounded-2xl bg-[#04142C] p-6 sm:p-8 text-left text-white shadow-lg shadow-[#04142C]/10 transition-all hover:translate-y-[-2px] hover:shadow-xl hover:shadow-[#04142C]/20 active:scale-[0.99]"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white transition-transform group-hover:scale-110">
              <Plus size={24} />
            </div>
            <div className="mt-12 sm:mt-16">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                Create Room
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-neutral-300 font-medium">
                Launch a completely fresh infinite whiteboard with integrated AI assistance.
              </p>
            </div>
          </button>

          {/* Join Room Secondary Grid Module */}
          <button
            onClick={() => setShowJoinModal(true)}
            className="group relative flex flex-col justify-between rounded-2xl bg-white p-6 sm:p-8 text-left border border-neutral-300/80 shadow-md shadow-neutral-200/40 transition-all hover:translate-y-[-2px] hover:shadow-lg active:scale-[0.99]"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#04142C]/5 text-[#04142C] transition-transform group-hover:scale-110">
              <Users size={24} />
            </div>
            <div className="mt-12 sm:mt-16">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                Join Room
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-medium">
                Access a secure canvas live-session via an active workspace host key.
              </p>
            </div>
          </button>

        </div>

        {/* Existing Rooms Section Matrix */}
        <div className="mt-12 sm:mt-16">
          
          <div className="flex items-center gap-2 mb-6 border-b border-neutral-300/60 pb-3">
            <LayoutGrid size={20} className="text-zinc-500" />
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
              My Workspace Rooms
            </h3>
            <span className="ml-1.5 rounded-full bg-[#04142C]/10 px-2 py-0.5 text-xs font-bold">
              {rooms.length}
            </span>
          </div>

          {loading ? (
            /* Premium Core Grid Skeletal System Fallback */
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((placeholder) => (
                <div key={placeholder} className="h-44 rounded-2xl border border-neutral-200 bg-white/60 p-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="h-6 w-2/3 rounded-lg skeleton" />
                    <div className="h-4 w-1/2 rounded-md skeleton" />
                  </div>
                  <div className="h-9 w-full rounded-xl skeleton" />
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            /* Premium Centered Blank State Layout Overlay */
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/50 px-4 py-12 sm:py-16 text-center shadow-inner max-w-xl mx-auto mt-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-zinc-400 mb-4">
                <LayoutGrid size={22} />
              </div>
              <h4 className="text-lg font-bold tracking-tight">
                No active canvas rooms found
              </h4>
              <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-medium max-w-sm mx-auto">
                Your workspace dashboard is clear. Build a fresh studio above or query an invitation link to begin.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#04142C] px-4 py-2 text-xs font-bold text-white shadow transition hover:opacity-90"
              >
                <Plus size={14} />
                Create First Room
              </button>
            </div>
          ) : (
            /* Main Dashboard Core Render Grid Matrix Matrix */
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <RoomCard
                  key={room._id}
                  room={room}
                  isOwner={room.ownerId === user?.id}
                />
              ))}
            </div>
          )}

        </div>

      </main>

    </div>
  );
}

export default DashboardPage;