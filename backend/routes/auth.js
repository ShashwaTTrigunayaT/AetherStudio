import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dns from "dns";
import { promisify } from "util";
import multer from "multer";
import User from "../models/User.js";
import logger from "../config/logger.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/mailService.js";
import { uploadAvatar, deleteAvatar } from "../config/cloudinary.js";
import { isLoggedIn } from "../middleware/auth.js";
import { verifyEmailWithZeroBounce } from "../services/emailVerificationService.js";
import disposableDomains from "disposable-email-domains/index.json" with { type: "json" };

const router = express.Router();

// ─── Multer (in-memory file upload) ───────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// ─── DNS Cache (in-memory, 10 min TTL) ───────────────────
const dnsCache = new Map();
const DNS_TTL = 10 * 60 * 1000; // 10 minutes

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of dnsCache) {
    if (now > entry.expires) dnsCache.delete(key);
  }
}, 60_000); // Cleanup every minute

const resolveMx = promisify(dns.resolveMx);
const resolve4 = promisify(dns.resolve4);

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/forgot-password
//  Generates a 6-digit verification code, saves to user, emails it
//  (No token in URL — code is entered directly on the website)
// ─────────────────────────────────────────────────────────────
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal whether the email exists — security best practice
      return res.json({
        message: "If an account with that email exists, a verification code has been sent.",
      });
    }

    // Generate a cryptographically secure 6-digit code
    const resetCode = String(crypto.randomInt(100000, 999999));

    // Hash the code before storing (so DB compromise doesn't expose codes)
    const hashedCode = crypto.createHash("sha256").update(resetCode).digest("hex");

    user.resetCode = hashedCode;
    user.resetCodeExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    user.resetCodeAttempts = 0;
    await user.save();

    // Send the reset email with the code
    const emailResult = await sendPasswordResetEmail(user.email, resetCode).catch((err) => {
      logger.error("Failed to send reset email:", err);
      return null;
    });

    res.json({
      message: "If an account with that email exists, a verification code has been sent.",
      ...(process.env.NODE_ENV !== "production" && emailResult && { previewUrl: emailResult }),
    });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/reset-password
//  Validates the 6-digit verification code and updates the password
// ─────────────────────────────────────────────────────────────
router.post("/reset-password", async (req, res, next) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({ error: "Email, verification code, and new password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Verification code must be a 6-digit number" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.resetCode || !user.resetCodeExpiry) {
      return res.status(400).json({ error: "No reset request found. Please request a new code." });
    }

    // Check if code has expired
    if (Date.now() > user.resetCodeExpiry) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
    }

    // Check attempt limit (max 5 attempts)
    if (user.resetCodeAttempts >= 5) {
      return res.status(429).json({ error: "Too many incorrect attempts. Please request a new code." });
    }

    // Hash the incoming code to match the stored hash
    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

    if (user.resetCode !== hashedCode) {
      user.resetCodeAttempts = (user.resetCodeAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ error: "Invalid verification code. Please try again." });
    }

    // Update password and clear reset fields
    user.password = password;
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;
    user.resetCodeAttempts = undefined;
    await user.save();

    logger.info(`Password reset successful for user: ${user.email}`);
    res.json({ message: "Password has been reset successfully. You can now sign in." });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

// ─── Helper: Validate email domain via MX lookup ─────────────
async function validateEmailDomain(email) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return { valid: false, error: "Invalid email domain" };

  // Check cache first
  const cached = dnsCache.get(domain);
  if (cached) {
    return { valid: cached.valid, error: cached.valid ? null : "This domain does not accept email" };
  }

  // Try MX records
  let valid = false;
  try {
    const mxRecords = await resolveMx(domain);
    valid = mxRecords && mxRecords.length > 0;
  } catch {
    // No MX records — fall back to checking if domain resolves at all
    try {
      const aRecords = await resolve4(domain);
      valid = aRecords && aRecords.length > 0;
    } catch {
      // DNS lookup failed entirely (common in Railway/containerized envs)
      // When SKIP_DNS_EMAIL_CHECK is set, bypass DNS validation for the domain
      if (process.env.SKIP_DNS_EMAIL_CHECK === "true") {
        logger.warn(`[Email Validation] DNS lookup failed for domain: ${domain} — SKIP_DNS_EMAIL_CHECK is set, allowing`);
        valid = true;
      }
    }
  }

  // Cache the result
  dnsCache.set(domain, { valid, expires: Date.now() + DNS_TTL });

  return {
    valid,
    error: valid ? null : "This domain does not appear to accept email. Please use a valid email address.",
  };
}

