const Voter = require("../models/Voter");
const Center = require("../models/Center");

// @desc    Fast search voters
// @route   GET /api/search
const searchVoters = async (req, res) => {
  try {
    const {
      q,
      name,
      fatherName,
      voterNo,
      nid,
      dateOfBirth,
      address,
      centerId,
      page: pageParam,
      limit: limitParam,
    } = req.query;

    const page = parseInt(pageParam, 10) || 1;
    const limit = parseInt(limitParam, 10) || 20;
    const skip = (page - 1) * limit;

    // Build query
    const query = { createdBy: req.user._id };

    if (centerId) {
      query.center = centerId;
    }

    // Quick search - searches across multiple fields
    if (q && q.trim()) {
      const searchTerm = q.trim();
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { fatherName: { $regex: searchTerm, $options: "i" } },
        { motherName: { $regex: searchTerm, $options: "i" } },
        { voterNo: { $regex: searchTerm, $options: "i" } },
        { nid: { $regex: searchTerm, $options: "i" } },
        { address: { $regex: searchTerm, $options: "i" } },
        { area: { $regex: searchTerm, $options: "i" } },
        { dateOfBirth: { $regex: searchTerm, $options: "i" } },
      ];
    }

    // Individual field searches
    if (name) {
      query.name = { $regex: name.trim(), $options: "i" };
    }
    if (fatherName) {
      query.fatherName = { $regex: fatherName.trim(), $options: "i" };
    }
    if (voterNo) {
      query.voterNo = { $regex: voterNo.trim(), $options: "i" };
    }
    if (nid) {
      query.nid = { $regex: nid.trim(), $options: "i" };
    }
    if (dateOfBirth) {
      query.dateOfBirth = { $regex: dateOfBirth.trim(), $options: "i" };
    }
    if (address) {
      query.$or = query.$or || [];
      query.$or.push(
        { address: { $regex: address.trim(), $options: "i" } },
        { area: { $regex: address.trim(), $options: "i" } },
      );
    }

    const [voters, total] = await Promise.all([
      Voter.find(query)
        .populate("center", "centerName division zilla upazila")
        .sort({ name: 1 })
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

// @desc    Auto-complete search (fast, limited fields)
// @route   GET /api/search/auto
const autoSearch = async (req, res) => {
  try {
    const { q, centerId } = req.query;

    if (!q || q.trim().length < 1) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const searchTerm = q.trim();
    const query = { createdBy: req.user._id };

    if (centerId) {
      query.center = centerId;
    }

    query.$or = [
      { name: { $regex: searchTerm, $options: "i" } },
      { fatherName: { $regex: searchTerm, $options: "i" } },
      { voterNo: { $regex: searchTerm, $options: "i" } },
      { nid: { $regex: searchTerm, $options: "i" } },
      { dateOfBirth: { $regex: searchTerm, $options: "i" } },
    ];

    const voters = await Voter.find(query)
      .select("name fatherName voterNo nid dateOfBirth address center")
      .populate("center", "centerName")
      .sort({ name: 1 })
      .limit(15)
      .lean();

    res.json({
      success: true,
      data: voters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Advanced search with multiple filters
// @route   POST /api/search/advanced
const advancedSearch = async (req, res) => {
  try {
    const {
      name,
      fatherName,
      motherName,
      voterNo,
      nid,
      dateOfBirth,
      address,
      gender,
      occupation,
      centerId,
      page: pageParam,
      limit: limitParam,
    } = req.body;

    const page = parseInt(pageParam, 10) || 1;
    const limit = parseInt(limitParam, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { createdBy: req.user._id };

    if (centerId) query.center = centerId;
    if (name) query.name = { $regex: name.trim(), $options: "i" };
    if (fatherName)
      query.fatherName = { $regex: fatherName.trim(), $options: "i" };
    if (motherName)
      query.motherName = { $regex: motherName.trim(), $options: "i" };
    if (voterNo) query.voterNo = { $regex: voterNo.trim(), $options: "i" };
    if (nid) query.nid = { $regex: nid.trim(), $options: "i" };
    if (dateOfBirth)
      query.dateOfBirth = { $regex: dateOfBirth.trim(), $options: "i" };
    if (gender) query.gender = gender;
    if (occupation)
      query.occupation = { $regex: occupation.trim(), $options: "i" };
    if (address) {
      query.$or = [
        { address: { $regex: address.trim(), $options: "i" } },
        { area: { $regex: address.trim(), $options: "i" } },
      ];
    }

    const [voters, total] = await Promise.all([
      Voter.find(query)
        .populate("center", "centerName division zilla upazila")
        .sort({ name: 1 })
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

module.exports = {
  searchVoters,
  autoSearch,
  advancedSearch,
};
