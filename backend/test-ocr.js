const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

/* ── Bengali digit to English ────────────────────────── */
const BN = "\u09E6\u09E7\u09E8\u09E9\u09EA\u09EB\u09EC\u09ED\u09EE\u09EF";
const bnToEn = (s) =>
  s ? s.replace(/[\u09E6-\u09EF]/g, (d) => BN.indexOf(d).toString()) : s;

/* ── OCR helpers ─────────────────────────────────────── */
function tessOcr(dir, filename, psm) {
  try {
    return execSync(
      `cd "${dir}" && tesseract "${filename}" stdout -l ben --psm ${psm} 2>/dev/null`,
      {
        encoding: "utf8",
        timeout: 120000,
      },
    );
  } catch {
    return "";
  }
}

async function ocrPageFull(imgPath, tmpDir) {
  return tessOcr(tmpDir, path.basename(imgPath), 1);
}

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

/* ── Clean a field value: remove text after a duplicate label ── */
function cleanField(value, fieldLabel) {
  if (!value) return "";
  // If the value contains another field label (from merged columns), truncate there
  const labels = [
    "\u09AA\u09BF\u09A4\u09BE",
    "\u09AE\u09BE\u09A4\u09BE",
    "\u09AA\u09C7\u09B6\u09BE",
    "\u099C\u09A8\u09CD\u09AE",
    "\u09A0\u09BF\u0995\u09BE\u09A8\u09BE",
    "\u09AD\u09CB\u09AF\u09BC\u09BE\u09B0",
  ];
  let cleaned = value;
  for (const lbl of labels) {
    if (lbl === fieldLabel) continue; // Don't split on our own label
    const idx = cleaned.indexOf(lbl);
    if (idx > 0) cleaned = cleaned.substring(0, idx);
  }
  // Also cut at duplicate of same label
  const secondIdx = cleaned.indexOf(fieldLabel, 1);
  if (secondIdx > 0) cleaned = cleaned.substring(0, secondIdx);

  // Remove artifacts
  return cleaned
    .replace(/[\d\u09E6-\u09EF]{5,}/g, "")
    .replace(/["\u201C\u201D*#$|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ── Parse voter text ────────────────────────────────── */
function parseVoters(text, globalGender) {
  const voters = [];
  let cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/\u0964/g, ".")
    .replace(/[|\[\]]/g, "");

  // Detect gender from page header
  let gender = globalGender || "";
  if (cleaned.includes("\u09AE\u09B9\u09BF\u09B2\u09BE"))
    gender = "\u09AE\u09B9\u09BF\u09B2\u09BE";
  else if (cleaned.includes("\u09AA\u09C1\u09B0\u09C1\u09B7"))
    gender = "\u09AA\u09C1\u09B0\u09C1\u09B7";

  // Find all anchors
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
    let name = anchors[i].nameRaw
      .split(/[\d\u09E6-\u09EF]{1,4}\s*[.\-]\s*\u09A8\u09BE[\u09AE\u09B7]/)[0]
      .replace(/[\d\u09E6-\u09EF]{5,}/g, "")
      .replace(/[^(\u0980-\u09FF)\s.\u0983]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const v = {
      serialNo: parseInt(anchors[i].serial) || i + 1,
      cr: anchors[i].serial,
      name: name,
      voterNo: "",
      fatherName: "",
      motherName: "",
      occupation: "",
      dateOfBirth: "",
      address: "",
      gender: gender,
    };

    // Voter number
    const vnM = chunk.match(
      /(?:\u09AD\u09CB[\u09AF\u09DF]?\u09BC?\u09BE?\u09B0|\u09AD\u09BE[\u09B0\u09A4]\u09BE?\u09B0?|\u09B0)\s*\u09A8[\u0982\u09AE\u09C7]\u09CD?\u09AC?\u09B0?\s*[:\uFF1A.\-\s]\s*([\d\u09E6-\u09EF\s]{5,20})/i,
    );
    if (vnM) v.voterNo = bnToEn(vnM[1].replace(/\s/g, ""));

    // Father
    const fM = chunk.match(
      /\u09AA\u09BF\u09A4\u09BE[\u0983]?\s*[:\uFF1A.\-]\s*([^\n]*)/i,
    );
    if (fM) v.fatherName = cleanField(fM[1], "\u09AA\u09BF\u09A4\u09BE");

    // Mother
    const mM = chunk.match(
      /\u09AE\u09BE\u09A4\u09BE\s*[:\uFF1A.\-]\s*([^\n]*)/i,
    );
    if (mM) v.motherName = cleanField(mM[1], "\u09AE\u09BE\u09A4\u09BE");

    // Occupation + DOB
    const odM = chunk.match(
      /\u09AA\u09C7\u09B6\u09BE\s*[:\uFF1A.\-]\s*([^,\n]*?)(?:[,\s]+)?\u099C\u09A8\u09CD?\u09AE?\u09BE?\s*\u09A4\u09BE\u09B0\u09BF[\u0996\u09AC][:\uFF1A.\-\s]*([\d\u09E6-\u09EF\/.\-]+)/i,
    );
    if (odM) {
      v.occupation = cleanField(odM[1], "\u09AA\u09C7\u09B6\u09BE");
      v.dateOfBirth = bnToEn(odM[2]);
    } else {
      const dM = chunk.match(
        /\u09A4\u09BE\u09B0\u09BF[\u0996\u09AC][:\uFF1A.\-\s]*([\d\u09E6-\u09EF\/.\-]{6,12})/i,
      );
      if (dM) v.dateOfBirth = bnToEn(dM[1]);
      const oM = chunk.match(
        /\u09AA\u09C7\u09B6\u09BE\s*[:\uFF1A.\-]\s*([^\n,]{2,30})/i,
      );
      if (oM) v.occupation = cleanField(oM[1], "\u09AA\u09C7\u09B6\u09BE");
    }

    // Address
    const aM = chunk.match(
      /\u09A0\u09BF\u0995\u09BE\u09A8\u09BE\s*[:\uFF1A.\-]\s*([^\n]*)/i,
    );
    if (aM)
      v.address = cleanField(aM[1], "\u09A0\u09BF\u0995\u09BE\u09A8\u09BE");

    if ((v.name.match(/[\u0980-\u09FF]/g) || []).length >= 2) voters.push(v);
  }

  return { voters, gender };
}

/* ── Smart merge: prefer shorter clean values ────────── */
function mergeVoterLists(list1, list2) {
  const map = new Map();

  const scoreField = (val) => {
    if (!val) return 0;
    // Penalize values that contain duplicate labels (merged column artifacts)
    const labels = [
      "\u09AA\u09BF\u09A4\u09BE:",
      "\u09AE\u09BE\u09A4\u09BE:",
      "\u09A0\u09BF\u0995\u09BE\u09A8\u09BE:",
    ];
    let penalty = 0;
    for (const l of labels) {
      if ((val.match(new RegExp(l, "g")) || []).length > 0) penalty += 10;
    }
    // Bengali char count (higher is better)
    const bc = (val.match(/[\u0980-\u09FF]/g) || []).length;
    return bc - penalty;
  };

  const addToMap = (voter) => {
    const key = voter.cr;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...voter });
      return;
    }
    for (const field of [
      "name",
      "voterNo",
      "fatherName",
      "motherName",
      "occupation",
      "dateOfBirth",
      "address",
      "gender",
    ]) {
      if (!existing[field] && voter[field]) {
        existing[field] = voter[field];
      } else if (existing[field] && voter[field]) {
        if (field === "voterNo") {
          // For voter number, prefer longer (more complete)
          if (voter[field].length > existing[field].length)
            existing[field] = voter[field];
        } else if (field === "dateOfBirth") {
          // For DOB, prefer the one that looks like a proper date (DD/MM/YYYY)
          if (
            voter[field].match(/^\d{2}\/\d{2}\/\d{4}$/) &&
            !existing[field].match(/^\d{2}\/\d{2}\/\d{4}$/)
          ) {
            existing[field] = voter[field];
          }
        } else {
          // For text fields, prefer the one with higher score (more Bengali, fewer artifacts)
          if (scoreField(voter[field]) > scoreField(existing[field])) {
            existing[field] = voter[field];
          }
        }
      }
    }
  };

  list1.forEach(addToMap);
  list2.forEach(addToMap);

  return Array.from(map.values()).sort((a, b) => a.serialNo - b.serialNo);
}

