// controllers/renewal.controller.js
const Renewal = require('../model/renewalmodal');
const nodemailer = require("nodemailer");
const cron = require("node-cron");

// ==================================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "jcs@jecc.ac.in",
    pass: "lbak wqdd keih qagt",
  },
});

// ==================================================
// ===== Fixed Recipients =====
// ==================================================
const FIXED_RECIPIENTS = [
  "ansonneelamkavil@jecc.ac.in",
  "debinolakkengil@jecc.ac.in",
  "jcs@jecc.ac.in",
];

// ==================================================
// ===== Date Utility Functions =====
// ==================================================
function parseDate(dateString) {
  if (!dateString) return new Date();
  if (dateString instanceof Date) return new Date(dateString);
  if (typeof dateString === "string" && dateString.includes("/")) {
    const [d, m, y] = dateString.split("/").map((n) => parseInt(n, 10));
    return new Date(y, m - 1, d);
  }
  return new Date(dateString);
}

function formatDateForDisplay(date) {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ==================================================
// ===== Mail Templates =====
// ==================================================
function buildUpcomingTemplate(name, type, renewalDate, project, daysLeft) {
  const displayDate = formatDateForDisplay(parseDate(renewalDate));
  return `
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:30px;">
    <div style="max-width:600px; margin:auto; background:#fff; border-radius:10px; padding:25px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
      <h2 style="color:#1a73e8; text-align:center;">🔔 Renewal Reminder</h2>
      <p style="font-size:16px;">Dear Team,</p>
      <p>This is a reminder that the following renewal is approaching:</p>
      <table style="width:100%; border-collapse:collapse; margin:20px 0; font-size:15px;">
        <tr><td><b>Name</b></td><td>${name}</td></tr>
        <tr><td><b>Type</b></td><td>${type}</td></tr>
        <tr><td><b>Project</b></td><td>${project || "—"}</td></tr>
        <tr><td><b>Renewal Date</b></td><td><b style="color:#d93025">${displayDate}</b></td></tr>
        <tr><td><b>Days Left</b></td><td><b style="color:#d93025">${daysLeft} days</b></td></tr>
      </table>
      <p style="color:#d93025; font-weight:bold; text-align:center;">⚠️ Please ensure renewal before due date.</p>
      <p>Regards,<br/><b>Renewal Tracker System</b></p>
      <hr/><small style="display:block; text-align:center; color:#777;">Automated Email — Do Not Reply</small>
    </div>
  </div>`;
}

function buildExpiredTemplate(name, type, renewalDate, project, daysOverdue) {
  const displayDate = formatDateForDisplay(parseDate(renewalDate));
  return `
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:30px;">
    <div style="max-width:600px; margin:auto; background:#fff; border-radius:10px; padding:25px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
      <h2 style="color:#e84118; text-align:center;">🚨 EXPIRED Renewal Alert</h2>
      <p>Dear Team,</p>
      <p><b style="color:#e84118;">URGENT:</b> The following renewal has expired and needs attention:</p>
      <table style="width:100%; border-collapse:collapse; margin:20px 0; font-size:15px;">
        <tr><td><b>Name</b></td><td>${name}</td></tr>
        <tr><td><b>Type</b></td><td>${type}</td></tr>
        <tr><td><b>Project</b></td><td>${project || "—"}</td></tr>
        <tr><td><b>Renewal Date</b></td><td><b style="color:#e84118">${displayDate}</b></td></tr>
        <tr><td><b>Status</b></td><td><b style="color:#e84118">EXPIRED (${daysOverdue} days overdue)</b></td></tr>
      </table>
      <p style="color:#e84118; font-weight:bold; text-align:center;">🚨 IMMEDIATE ACTION REQUIRED!</p>
      <p>Regards,<br/><b>Renewal Tracker System</b></p>
      <hr/><small style="display:block; text-align:center; color:#777;">Automated Email — Do Not Reply</small>
    </div>
  </div>`;
}

// ==================================================
// ===== Mail Functions =====
// ==================================================
async function sendUpcomingMail(name, type, renewalDate, project, daysLeft) {
  const displayDate = formatDateForDisplay(parseDate(renewalDate));
  const subject = `Reminder: Renewal for ${name} (${type}) due in ${daysLeft} days (${displayDate})`;
  const html = buildUpcomingTemplate(name, type, renewalDate, project, daysLeft);

  await transporter.sendMail({
    from: `"Renewal Reminder" <jcs@jecc.ac.in>`,
    to: FIXED_RECIPIENTS,
    subject,
    html,
  });

  console.log(`✅ Sent upcoming reminder: ${name} (${type}) due in ${daysLeft} days`);
}

async function sendExpiredMail(name, type, renewalDate, project, daysOverdue) {
  const displayDate = formatDateForDisplay(parseDate(renewalDate));
  const subject = `URGENT: Renewal for ${name} (${type}) EXPIRED ${daysOverdue} days ago (${displayDate})`;
  const html = buildExpiredTemplate(name, type, renewalDate, project, daysOverdue);

  await transporter.sendMail({
    from: `"Renewal Alert" <jcs@jecc.ac.in>`,
    to: FIXED_RECIPIENTS,
    subject,
    html,
  });

  console.log(`🚨 Sent expired alert: ${name} (${type}) ${daysOverdue} days overdue`);
}

// ==================================================
// ===== Core Reminder Logic =====
// ==================================================
async function sendRemindersCore() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allRenewals = await Renewal.find().lean();
  console.log(`📊 Total renewals found: ${allRenewals.length}`);

  let upcomingCount = 0;
  let expiredCount = 0;

  for (const r of allRenewals) {
    if (r.isRenewed) continue; // Skip renewed ones

    const recordDate = parseDate(r.renewalDate);
    const diffDays = Math.ceil((recordDate - today) / (1000 * 60 * 60 * 24));

    // UPCOMING: including today
    if (diffDays >= 0 && diffDays <= 15) {
      await sendUpcomingMail(r.name, r.type, r.renewalDate, r.project, diffDays);
      upcomingCount++;
    }

    // EXPIRED: past due
    if (diffDays < 0) {
      await sendExpiredMail(r.name, r.type, r.renewalDate, r.project, Math.abs(diffDays));
      expiredCount++;
    }
  }

  console.log(`📧 Sent ${upcomingCount} upcoming and ${expiredCount} expired mails.`);
  return { upcoming: upcomingCount, expired: expiredCount };
}