// ─── Register ────────────────────────────────────────────────
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check for disposable/temporary email addresses
    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (emailDomain && disposableDomains.includes(emailDomain)) {
      return res.status(400).json({
        error: "Disposable email addresses are not allowed. Please use a permanent email address.",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Server-side email verification via ZeroBounce (when configured)
    // This catches non-existent inboxes even if the frontend checks are bypassed
    if (process.env.ZEROBOUNCE_API_KEY) {
      try {
        const zbResult = await verifyEmailWithZeroBounce(email);
        if (zbResult.status === 'invalid') {
          return res.status(400).json({
            error: zbResult.did_you_mean
              ? `Email not found. Did you mean ${zbResult.did_you_mean}?`
              : 'This email address does not appear to exist. Please use a valid email address.',
          });
        }
        if (zbResult.status === 'spamtrap' || zbResult.status === 'abuse' || zbResult.status === 'do_not_mail') {
          return res.status(400).json({
            error: 'This email address cannot be used. Please try a different email.',
          });
        }
      } catch (zbErr) {
        // ZeroBounce failure should not block registration — log and proceed
        logger.warn('[Register] ZeroBounce check failed (proceeding):', zbErr.message);
      }
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = new User({
      email, password, name,
      verificationToken,
      isVerified: false,
    });
    await user.save();

    // Send verification email (non-blocking — don't fail if email sending fails)
    sendVerificationEmail(user.email, verificationToken).catch((err) => {
      logger.error("Failed to send verification email:", err.message);
    });

    // Auto-login the user but mark that email is unverified
    const token = jwt.sign(
      { _id: user._id, email: user.email, isVerified: false },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: process.env.SAME_SITE_COOKIE || "lax",
      secure: process.env.SECURE_COOKIE === "true",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar || null,
        isVerified: false,
      },
      token,
      verificationSent: true,
      message: "Account created! Check your email for the verification link.",
    });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

// ─── Login ───────────────────────────────────────────────────
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { _id: user._id, email: user.email, isVerified: user.isVerified },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: process.env.SAME_SITE_COOKIE || "lax",
      secure: process.env.SECURE_COOKIE === "true",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar || null,
        isVerified: user.isVerified,
      },
      token,
    });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/check-email
