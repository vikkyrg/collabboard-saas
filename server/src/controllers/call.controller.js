import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import RoomMember from "../models/RoomMember.js";
import pkg from "agora-access-token";

const { RtcTokenBuilder, RtcRole } = pkg;

export const createCall = asyncHandler(async (req, res) => {
  const { roomId } = req.body;

  if (!roomId) {
    throw new ApiError(400, "roomId is required");
  }

  const membership = await RoomMember.findOne({
    roomId,
    userId: req.user.id,
  }).lean();

  if (!membership) {
    throw new ApiError(403, "You are not a member of this room");
  }

  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId) {
    throw new ApiError(503, "AGORA_APP_ID is missing");
  }

  if (!appCertificate) {
    throw new ApiError(503, "AGORA_APP_CERTIFICATE is missing");
  }

  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTime =
    currentTimestamp + expirationTimeInSeconds;

  const uid = Number(req.body.uid || 0);

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    roomId,
    uid,
    RtcRole.PUBLISHER,
    privilegeExpireTime
  );

  res.status(200).json({
    success: true,
    appId,
    channel: roomId,
    uid,
    token,
    expiresIn: expirationTimeInSeconds,
    message: "Agora token generated successfully",
  });
});