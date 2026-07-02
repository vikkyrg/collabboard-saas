export const buildInviteLink = (roomId, inviteToken) => {
  const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
  return `${baseUrl}/join/${roomId}?token=${inviteToken}`;
};