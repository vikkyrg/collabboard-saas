import api from "./axios";

export const createRoom = async (name) => {
  const response = await api.post("/rooms/create", {
    name,
  });

  return response.data;
};

export const getMyRooms = async () => {
  const response = await api.get("/rooms/list");
  return response.data;
};

export const joinRoom = async (roomId, token) => {
  const response = await api.post(`/rooms/${roomId}/join`, {
    token,
  });

  return response.data;
};

export const getRoomById = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}`);
  return response.data;
};

export const removeMember = async (
  roomId,
  userId
) => {
  const response = await api.delete(
    `/rooms/${roomId}/members/${userId}`
  );

  return response.data;
};

export const deleteRoom = async (roomId) => {
  const response = await api.delete(
    `/rooms/${roomId}`
  );

  return response.data;
};