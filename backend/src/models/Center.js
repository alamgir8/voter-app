const mongoose = require("mongoose");

const centerSchema = new mongoose.Schema(
  {
    centerName: {
      type: String,
      required: [true, "কেন্দ্রের নাম আবশ্যক"],
      trim: true,
      minlength: [2, "কেন্দ্রের নাম কমপক্ষে ২ অক্ষরের হতে হবে"],
      maxlength: [200, "কেন্দ্রের নাম সর্বোচ্চ ২০০ অক্ষরের হতে পারবে"],
    },
    centerNo: {
      type: String,
      trim: true,
      default: null,
    },
    country: {
      type: String,
      required: [true, "দেশের নাম আবশ্যক"],
      trim: true,
      default: "বাংলাদেশ",
    },
    division: {
      type: String,
      required: [true, "বিভাগের নাম আবশ্যক"],
      trim: true,
    },
    zilla: {
      type: String,
      required: [true, "জেলার নাম আবশ্যক"],
      trim: true,
    },
    upazila: {
      type: String,
      required: [true, "উপজেলার নাম আবশ্যক"],
      trim: true,
    },
    union: {
      type: String,
      trim: true,
      default: null,
    },
    ward: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "বিবরণ সর্বোচ্চ ৫০০ অক্ষরের হতে পারবে"],
      default: null,
    },
    totalVoters: {
      type: Number,
      default: 0,
      min: [0, "ভোটার সংখ্যা ঋণাত্মক হতে পারবে না"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "তৈরিকারী আবশ্যক"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for voters
centerSchema.virtual("voters", {
  ref: "Voter",
  localField: "_id",
  foreignField: "center",
});

// Update totalVoters count
centerSchema.methods.updateVoterCount = async function () {
  const Voter = mongoose.model("Voter");
  const count = await Voter.countDocuments({ center: this._id });
  this.totalVoters = count;
  await this.save();
};

// Indexes
centerSchema.index({ createdBy: 1 });
centerSchema.index({ division: 1, zilla: 1, upazila: 1 });
centerSchema.index({ centerName: "text" });

module.exports = mongoose.model("Center", centerSchema);
