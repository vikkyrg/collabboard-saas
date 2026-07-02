import api from "./axios";

export const getCanvasOps = async (roomId, afterSeq = 0) => {
  const response = await api.get(`/canvas/${roomId}`, {
    params: { afterSeq }
  });
  return response.data;
};

export const saveCanvasOp = async (
  roomId,
  opType,
  payload
) => {
  const response = await api.post(
    `/canvas/${roomId}/op`,
    {
      opType,
      payload,
    }
  );

  return response.data;
};
export const saveSnapshot = async (
  roomId,
  dataJson
) => {
  const response = await api.post(
    `/canvas/${roomId}/snapshot`,
    {
      dataJson,
    }
  );

  return response.data;
};

export const getSnapshot = async (
  roomId
) => {
  const response = await api.get(
    `/canvas/${roomId}/snapshot`,
    { params: { t: Date.now() } }
  );

  return response.data;
};