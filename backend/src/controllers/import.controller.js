const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const sharp = require("sharp");
const Voter = require("../models/Voter");
const Center = require("../models/Center");

const importJobs = new Map();

function createImportJob({ userId, centerId }) {
  const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const job = {
    id: jobId,
    userId,
    centerId,
    status: "processing",
    progress: { stage: "starting", current: 0, total: 0 },
    result: null,
    error: null,
    startedAt: Date.now(),
  };
  importJobs.set(jobId, job);
  return job;
}

function updateImportJob(jobId, updates) {
  const job = importJobs.get(jobId);
  if (!job) return null;
  Object.assign(job, updates);
  importJobs.set(jobId, job);
  return job;
}

/* ── Bengali digit → English ─────────────────────────── */
const BN = "\u09E6\u09E7\u09E8\u09E9\u09EA\u09EB\u09EC\u09ED\u09EE\u09EF";
const bnToEn = (s) =>
  s ? s.replace(/[\u09E6-\u09EF]/g, (d) => BN.indexOf(d).toString()) : s;

/* ── Tesseract OCR helper (uses cd for macOS Leptonica compat) ── */
function tessOcr(dir, filename, psm) {
  try {
    return execSync(
      `cd "${dir}" && tesseract "${filename}" stdout -l ben --psm ${psm} 2>/dev/null`,
      { encoding: "utf8", timeout: 120000 },
    );
  } catch {
    return "";
  }
}

/* ── OCR full page with auto layout detection ── */
async function ocrPageFull(imgPath, tmpDir) {
  return tessOcr(tmpDir, path.basename(imgPath), 1);
}

/* ── OCR page split into 3 vertical columns ── */
async function ocrPageColumns(imgPath, tmpDir) {
  const meta = await sharp(imgPath).metadata();
  const { width: w, height: h } = meta;
  const colW = Math.floor(w / 3);
  let text = "";
  for (let c = 0; c < 3; c++) {
    const x = c * colW;
    const cw = c < 2 ? colW : w - x;
    const cf = `_col${c}.png`;
    await sharp(imgPath)
      .extract({ left: x, top: 0, width: cw, height: h })
      .toFile(path.join(tmpDir, cf));
    text += tessOcr(tmpDir, cf, 6) + "\n";
  }
  return text;
}

