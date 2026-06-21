import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String },
    bio: String,
    location: String,
    role: String,
    education: String,
    theme: { type: String, default: "dark" },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  resetCode: String,
  resetCodeExpiry: Date,
  resetCodeAttempts: { type: Number, default: 0 },
  extensions: [{
    extensionId: String,
    version: String,
    enabled: { type: Boolean, default: true },
    autoUpdate: { type: Boolean, default: true },
    disableScope: { type: String, default: 'global' },
    installedAt: { type: Date, default: Date.now },
  }],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcryptjs.hash(this.password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
  next();
});

userSchema.methods.comparePassword = async function (pwd) {
  return bcryptjs.compare(pwd, this.password);
};

export default mongoose.model("User", userSchema);
