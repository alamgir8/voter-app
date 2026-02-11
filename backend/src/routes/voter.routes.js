const express = require("express");
const router = express.Router();
const {
  createVoter,
  getVotersByCenter,
  getVoter,
  updateVoter,
  deleteVoter,
  bulkCreateVoters,
  deleteAllVotersByCenter,
} = require("../controllers/voter.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.post("/", createVoter);
router.post("/bulk", bulkCreateVoters);
router.get("/center/:centerId", getVotersByCenter);
router.delete("/center/:centerId", deleteAllVotersByCenter);
router.route("/:id").get(getVoter).put(updateVoter).delete(deleteVoter);

module.exports = router;
