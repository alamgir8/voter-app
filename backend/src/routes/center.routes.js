const express = require("express");
const router = express.Router();
const {
  createCenter,
  getCenters,
  getCenter,
  updateCenter,
  deleteCenter,
  getCenterStats,
} = require("../controllers/center.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.route("/").get(getCenters).post(createCenter);
router.route("/:id").get(getCenter).put(updateCenter).delete(deleteCenter);
router.get("/:id/stats", getCenterStats);

module.exports = router;
