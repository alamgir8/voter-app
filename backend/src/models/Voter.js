const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema(
  {
    cr: {
      type: String,
      trim: true,
      default: null,
    },
    voterNo: {
      type: String,
      trim: true,
      index: true,
    },
    nid: {
      type: String,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "ভোটারের নাম আবশ্যক"],
      trim: true,
      minlength: [2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে"],
      maxlength: [200, "নাম সর্বোচ্চ ২০০ অক্ষরের হতে পারবে"],
    },
    fatherName: {
      type: String,
      trim: true,
      default: null,
    },
    motherName: {
      type: String,
      trim: true,
      default: null,
    },
    husbandName: {
      type: String,
      trim: true,
      default: null,
    },
    gender: {
      type: String,
      enum: ["পুরুষ", "মহিলা", "অন্যান্য", ""],
      default: "",
    },
    occupation: {
      type: String,
      trim: true,
      default: null,
    },
    dateOfBirth: {
      type: String,
      trim: true,
      default: null,
    },
    age: {
      type: Number,
      default: null,
      min: [18, "বয়স কমপক্ষে ১৮ হতে হবে"],
      max: [150, "বয়স সর্বোচ্চ ১৫০ হতে পারবে"],
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    area: {
      type: String,
      trim: true,
      default: null,
    },
    photo: {
      type: String,
      default: null,
    },
    center: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Center",
      required: [true, "কেন্দ্র আবশ্যক"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "তৈরিকারী আবশ্যক"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    serialNo: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Text index for search
voterSchema.index({
  name: "text",
  fatherName: "text",
  motherName: "text",
  address: "text",
  area: "text",
  occupation: "text",
});

// Compound indexes for search performance
voterSchema.index({ center: 1, voterNo: 1 });
voterSchema.index({ center: 1, nid: 1 });
voterSchema.index({ center: 1, name: 1 });
voterSchema.index({ center: 1, fatherName: 1 });
voterSchema.index({ center: 1, dateOfBirth: 1 });
voterSchema.index({ createdBy: 1 });

// Post save hook to update center voter count
voterSchema.post("save", async function () {
  try {
    const Center = mongoose.model("Center");
    const center = await Center.findById(this.center);
    if (center) {
      await center.updateVoterCount();
    }
  } catch (err) {
    console.error("ভোটার সংখ্যা আপডেট ব্যর্থ:", err);
  }
});

// Post remove hook to update center voter count
voterSchema.post(
  "deleteOne",
  { document: true, query: false },
  async function () {
    try {
      const Center = mongoose.model("Center");
      const center = await Center.findById(this.center);
      if (center) {
        await center.updateVoterCount();
      }
    } catch (err) {
      console.error("ভোটার সংখ্যা আপডেট ব্যর্থ:", err);
    }
  },
);

module.exports = mongoose.model("Voter", voterSchema);
