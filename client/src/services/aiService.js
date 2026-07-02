import api from "./axios";

export const chatWithAI = async (message, roomId, contextImage = null) => {
  const { data } = await api.post("/ai/chat", { message, roomId, contextImage });
  return data;
};

export const getAIHistory = async (roomId) => {
  const { data } = await api.get(`/ai/history/${roomId}`);
  return data;
};
