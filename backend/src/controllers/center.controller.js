const Center = require("../models/Center");
const Voter = require("../models/Voter");

// @desc    Create a center
// @route   POST /api/centers
const createCenter = async (req, res) => {
  try {
    const centerData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const center = await Center.create(centerData);

    res.status(201).json({
      success: true,
      message: "কেন্দ্র সফলভাবে তৈরি হয়েছে",
      data: center,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all centers for logged-in user
// @route   GET /api/centers
const getCenters = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { createdBy: req.user._id };

    // Filter by division/zilla/upazila
    if (req.query.division) query.division = req.query.division;
    if (req.query.zilla) query.zilla = req.query.zilla;
    if (req.query.upazila) query.upazila = req.query.upazila;

    // Search by name
    if (req.query.search) {
      query.centerName = { $regex: req.query.search, $options: "i" };
    }

    const [centers, total] = await Promise.all([
      Center.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Center.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: centers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single center
// @route   GET /api/centers/:id
const getCenter = async (req, res) => {
  try {
    const center = await Center.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!center) {
      return res.status(404).json({
        success: false,
        message: "কেন্দ্র পাওয়া যায়নি",
      });
    }

    res.json({
      success: true,
      data: center,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update center
// @route   PUT /api/centers/:id
const updateCenter = async (req, res) => {
  try {
    const center = await Center.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true },
    );

    if (!center) {
      return res.status(404).json({
        success: false,
        message: "কেন্দ্র পাওয়া যায়নি",
      });
    }

    res.json({
      success: true,
      message: "কেন্দ্র আপডেট হয়েছে",
      data: center,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete center
// @route   DELETE /api/centers/:id
const deleteCenter = async (req, res) => {
  try {
    const center = await Center.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!center) {
      return res.status(404).json({
        success: false,
        message: "কেন্দ্র পাওয়া যায়নি",
      });
    }

    // Delete all voters under this center
    await Voter.deleteMany({ center: center._id });
    await Center.deleteOne({ _id: center._id });

    res.json({
      success: true,
      message: "কেন্দ্র ও সকল ভোটার মুছে ফেলা হয়েছে",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get center stats
// @route   GET /api/centers/:id/stats
const getCenterStats = async (req, res) => {
  try {
    const center = await Center.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!center) {
      return res.status(404).json({
        success: false,
        message: "কেন্দ্র পাওয়া যায়নি",
      });
    }

    const [totalVoters, maleVoters, femaleVoters] = await Promise.all([
      Voter.countDocuments({ center: center._id }),
      Voter.countDocuments({ center: center._id, gender: "পুরুষ" }),
      Voter.countDocuments({ center: center._id, gender: "মহিলা" }),
    ]);

    res.json({
      success: true,
      data: {
        totalVoters,
        maleVoters,
        femaleVoters,
        otherVoters: totalVoters - maleVoters - femaleVoters,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCenter,
  getCenters,
  getCenter,
  updateCenter,
  deleteCenter,
  getCenterStats,
};
