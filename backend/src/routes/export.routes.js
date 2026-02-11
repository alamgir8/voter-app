const express = require("express");
const router = express.Router();
const {
  exportVoterPdf,
  exportCenterPdf,
} = require("../controllers/export.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.get("/voter/:id", exportVoterPdf);
router.get("/center/:centerId", exportCenterPdf);

module.exports = router;