/* ── Main ────────────────────────────────────────────── */
async function main() {
  const pdfPath =
    "/Users/alamgirhossain/Downloads/CamScanner 01-25-2026 17.16.pdf";
  const tmpDir = "/tmp/ocr_" + Date.now();
  fs.mkdirSync(tmpDir, { recursive: true });

  const startPage = 2,
    endPage = 10;
  console.log(`Converting pages ${startPage}-${endPage}...`);
  execSync(
    `pdftoppm -png -r 300 -f ${startPage} -l ${endPage} "${pdfPath}" "${tmpDir}/page"`,
    { timeout: 300000 },
  );

  const pages = fs
    .readdirSync(tmpDir)
    .filter((f) => f.match(/^page-\d+\.png$/))
    .sort();
  console.log("Pages:", pages.length);

  let allVoters = [];
  let detectedGender = "";

  for (const pg of pages) {
    const t0 = Date.now();
    const imgPath = path.join(tmpDir, pg);

    const text1 = await ocrPageFull(imgPath, tmpDir);
    const r1 = parseVoters(text1, detectedGender);

    const text2 = await ocrPageColumns(imgPath, tmpDir);
    const r2 = parseVoters(text2, detectedGender);

    if (r1.gender) detectedGender = r1.gender;
    if (r2.gender) detectedGender = r2.gender;

    const merged = mergeVoterLists(r1.voters, r2.voters);
    console.log(
      `${pg}: PSM1=${r1.voters.length} COLS=${r2.voters.length} -> ${merged.length} (${Date.now() - t0}ms)`,
    );

    allVoters = allVoters.concat(merged);
  }

  // Global dedup
  const finalMap = new Map();
  for (const v of allVoters) {
    const existing = finalMap.get(v.cr);
    if (!existing) finalMap.set(v.cr, v);
    else {
      for (const f of [
        "name",
        "voterNo",
        "fatherName",
        "motherName",
        "occupation",
        "dateOfBirth",
        "address",
        "gender",
      ]) {
        if (!existing[f] && v[f]) existing[f] = v[f];
      }
    }
  }
  const final = Array.from(finalMap.values()).sort(
    (a, b) => a.serialNo - b.serialNo,
  );

  console.log(
    `\nFINAL: ${final.length} unique voters from ${endPage - startPage + 1} pages`,
  );

  // Show first 15
  final.slice(0, 15).forEach((v) => {
    console.log(`\n#${v.cr.padStart(3, "0")} ${v.name}`);
    console.log(
      `  VN:${v.voterNo || "-"} F:${v.fatherName || "-"} M:${v.motherName || "-"}`,
    );
    console.log(
      `  O:${v.occupation || "-"} DOB:${v.dateOfBirth || "-"} A:${v.address || "-"}`,
    );
  });

  const wVN = final.filter((v) => v.voterNo).length;
  const wF = final.filter((v) => v.fatherName).length;
  const wM = final.filter((v) => v.motherName).length;
  const wD = final.filter((v) => v.dateOfBirth).length;
  const wA = final.filter((v) => v.address).length;
  console.log("\n--- Stats ---");
  console.log(
    `voterNo: ${wVN}/${final.length} (${((wVN / final.length) * 100).toFixed(0)}%)`,
  );
  console.log(
    `father:  ${wF}/${final.length} (${((wF / final.length) * 100).toFixed(0)}%)`,
  );
  console.log(
    `mother:  ${wM}/${final.length} (${((wM / final.length) * 100).toFixed(0)}%)`,
  );
  console.log(
    `DOB:     ${wD}/${final.length} (${((wD / final.length) * 100).toFixed(0)}%)`,
  );
  console.log(
    `address: ${wA}/${final.length} (${((wA / final.length) * 100).toFixed(0)}%)`,
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

main().catch(console.error);
