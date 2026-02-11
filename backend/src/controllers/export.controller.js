const PDFDocument = require("pdfkit");
const path = require("path");
const Voter = require("../models/Voter");

// Bengali number conversion
const toBengaliNumber = (num) => {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (d) => bengaliDigits[parseInt(d)]);
};

// @desc    Export voter details to PDF
// @route   GET /api/export/voter/:id
const exportVoterPdf = async (req, res) => {
  try {
    const voter = await Voter.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    }).populate("center", "centerName division zilla upazila union ward");

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: "ভোটার পাওয়া যায়নি",
      });
    }

    // Create PDF
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: `ভোটার তথ্য - ${voter.name}`,
        Author: "ভোটার সার্চ অ্যাপ",
      },
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=voter-${voter.voterNo || voter._id}.pdf`,
    );

    doc.pipe(res);

    // Use default font that supports Unicode/Bengali
    // PDFKit's default font supports basic characters; for full Bengali we use a system font
    const fontPath = path.join(
      __dirname,
      "../assets/fonts/NotoSansBengali-Regular.ttf",
    );
    const fontBoldPath = path.join(
      __dirname,
      "../assets/fonts/NotoSansBengali-Bold.ttf",
    );

    let useCustomFont = false;
    try {
      const fs = require("fs");
      if (fs.existsSync(fontPath)) {
        doc.registerFont("Bengali", fontPath);
        doc.registerFont("BengaliBold", fontBoldPath);
        useCustomFont = true;
      }
    } catch (e) {
      // Fallback to default font
    }

    const setFont = (bold = false) => {
      if (useCustomFont) {
        doc.font(bold ? "BengaliBold" : "Bengali");
      } else {
        doc.font(bold ? "Helvetica-Bold" : "Helvetica");
      }
    };

    // Header
    setFont(true);
    doc.fontSize(20).text("ভোটার তথ্য", { align: "center" });
    doc.moveDown(0.5);

    // Divider
    doc
      .strokeColor("#1a73e8")
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown(1);

    // Voter Details
    const addField = (label, value) => {
      if (!value) return;
      setFont(true);
      doc.fontSize(12).text(`${label}: `, { continued: true });
      setFont(false);
      doc.text(value || "-");
      doc.moveDown(0.3);
    };

    addField("ক্রমিক নং", voter.cr);
    addField("ভোটার নং", voter.voterNo);
    addField("জাতীয় পরিচয়পত্র নং", voter.nid);
    doc.moveDown(0.5);

    addField("নাম", voter.name);
    addField("পিতার নাম", voter.fatherName);
    addField("মাতার নাম", voter.motherName);
    if (voter.husbandName) addField("স্বামীর নাম", voter.husbandName);
    addField("লিঙ্গ", voter.gender);
    doc.moveDown(0.5);

    addField("পেশা", voter.occupation);
    addField("জন্ম তারিখ", voter.dateOfBirth);
    addField("ঠিকানা", voter.address);
    if (voter.area) addField("এলাকা", voter.area);
    doc.moveDown(1);

    // Center Info
    if (voter.center) {
      doc
        .strokeColor("#e0e0e0")
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();
      doc.moveDown(0.5);

      setFont(true);
      doc.fontSize(14).text("কেন্দ্র তথ্য", { align: "left" });
      doc.moveDown(0.5);

      addField("কেন্দ্রের নাম", voter.center.centerName);
      addField("বিভাগ", voter.center.division);
      addField("জেলা", voter.center.zilla);
      addField("উপজেলা", voter.center.upazila);
      if (voter.center.union) addField("ইউনিয়ন", voter.center.union);
      if (voter.center.ward) addField("ওয়ার্ড", voter.center.ward);
    }

    // Footer
    doc.moveDown(2);
    doc
      .strokeColor("#e0e0e0")
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown(0.5);

    setFont(false);
    doc
      .fontSize(9)
      .fillColor("#999")
      .text(
        `তৈরি: ${new Date().toLocaleDateString("bn-BD")} | ভোটার সার্চ অ্যাপ`,
        {
          align: "center",
        },
      );

    doc.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Export center voters list to PDF
// @route   GET /api/export/center/:centerId
const exportCenterPdf = async (req, res) => {
  try {
    const center = await require("../models/Center").findOne({
      _id: req.params.centerId,
      createdBy: req.user._id,
    });

    if (!center) {
      return res.status(404).json({
        success: false,
        message: "কেন্দ্র পাওয়া যায়নি",
      });
    }

    const voters = await Voter.find({ center: center._id })
      .sort({ serialNo: 1, voterNo: 1 })
      .lean();

    const doc = new PDFDocument({
      size: "A4",
      margin: 30,
      layout: "landscape",
      info: {
        Title: `ভোটার তালিকা - ${center.centerName}`,
        Author: "ভোটার সার্চ অ্যাপ",
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=center-voters-${center._id}.pdf`,
    );

    doc.pipe(res);

    // Title
    doc
      .fontSize(16)
      .text(`ভোটার তালিকা - ${center.centerName}`, { align: "center" });
    doc
      .fontSize(10)
      .text(
        `${center.division} > ${center.zilla} > ${center.upazila} | মোট ভোটার: ${toBengaliNumber(voters.length)}`,
        { align: "center" },
      );
    doc.moveDown(1);

    // Simple list format
    const headers = [
      "নং",
      "ভোটার নং",
      "নাম",
      "পিতার নাম",
      "মাতার নাম",
      "জন্ম তারিখ",
      "ঠিকানা",
    ];
    const colWidths = [30, 70, 120, 120, 120, 80, 200];

    // Header row
    let x = 30;
    doc.fontSize(9);
    headers.forEach((h, i) => {
      doc.text(h, x, doc.y, { width: colWidths[i] });
      x += colWidths[i] + 5;
    });
    doc.moveDown(0.5);

    // Data rows
    voters.forEach((voter, idx) => {
      if (doc.y > 530) {
        doc.addPage();
        doc.y = 30;
      }

      x = 30;
      const y = doc.y;
      const row = [
        toBengaliNumber(idx + 1),
        voter.voterNo || "-",
        voter.name || "-",
        voter.fatherName || "-",
        voter.motherName || "-",
        voter.dateOfBirth || "-",
        voter.address || "-",
      ];

      row.forEach((val, i) => {
        doc.text(val, x, y, { width: colWidths[i] });
        x += colWidths[i] + 5;
      });
      doc.moveDown(0.3);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  exportVoterPdf,
  exportCenterPdf,
};
