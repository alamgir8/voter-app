const express = require("express");
const router = express.Router();
const {
  searchVoters,
  autoSearch,
  advancedSearch,
} = require("../controllers/search.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.get("/", searchVoters);
router.get("/auto", autoSearch);
router.post("/advanced", advancedSearch);

module.exports = router;
