const Voter = require("../models/Voter");
const Center = require("../models/Center");

// @desc    Create a voter
// @route   POST /api/voters
const createVoter = async (req, res) => {
  try {
    // Verify center belongs to user
    const center = await Center.findOne({
      _id: req.body.center,
      createdBy: req.user._id,
    });

    if (!center) {
      return res.status(404).json({
        success: false,
        message: "কেন্দ্র পাওয়া যায়নি",
      });
    }

    const voter = await Voter.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "ভোটার সফলভাবে যোগ হয়েছে",
      data: voter,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get voters by center
// @route   GET /api/voters/center/:centerId
const getVotersByCenter = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    // Verify center belongs to user
    const center = await Center.findOne({
      _id: req.params.centerId,
      createdBy: req.user._id,
    });

    if (!center) {
      return res.status(404).json({
        success: false,
        message: "কেন্দ্র পাওয়া যায়নি",
      });
    }

    const query = { center: center._id };

    const [voters, total] = await Promise.all([
      Voter.find(query)
        .sort({ serialNo: 1, voterNo: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Voter.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: voters,
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

// @desc    Get single voter
// @route   GET /api/voters/:id
const getVoter = async (req, res) => {
  try {
    const voter = await Voter.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    }).populate("center", "centerName division zilla upazila");

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: "ভোটার পাওয়া যায়নি",
      });
    }

    res.json({
      success: true,
      data: voter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update voter
// @route   PUT /api/voters/:id
const updateVoter = async (req, res) => {
  try {
    const voter = await Voter.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true },
    );

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: "ভোটার পাওয়া যায়নি",
      });
    }

    res.json({
      success: true,
      message: "ভোটার তথ্য আপডেট হয়েছে",
      data: voter,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete voter
// @route   DELETE /api/voters/:id
const deleteVoter = async (req, res) => {
  try {
    const voter = await Voter.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: "ভোটার পাওয়া যায়নি",
      });
    }

    const centerId = voter.center;
    await Voter.deleteOne({ _id: voter._id });

    // Update center count
    const center = await Center.findById(centerId);
    if (center) {
      await center.updateVoterCount();
    }

    res.json({
      success: true,
      message: "ভোটার মুছে ফেলা হয়েছে",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Bulk create voters
// @route   POST /api/voters/bulk
const bulkCreateVoters = async (req, res) => {
  try {
    const { centerId, voters } = req.body;

    // Verify center belongs to user
    const center = await Center.findOne({
      _id: centerId,
      createdBy: req.user._id,
    });

    if (!center) {
      return res.status(404).json({
        success: false,
        message: "কেন্দ্র পাওয়া যায়নি",
      });
    }

    if (!voters || !Array.isArray(voters) || voters.length === 0) {
      return res.status(400).json({
        success: false,
        message: "ভোটার তালিকা খালি",
      });
    }

    // Add center and user info to each voter
    const voterDocs = voters.map((v, index) => ({
      ...v,
      center: centerId,
      createdBy: req.user._id,
      serialNo: v.serialNo || index + 1,
    }));

    // Insert in batches of 500
    const batchSize = 500;
    let totalInserted = 0;

    for (let i = 0; i < voterDocs.length; i += batchSize) {
      const batch = voterDocs.slice(i, i + batchSize);
      const result = await Voter.insertMany(batch, { ordered: false });
      totalInserted += result.length;
    }

    // Update center voter count
    await center.updateVoterCount();

    res.status(201).json({
      success: true,
      message: `${totalInserted} জন ভোটার সফলভাবে যোগ হয়েছে`,
      data: {
        inserted: totalInserted,
        total: voterDocs.length,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete all voters in a center
// @route   DELETE /api/voters/center/:centerId
const deleteAllVotersByCenter = async (req, res) => {
  try {
    const center = await Center.findOne({
      _id: req.params.centerId,
      createdBy: req.user._id,
    });

    if (!center) {
      return res.status(404).json({
        success: false,
        message: "কেন্দ্র পাওয়া যায়নি",
      });
    }

    const result = await Voter.deleteMany({ center: center._id });

    center.totalVoters = 0;
    await center.save();

    res.json({
      success: true,
      message: `${result.deletedCount} জন ভোটার মুছে ফেলা হয়েছে`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createVoter,
  getVotersByCenter,
  getVoter,
  updateVoter,
  deleteVoter,
  bulkCreateVoters,
  deleteAllVotersByCenter,
};