//  Checks if a specific email is already registered in the database
// ─────────────────────────────────────────────────────────────
router.post("/check-email", async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    res.json({ exists: !!user });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/validate-email
//  Checks if the email domain has valid MX records (domain accepts email)
//  Falls back gracefully when DNS is unavailable (common in Railway containers)
// ─────────────────────────────────────────────────────────────
router.post("/validate-email", async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const domain = email.split("@")[1].toLowerCase();

    // Check cache first
    const cached = dnsCache.get(domain);
    if (cached) {
      return res.json({ valid: cached.valid, domain });
    }

    // Try MX records
    let valid = false;
    try {
      const mxRecords = await resolveMx(domain);
      valid = mxRecords && mxRecords.length > 0;
    } catch {
      // No MX records — fall back to checking if domain resolves at all
      try {
        const aRecords = await resolve4(domain);
        valid = aRecords && aRecords.length > 0;
      } catch {
        // DNS lookup failed entirely (common in Railway/containerized envs)
        // When SKIP_DNS_EMAIL_CHECK is set, bypass DNS validation for the domain
        if (process.env.SKIP_DNS_EMAIL_CHECK === "true") {
          logger.warn(`[Validate Email] DNS lookup failed for domain: ${domain} — SKIP_DNS_EMAIL_CHECK is set, allowing`);
          valid = true;
        }
      }
    }

    // Cache the result
    dnsCache.set(domain, { valid, expires: Date.now() + DNS_TTL });

    res.json({ valid, domain });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/verify-email
//  ZeroBounce-powered email verification — checks if the inbox actually exists
//  Uses HTTP API (no port 25 required), works on Railway and other cloud platforms
//  Falls back gracefully when ZEROBOUNCE_API_KEY is not configured
// ─────────────────────────────────────────────────────────────

// ZeroBounce cache (in-memory, 30 min TTL)
const zbCache = new Map();
const ZB_CACHE_TTL = 30 * 60 * 1000;

router.post('/verify-email', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const emailKey = email.toLowerCase();

    // Check cache
    const cached = zbCache.get(emailKey);
    if (cached) {
      return res.json({ verified: cached.verified, reason: cached.reason, cached: true, status: cached.status });
    }

    // Try ZeroBounce verification
    const zbResult = await verifyEmailWithZeroBounce(email);

    let verified;
    let reason;
    let status;

    if (zbResult.status === 'valid') {
      verified = true;
      reason = null;
      status = 'valid';
    } else if (zbResult.status === 'invalid') {
      verified = false;
      reason = zbResult.did_you_mean
        ? `Email not found. Did you mean ${zbResult.did_you_mean}?`
        : 'This email address does not appear to exist on the mail server.';
      status = 'invalid';
    } else if (zbResult.status === 'catch-all') {
      // Catch-all domains accept all mail — we can't confirm individual inboxes
      verified = null;
      reason = 'This email domain accepts all mail (catch-all). Inbox existence could not be confirmed.';
      status = 'catch-all';
    } else if (zbResult.reason && zbResult.reason.includes('not configured')) {
      // ZeroBounce not configured — fall back gracefully
      verified = null;
      reason = 'Email verification service not configured. Please set ZEROBOUNCE_API_KEY.';
      status = 'unconfigured';
    } else {
      // Unknown / error
      verified = null;
      reason = 'Could not verify inbox existence. Please try again later.';
      status = 'unknown';
    }

    // Cache the result
    zbCache.set(emailKey, {
      verified,
      reason,
      status,
      expires: Date.now() + ZB_CACHE_TTL,
    });

    res.json({ verified, reason, status });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/upload-avatar
//  Upload a profile picture to Cloudinary (multipart/form-data)
//  Requires authentication (handled by isLoggedIn in server.js)
// ─────────────────────────────────────────────────────────────
router.post('/upload-avatar', isLoggedIn, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!req.user?._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete old avatar if exists
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.avatar) {
      await deleteAvatar(req.user._id).catch(() => {});
    }

    // Upload new avatar to Cloudinary
    const url = await uploadAvatar(req.file.buffer, req.user._id);

    user.avatar = url;
    await user.save();

    res.json({ avatar: url });
  } catch (err) {
    if (err.message === 'Only image files are allowed') {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    logger.error('[Avatar Upload] Failed:', err.message);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/auth/verify-email-confirm/:token
//  Verifies a user's email address via the link they clicked in the email
// ─────────────────────────────────────────────────────────────
router.get("/verify-email-confirm/:token", async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token || token.length < 10) {
      return res.status(400).json({ error: "Invalid verification link" });
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ error: "This verification link is invalid or has expired. Please register again." });
    }

    // Check token expiry (24 hours from account creation)
    if (user.createdAt && Date.now() - new Date(user.createdAt).getTime() > 24 * 60 * 60 * 1000) {
      return res.status(400).json({ error: "This verification link has expired (valid for 24 hours). Please register again." });
    }

    // Mark as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    logger.info(`Email verified for user: ${user.email}`);

    res.json({
      message: "Email verified successfully! You can now use all features of AetherStudio.",
      verified: true,
    });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});


export default router;
