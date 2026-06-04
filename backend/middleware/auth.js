import jwt from "jsonwebtoken";
import logger from "../config/logger.js";

export function authMiddleware(req, res, next) {
  const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    logger.warn("Invalid token:", err.message);
    res.clearCookie("token");
  }

  next();
}

export function isLoggedIn(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
