const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "অনুগ্রহ করে লগইন করুন",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "ব্যবহারকারী পাওয়া যায়নি",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "আপনার অ্যাকাউন্ট নিষ্ক্রিয়",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "অবৈধ টোকেন, অনুগ্রহ করে পুনরায় লগইন করুন",
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "এই কাজের অনুমতি নেই",
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
