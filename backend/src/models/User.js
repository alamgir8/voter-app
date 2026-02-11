const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "নাম আবশ্যক"],
      trim: true,
      minlength: [2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে"],
      maxlength: [100, "নাম সর্বোচ্চ ১০০ অক্ষরের হতে পারবে"],
    },
    email: {
      type: String,
      required: [true, "ইমেইল আবশ্যক"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "সঠিক ইমেইল দিন"],
    },
    phone: {
      type: String,
      required: [true, "ফোন নম্বর আবশ্যক"],
      trim: true,
      match: [/^(\+88)?01[3-9]\d{8}$/, "সঠিক বাংলাদেশি ফোন নম্বর দিন"],
    },
    password: {
      type: String,
      required: [true, "পাসওয়ার্ড আবশ্যক"],
      minlength: [6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"],
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "operator", "viewer"],
      default: "operator",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for centers
userSchema.virtual("centers", {
  ref: "Center",
  localField: "_id",
  foreignField: "createdBy",
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

module.exports = mongoose.model("User", userSchema);
