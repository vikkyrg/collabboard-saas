import api from "./axios";

export const createCall = async (roomId, uid = 0) => {
  const response = await api.post("/call/create", {
    roomId,
    uid,
  });

  return response.data;
};