// ==================================================
// ===== Cron Job (Runs daily at 11:20 AM IST) =====
// ==================================================
cron.schedule("12 15 * * *", async () => {
  console.log("⏰ Running daily auto reminder job (IST 3:12 PM)...");
  await sendRemindersCore();
}, {
  timezone: "Asia/Kolkata",
});

// ==================================================
// ===== API Controllers =====
// ==================================================

// GET /api/renewals
exports.list = async (req, res) => {
  try {
    const {
      q = '',
      sortBy = 'renewalDate',
      order = 'asc',
      page = 1,
      limit = 20,
    } = req.query;

    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);

    const query = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { type: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { project: { $regex: q, $options: 'i' } },
            { contactEmail: { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const sort = { [sortBy]: order === 'desc' ? -1 : 1 };

    const [data, total] = await Promise.all([
      Renewal.find(query).sort(sort)
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit)
        .lean(),
      Renewal.countDocuments(query),
    ]);

    // Add properly parsed dates for display
    const dataWithParsedDates = data.map(item => ({
      ...item,
      parsedRenewalDate: parseDate(item.renewalDate),
      displayDate: formatDateForDisplay(parseDate(item.renewalDate))
    }));

    res.json({
      data: dataWithParsedDates,
      page: numericPage,
      limit: numericLimit,
      total,
      pages: Math.ceil(total / numericLimit),
    });
  } catch (err) {
    console.error('renewals.list error:', err);
    res.status(500).json({ message: 'Failed to fetch renewals' });
  }
};

// GET /api/renewals/alerts?days=15
exports.alerts = async (req, res) => {
  try {
    const days = Math.max(parseInt(req.query.days, 10) || 15, 1);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const soon = new Date(today); soon.setDate(soon.getDate() + days);

    const allRenewals = await Renewal.find().lean();
    
    const expired = allRenewals.filter(record => {
      const recordDate = parseDate(record.renewalDate);
      return recordDate < today;
    }).sort((a, b) => parseDate(a.renewalDate) - parseDate(b.renewalDate));

    const dueSoon = allRenewals.filter(record => {
      const recordDate = parseDate(record.renewalDate);
      return recordDate >= today && recordDate <= soon;
    }).sort((a, b) => parseDate(a.renewalDate) - parseDate(b.renewalDate));

    res.json({ 
      expired: expired.map(item => ({
        ...item,
        parsedRenewalDate: parseDate(item.renewalDate),
        displayDate: formatDateForDisplay(parseDate(item.renewalDate))
      })),
      dueSoon: dueSoon.map(item => ({
        ...item,
        parsedRenewalDate: parseDate(item.renewalDate),
        displayDate: formatDateForDisplay(parseDate(item.renewalDate))
      })),
      days 
    });
  } catch (err) {
    console.error('renewals.alerts error:', err);
    res.status(500).json({ message: 'Failed to fetch alerts' });
  }
};

// GET /api/renewals/:id
exports.getOne = async (req, res) => {
  try {
    const doc = await Renewal.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    
    // Add parsed date for display
    const docWithParsedDate = {
      ...doc,
      parsedRenewalDate: parseDate(doc.renewalDate),
      displayDate: formatDateForDisplay(parseDate(doc.renewalDate))
    };
    
    res.json(docWithParsedDate);
  } catch (err) {
    console.error('renewals.getOne error:', err);
    res.status(500).json({ message: 'Failed to fetch renewal' });
  }
};

// POST /api/renewals
exports.create = async (req, res) => {
  try {
    const payload = {
      name: req.body.name,
      type: req.body.type,
      description: req.body.description,
      project: req.body.project,
      contactEmail: req.body.contactEmail,
      renewalDate: req.body.renewalDate,
    };
    const created = await Renewal.create(payload);
    res.status(201).json(created);
  } catch (err) {
    console.error('renewals.create error:', err);
    res.status(400).json({ message: err.message || 'Failed to create' });
  }
};

// PUT /api/renewals/:id
exports.update = async (req, res) => {
  try {
    const payload = {
      name: req.body.name,
      type: req.body.type,
      description: req.body.description,
      project: req.body.project,
      contactEmail: req.body.contactEmail,
      renewalDate: req.body.renewalDate,
    };
    const updated = await Renewal.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('renewals.update error:', err);
    res.status(400).json({ message: err.message || 'Failed to update' });
  }
};

// DELETE /api/renewals/:id
exports.remove = async (req, res) => {
  try {
    const deleted = await Renewal.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('renewals.remove error:', err);
    res.status(500).json({ message: 'Failed to delete' });
  }
};

// GET /api/renewals/send-reminders (manual trigger for testing)
exports.sendReminders = async (req, res) => {
  try {
    const result = await sendRemindersCore();
    res.json({ 
      message: "Reminder job executed manually", 
      upcomingSent: result.upcoming,
      expiredSent: result.expired
    });
  } catch (err) {
    console.error("sendReminders error:", err);
    res.status(500).json({ message: "Failed to send reminders" });
  }
};

// GET /api/renewals/debug-dates (new endpoint to check date parsing)
exports.debugDates = async (req, res) => {
  try {
    const allRenewals = await Renewal.find().lean();
    
    const debugData = allRenewals.map(record => {
      const parsedDate = parseDate(record.renewalDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return {
        name: record.name,
        originalDate: record.renewalDate,
        parsedDate: parsedDate.toISOString(),
        displayDate: formatDateForDisplay(parsedDate),
        status: parsedDate < today ? 'EXPIRED' : parsedDate <= new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000) ? 'UPCOMING' : 'FUTURE',
        daysDifference: Math.ceil((parsedDate - today) / (1000 * 60 * 60 * 24))
      };
    });

    res.json(debugData);
  } catch (err) {
    console.error('renewals.debugDates error:', err);
    res.status(500).json({ message: 'Failed to debug dates' });
  }
};