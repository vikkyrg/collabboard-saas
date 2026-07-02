import ApiError from "../utils/ApiError.js";
import { extractBearerToken, verifyToken } from "../utils/jwt.util.js";

const protect = (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
};

export default protect;