/* ── Clean a field value: remove merged-column artifacts ── */
function cleanField(value) {
  if (!value) return "";
  const labels = [
    "\u09AA\u09BF\u09A4\u09BE",
    "\u09AE\u09BE\u09A4\u09BE",
    "\u09AA\u09C7\u09B6\u09BE",
    "\u099C\u09A8\u09CD\u09AE",
    "\u09A4\u09BE\u09B0\u09BF",
    "\u09A0\u09BF\u0995\u09BE\u09A8\u09BE",
    "\u09AD\u09CB\u09AF\u09BC\u09BE\u09B0",
    "\u09B8\u09CD\u09AC\u09BE\u09AE\u09C0",
  ];
  let cleaned = value;
  for (const lbl of labels) {
    const idx = cleaned.indexOf(lbl);
    if (idx > 0) cleaned = cleaned.substring(0, idx);
  }
  return cleaned
    .replace(/[\d\u09E6-\u09EF]{5,}/g, "")
    .replace(/["\u201C\u201D*#$|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ── Parse OCR text into voter objects ────────────────── */
function parseVoters(text, globalGender) {
  const voters = [];
  let cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/\u0964/g, ".")
    .replace(/[|\[\]\xAB\xBB]/g, "");

  // Detect gender from page header
  let gender = globalGender || "";
  if (cleaned.includes("\u09AE\u09B9\u09BF\u09B2\u09BE"))
    gender = "\u09AE\u09B9\u09BF\u09B2\u09BE";
  else if (cleaned.includes("\u09AA\u09C1\u09B0\u09C1\u09B7"))
    gender = "\u09AA\u09C1\u09B0\u09C1\u09B7";

  // Anchor: serial + নাম/নাষ (OCR variant)
  const anchorRe =
    /([\d\u09E6-\u09EF]{1,4})\s*[.\-\u0964)]\s*\u09A8\u09BE[\u09AE\u09B7]\s*[:\uFF1A;.]\s*([^\n]*)/gm;
  const anchors = [];
  let m;
  while ((m = anchorRe.exec(cleaned)) !== null) {
    anchors.push({
      index: m.index,
      serial: bnToEn(m[1]).replace(/^0+/, "") || "0",
      nameRaw: m[2].trim(),
    });
  }

  if (anchors.length === 0) return { voters: [], gender };

  for (let i = 0; i < anchors.length; i++) {
    const start = anchors[i].index;
    const end = i + 1 < anchors.length ? anchors[i + 1].index : cleaned.length;
    const chunk = cleaned.substring(start, end);

    // Clean name: take text before any other serial+নাম pattern
    const name = anchors[i].nameRaw
      .split(/[\d\u09E6-\u09EF]{1,4}\s*[.\-]\s*\u09A8\u09BE[\u09AE\u09B7]/)[0]
      .replace(/[\d\u09E6-\u09EF]{5,}/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const v = {
      serialNo: parseInt(anchors[i].serial) || i + 1,
      cr: anchors[i].serial,
      name,
      voterNo: "",
      nid: "",
      fatherName: "",
      motherName: "",
      husbandName: "",
      occupation: "",
      dateOfBirth: "",
      address: "",
      area: "",
      gender,
    };

    // Voter number – flexible to handle OCR variants
    const vnM = chunk.match(
      /(?:\u09AD\u09CB[\u09AF\u09DF]?\u09BC?\u09BE?\u09B0|\u09AD\u09BE[\u09B0\u09A4]\u09BE?\u09B0?|\u09B0)\s*\u09A8[\u0982\u09AE\u09C7]\u09CD?\u09AC?\u09B0?\s*[:\uFF1A.\-\s]\s*([\d\u09E6-\u09EF\s]{5,20})/i,
    );
    if (vnM) v.voterNo = bnToEn(vnM[1].replace(/\s/g, ""));

    // Father
    const fM = chunk.match(
      /\u09AA\u09BF\u09A4\u09BE[\u0983]?\s*[:\uFF1A.\-]\s*([^\n]*)/i,
    );
    if (fM) v.fatherName = cleanField(fM[1]);

    // Mother
    const mM = chunk.match(
      /\u09AE\u09BE\u09A4\u09BE\s*[:\uFF1A.\-]\s*([^\n]*)/i,
    );
    if (mM) v.motherName = cleanField(mM[1]);

    // Husband
    const hM = chunk.match(
      /\u09B8\u09CD\u09AC\u09BE\u09AE\u09C0\s*[:\uFF1A.\-]\s*([^\n]*)/i,
    );
    if (hM) v.husbandName = cleanField(hM[1]);

    // Occupation + DOB (পেশা: ...,জন্ম তারিখ:DD/MM/YYYY)
    const odM = chunk.match(
      /\u09AA\u09C7\u09B6\u09BE\s*[:\uFF1A.\-]\s*([^,\n]*?)(?:[,\s]+)?\u099C\u09A8\u09CD?\u09AE?\u09BE?\s*\u09A4\u09BE\u09B0\u09BF[\u0996\u09AC][:\uFF1A.\-\s]*([\d\u09E6-\u09EF\/.\-]+)/i,
    );
    if (odM) {
      v.occupation = cleanField(odM[1]);
      v.dateOfBirth = bnToEn(odM[2]);
    } else {
      const dM = chunk.match(
        /\u09A4\u09BE\u09B0\u09BF[\u0996\u09AC][:\uFF1A.\-\s]*([\d\u09E6-\u09EF\/.\-]{6,12})/i,
      );
      if (dM) v.dateOfBirth = bnToEn(dM[1]);
      const oM = chunk.match(
        /\u09AA\u09C7\u09B6\u09BE\s*[:\uFF1A.\-]\s*([^\n,]{2,30})/i,
      );
      if (oM) v.occupation = cleanField(oM[1]);
    }

    // Address
    const aM = chunk.match(
      /\u09A0\u09BF\u0995\u09BE\u09A8\u09BE\s*[:\uFF1A.\-]\s*([^\n]*)/i,
    );
    if (aM) {
      let addr = aM[1];
      // Truncate at duplicate ঠিকানা: label (merged column artifact)
      const addrLblIdx = addr.indexOf("\u09A0\u09BF\u0995\u09BE\u09A8\u09BE");
      if (addrLblIdx > 0) addr = addr.substring(0, addrLblIdx);
      // Remove other label artifacts
      for (const lbl of [
        "\u09AA\u09BF\u09A4\u09BE",
        "\u09AE\u09BE\u09A4\u09BE",
        "\u09AA\u09C7\u09B6\u09BE",
        "\u09AD\u09CB\u09AF\u09BC\u09BE\u09B0",
      ]) {
        const li = addr.indexOf(lbl);
        if (li > 0) addr = addr.substring(0, li);
      }
      v.address = addr
        .replace(/[\d\u09E6-\u09EF]{10,}/g, "")
        .replace(/["\u201C\u201D()]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    // NID
    const nidM = chunk.match(
      /(?:NID|\u099C\u09BE\u09A4\u09C0\u09AF\u09BC\s*\u09AA\u09B0\u09BF\u099A\u09AF\u09BC)\s*(?:\u09AA\u09A4\u09CD\u09B0)?\s*(?:\u09A8\u0982)?\s*[:\uFF1A.\-]\s*([\d\u09E6-\u09EF]+)/i,
    );
    if (nidM) v.nid = bnToEn(nidM[1]);

    if ((v.name.match(/[\u0980-\u09FF]/g) || []).length >= 2) voters.push(v);
  }

  return { voters, gender };
}

/* ── Smart merge: combine results from both OCR strategies ── */
function mergeVoterLists(list1, list2) {
  const scoreField = (val) => {
    if (!val) return 0;
    const bc = (val.match(/[\u0980-\u09FF]/g) || []).length;
    // Penalize merged-column artifacts (duplicate labels)
    const labels = [
      "\u09AA\u09BF\u09A4\u09BE:",
      "\u09AE\u09BE\u09A4\u09BE:",
      "\u09A0\u09BF\u0995\u09BE\u09A8\u09BE:",
    ];
    let penalty = 0;
    for (const l of labels)
      if ((val.match(new RegExp(l, "g")) || []).length > 0) penalty += 10;
    return bc - penalty;
  };

  const map = new Map();
  const addToMap = (voter) => {
    const key = voter.cr;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...voter });
      return;
    }
    for (const f of [
      "name",
      "voterNo",
      "nid",
      "fatherName",
      "motherName",
      "husbandName",
      "occupation",
      "dateOfBirth",
      "address",
      "area",
      "gender",
    ]) {
      if (!existing[f] && voter[f]) {
        existing[f] = voter[f];
      } else if (existing[f] && voter[f]) {
        if (f === "voterNo" || f === "nid") {
          if (voter[f].length > existing[f].length) existing[f] = voter[f];
        } else if (f === "dateOfBirth") {
          if (
            voter[f].match(/^\d{2}\/\d{2}\/\d{4}$/) &&
            !existing[f].match(/^\d{2}\/\d{2}\/\d{4}$/)
          )
            existing[f] = voter[f];
        } else {
          if (scoreField(voter[f]) > scoreField(existing[f]))
            existing[f] = voter[f];
        }
      }
    }
  };
  list1.forEach(addToMap);
  list2.forEach(addToMap);
  const merged = Array.from(map.values()).sort(
    (a, b) => a.serialNo - b.serialNo,
  );
  return postCleanVoters(merged);
}

/* ── Post-merge cleanup: remove artifacts from all fields ── */
function postCleanVoters(voters) {
  const labelPatterns = [
    /\u09A0\u09BF\u0995\u09BE\u09A8\u09BE\s*[:]/g,
    /\u09AA\u09BF\u09A4\u09BE[\u0983]?\s*[:]/g,
    /\u09AE\u09BE\u09A4\u09BE\s*[:]/g,
    /\u09AA\u09C7\u09B6\u09BE\s*[:]/g,
    /\u09AD\u09CB[\u09AF\u09DF]?\u09BC?\u09BE?\u09B0\s*\u09A8[\u0982\u09AE\u09C7]/g,
  ];
  for (const v of voters) {
    // Clean address: remove duplicate content (when same text appears twice)
    if (v.address && v.address.length > 40) {
      const half = Math.floor(v.address.length / 2);
      const firstHalf = v.address.substring(0, half);
      // If first 20 chars repeat later, take only the first occurrence
      const probe = v.address.substring(0, 20);
      const secondIdx = v.address.indexOf(probe, 10);
      if (secondIdx > 0 && secondIdx < v.address.length - 10) {
        v.address = v.address
          .substring(0, secondIdx)
          .trim()
          .replace(/[,\s]+$/, "");
      }
    }
    // Clean all text fields: remove label artifacts
    for (const f of [
      "fatherName",
      "motherName",
      "husbandName",
      "address",
      "occupation",
    ]) {
      if (!v[f]) continue;
      for (const pat of labelPatterns) {
        const match = pat.exec(v[f]);
        if (match && match.index > 0) {
          v[f] = v[f].substring(0, match.index).trim();
        }
        pat.lastIndex = 0;
      }
      // Remove trailing punctuation/junk
      v[f] = v[f].replace(/[,;:\s]+$/, "").trim();
    }
    // Fix motherName with পেশা: bleeding
    if (v.motherName) {
      const peshaIdx = v.motherName.indexOf("\u09AA\u09C7\u09B6\u09BE");
      if (peshaIdx >= 0) {
        v.motherName =
          peshaIdx > 0 ? v.motherName.substring(0, peshaIdx).trim() : "";
      }
      const tarikhIdx = v.motherName.indexOf("\u09A4\u09BE\u09B0\u09BF\u0996");
      if (tarikhIdx >= 0) {
        v.motherName =
          tarikhIdx > 0 ? v.motherName.substring(0, tarikhIdx).trim() : "";
      }
      v.motherName = v.motherName.replace(/[,;:\s]+$/, "").trim();
    }
  }
  return voters;
}

/**
 * Extract voters from PDF.
 * Strategy 1: pdf-parse (text-based PDFs)
 * Strategy 2: Dual OCR – PSM 1 (auto layout) + column-split (PSM 6)
 *             Results are merged for maximum extraction.
 */
const extractVotersFromPdf = async (filePath, onProgress) => {
  // --- Attempt 1: pdf-parse for text-based PDFs ---
  try {
    const pdfParse = require("pdf-parse");
    const buf = fs.readFileSync(filePath);
    const pdfData = await pdfParse(buf);

    const bc = (pdfData.text.match(/[\u0980-\u09FF]/g) || []).length;
    if (bc > 100) {
      const r = parseVoters(pdfData.text, "");
      if (r.voters.length > 0) {
        if (onProgress) {
          onProgress({ stage: "text", current: 1, total: 1, page: 1 });
        }
        return {
          voters: r.voters,
          method: "text-extraction",
          pages: pdfData.numpages,
        };
      }
    }
  } catch (e) {
    // pdf-parse failed, continue to OCR
  }

  // --- Attempt 2: Dual-strategy OCR for scanned PDFs ---
  try {
    execSync("which tesseract", { encoding: "utf8" });
    execSync("which pdftoppm", { encoding: "utf8" });
  } catch (e) {
    throw new Error(
      "\u09B8\u09CD\u0995\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1 PDF \u09AA\u09A1\u09BC\u09A4\u09C7 Tesseract OCR \u0993 poppler (pdftoppm) \u09AA\u09CD\u09B0\u09AF\u09BC\u09CB\u099C\u09A8\u0964 brew install tesseract tesseract-lang poppler",
    );
  }

  const tmpDir = path.join("/tmp", `ocr_${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    // Convert all pages to images at 300 DPI
    execSync(
      `pdftoppm -png -r 300 "${filePath}" "${path.join(tmpDir, "page")}"`,
      { timeout: 600000 },
    );

    const pages = fs
      .readdirSync(tmpDir)
      .filter((f) => f.match(/^page-\d+\.png$/))
      .sort();

    if (pages.length === 0)
      throw new Error(
        "PDF \u09A5\u09C7\u0995\u09C7 \u09AA\u09C7\u099C \u09A4\u09C8\u09B0\u09BF \u09B9\u09AF\u09BC\u09A8\u09BF",
      );

    let allVoters = [];
    let detectedGender = "";

    // Skip page 1 if it looks like a cover (no voter anchors)
    const startIdx = pages.length > 2 ? 1 : 0;

    for (let pi = startIdx; pi < pages.length; pi++) {
      const imgPath = path.join(tmpDir, pages[pi]);

      // Strategy A: PSM 1 (auto layout detection on full page)
      const text1 = await ocrPageFull(imgPath, tmpDir);
      const r1 = parseVoters(text1, detectedGender);

      // Strategy B: Split into 3 columns, OCR each with PSM 6
      const text2 = await ocrPageColumns(imgPath, tmpDir);
      const r2 = parseVoters(text2, detectedGender);

      if (r1.gender) detectedGender = r1.gender;
      if (r2.gender) detectedGender = r2.gender;

      // Merge both results for maximum coverage
      const merged = mergeVoterLists(r1.voters, r2.voters);
      allVoters = allVoters.concat(merged);

      console.log(
        `[OCR] ${pages[pi]}: PSM1=${r1.voters.length} COLS=${r2.voters.length} -> ${merged.length}`,
      );
      if (onProgress) {
        onProgress({
          stage: "ocr",
          current: pi - startIdx + 1,
          total: pages.length - startIdx,
          page: pages[pi],
        });
      }
    }

    // Global dedup by serial number
    const finalMap = new Map();
    for (const v of allVoters) {
      const existing = finalMap.get(v.cr);
      if (!existing) finalMap.set(v.cr, v);
      else {
        for (const f of [
          "name",
          "voterNo",
          "nid",
          "fatherName",
          "motherName",
          "husbandName",
          "occupation",
          "dateOfBirth",
          "address",
          "area",
          "gender",
        ]) {
          if (!existing[f] && v[f]) existing[f] = v[f];
        }
      }
    }
    const voters = Array.from(finalMap.values()).sort(
      (a, b) => a.serialNo - b.serialNo,
    );

    return {
      voters,
      method: "ocr",
      pages: pages.length,
    };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {}
  }
};

// @desc    Import voters from PDF (text-based or scanned)
// @route   POST /api/import/pdf
const importPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF ফাইল আপলোড করুন",
      });
    }

    const { centerId } = req.body;

    if (!centerId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "কেন্দ্র নির্বাচন করুন",
      });
    }

    // Verify center belongs to user
    const center = await Center.findOne({
      _id: centerId,
      createdBy: req.user._id,
    });

    if (!center) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: "কেন্দ্র পাওয়া যায়নি",
      });
    }

    // Prevent duplicate imports per center
    for (const job of importJobs.values()) {
      if (
        job.centerId === centerId &&
        job.userId.toString() === req.user._id.toString() &&
        job.status === "processing"
      ) {
        fs.unlinkSync(req.file.path);
        return res.status(409).json({
          success: false,
          message: "এই কেন্দ্রের জন্য ইম্পোর্ট চলছে, দয়া করে অপেক্ষা করুন",
          jobId: job.id,
        });
      }
    }

    const job = createImportJob({
      userId: req.user._id.toString(),
      centerId,
    });

    res.status(202).json({
      success: true,
      message: "PDF প্রক্রিয়া শুরু হয়েছে",
      jobId: job.id,
    });

    (async () => {
      try {
        updateImportJob(job.id, {
          progress: { stage: "ocr", current: 0, total: 0 },
        });
        const result = await extractVotersFromPdf(req.file.path, (progress) => {
          updateImportJob(job.id, { progress });
        });

        if (result.voters.length === 0) {
          updateImportJob(job.id, {
            status: "failed",
            error:
              "PDF থেকে কোনো ভোটার তথ্য বের করা যায়নি। PDF ফরম্যাট চেক করুন।",
          });
          return;
        }

        updateImportJob(job.id, {
          status: "done",
          result: {
            voters: result.voters,
            totalPages: result.pages,
            totalExtracted: result.voters.length,
            method: result.method,
          },
        });
      } catch (err) {
        updateImportJob(job.id, {
          status: "failed",
          error: err.message || "PDF ইম্পোর্ট ব্যর্থ",
        });
      } finally {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {}
      }
    })();
  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: "PDF প্রক্রিয়াকরণ ব্যর্থ: " + error.message,
    });
  }
};

// @desc    Get import job status
// @route   GET /api/import/status/:jobId
const getImportStatus = async (req, res) => {
  const job = importJobs.get(req.params.jobId);
  if (!job || job.userId.toString() !== req.user._id.toString()) {
    return res.status(404).json({
      success: false,
      message: "ইম্পোর্ট স্ট্যাটাস পাওয়া যায়নি",
    });
  }

  return res.json({
    success: true,
    status: job.status,
    progress: job.progress,
    error: job.error,
    data: job.status === "done" ? job.result : null,
  });
};

// @desc    Save imported voters from PDF
// @route   POST /api/import/save
const saveImportedVoters = async (req, res) => {
  try {
    const { centerId, voters } = req.body;

    if (!centerId) {
      return res.status(400).json({
        success: false,
        message: "কেন্দ্র নির্বাচন করুন",
      });
    }

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

    const voterDocs = voters.map((v, index) => ({
      cr: v.cr || "",
      voterNo: v.voterNo || "",
      nid: v.nid || "",
      name: v.name || "অজানা",
      fatherName: v.fatherName || "",
      motherName: v.motherName || "",
      husbandName: v.husbandName || "",
      gender: v.gender || "",
      occupation: v.occupation || "",
      dateOfBirth: v.dateOfBirth || "",
      address: v.address || "",
      area: v.area || "",
      center: centerId,
      createdBy: req.user._id,
      serialNo: v.serialNo || index + 1,
    }));

    const batchSize = 500;
    let totalInserted = 0;
    let errors = [];

    for (let i = 0; i < voterDocs.length; i += batchSize) {
      const batch = voterDocs.slice(i, i + batchSize);
      try {
        const result = await Voter.insertMany(batch, { ordered: false });
        totalInserted += result.length;
      } catch (err) {
        if (err.insertedDocs) {
          totalInserted += err.insertedDocs.length;
        }
        errors.push(err.message);
      }
    }

    await center.updateVoterCount();

    res.status(201).json({
      success: true,
      message: `${totalInserted} জন ভোটার সফলভাবে সংরক্ষণ হয়েছে`,
      data: {
        inserted: totalInserted,
        total: voterDocs.length,
        errors: errors.length > 0 ? errors : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Import voters from manual JSON/text input
// @route   POST /api/import/manual
const importManual = async (req, res) => {
  try {
    const { centerId, text } = req.body;

    if (!centerId || !text) {
      return res.status(400).json({
        success: false,
        message: "কেন্দ্র ও টেক্সট আবশ্যক",
      });
    }

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

    const result = parseVoters(text, "");

    res.json({
      success: true,
      message: `${result.voters.length} জন ভোটারের তথ্য বের করা হয়েছে`,
      data: {
        voters: result.voters,
        totalExtracted: result.voters.length,
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
  importPdf,
  getImportStatus,
  saveImportedVoters,
  importManual,
};
