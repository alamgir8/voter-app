const express = require("express");
const router = express.Router();
const {
  importPdf,
  getImportStatus,
  saveImportedVoters,
  importManual,
} = require("../controllers/import.controller");
const { protect } = require("../middleware/auth.middleware");
const { uploadPdf } = require("../middleware/upload.middleware");

router.use(protect);

router.post("/pdf", uploadPdf.single("pdf"), importPdf);
router.get("/status/:jobId", getImportStatus);
router.post("/save", saveImportedVoters);
router.post("/manual", importManual);

module.exports = router;
