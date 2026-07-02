import User from "../models/User.js";
import bcrypt from "bcryptjs";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { signToken } from "../utils/jwt.util.js";


export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const userExists = await User.findOne({ email: email.toLowerCase() }).lean();
  if (userExists) {
    throw new ApiError(409, "Email already exists. Please use another email.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    provider: "local",
  });

  const token = signToken({ id: user._id, email: user.email });

  res.status(201).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // If user registered with Google, they won't have a password set.
  if (!user.password) {
    throw new ApiError(401, "Please sign in with Google");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken({ id: user._id, email: user.email });

  res.json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
});

export const googleAuth = asyncHandler(async (req, res) => {
  console.log("-----------------------------------------");
  console.log("STEP 4: Backend POST /api/auth/google reached");
  const { credential } = req.body; 

  console.log("STEP 4a: Credential received length:", credential ? credential.length : "undefined");

  if (!credential) {
    throw new ApiError(400, "Google token is required");
  }

  // Verify token
  console.log("STEP 5: Fetching Google User Profile using access_token...");
  let payload;
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${credential}` },
    });
    
    if (!response.ok) throw new Error("Failed to fetch user profile");
    payload = await response.json();
    
    console.log("STEP 5a: Payload retrieved successfully!", payload.email);
  } catch (error) {
    console.log("STEP 5b: Google profile fetch failed!", error.message);
    throw new ApiError(401, "Invalid Google access token");
  }

  if (!payload || !payload.email) {
    throw new ApiError(401, "Invalid Google token payload (missing email)");
  }

  const { email, name, sub: googleId, picture } = payload;
  console.log(`STEP 6: Processing user: ${email}`);
  
  let user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    console.log("STEP 7a: Existing user found");
    // If user exists, optionally link their account if not already linked
    if (!user.googleId) {
      console.log("STEP 7b: Linking googleId to existing user");
      user.googleId = googleId;
      user.avatar = user.avatar || picture;
      await user.save();
    }
  } else {
    console.log("STEP 7c: Creating new user from Google profile");
    // Create new user for Google Sign In
    user = await User.create({
      name,
      email: email.toLowerCase(),
      provider: "google",
      googleId,
      avatar: picture,
    });
  }

  console.log("STEP 8: Generating JWT and sending response");
  const token = signToken({ id: user._id, email: user.email });

  res.json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select("_id name email geminiConnected createdAt avatar provider")
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      geminiConnected: user.geminiConnected,
      createdAt: user.createdAt,
      avatar: user.avatar,
      provider: user.provider,
    },
  });
});
