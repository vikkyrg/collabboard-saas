import api from "./axios";

export const getChatMessages = async (roomId) => {
  const response = await api.get(`/chat/${roomId}`);
  return response.data;
};

export const sendChatMessage = async (
  roomId,
  text
) => {
  const response = await api.post(
    `/chat/${roomId}`,
    { text }
  );

  return response.data;
};