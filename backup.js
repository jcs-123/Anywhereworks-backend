require("dotenv").config();
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

// ---------- CONFIG ----------
const DATABASE_URI = process.env.DATABASE;
const BACKUP_DIR = process.env.BACKUP_DIR || "C:/backups";
const DB_NAME = process.env.DB_NAME || "Anywhereworks";
const BACKUP_HOUR = parseInt(process.env.BACKUP_HOUR) || 12;
const BACKUP_MINUTE = parseInt(process.env.BACKUP_MINUTE) || 30;
const MONGODUMP_PATH = `"C:\\Program Files\\MongoDB\\Tools\\100\\bin\\mongodump.exe"`;

// Ensure backup folder exists
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// ---------- BACKUP FUNCTION ----------
async function backupDatabase() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFolder = path.join(BACKUP_DIR, `${timestamp}_${DB_NAME}`);
    fs.mkdirSync(backupFolder, { recursive: true });

    console.log("🚀 Starting backup at", new Date().toLocaleString());

    // 1️⃣ Full database dump (all collections)
    await new Promise((resolve, reject) => {
      const cmd = `${MONGODUMP_PATH} --uri="${DATABASE_URI}" --db="${DB_NAME}" --out="${backupFolder}"`;
      exec(cmd, (err, stdout, stderr) => {
        if (err) return reject(err);
        console.log("✅ MongoDB dump completed");
        resolve();
      });
    });

    // 2️⃣ Optional: Export JSON for all collections
    const client = await MongoClient.connect(DATABASE_URI);
    const db = client.db(DB_NAME);
    const collections = await db.listCollections().toArray();

    for (let coll of collections) {
      const data = await db.collection(coll.name).find({}).toArray();
      const jsonFilePath = path.join(backupFolder, `${coll.name}.json`);
      fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
      console.log(`📄 JSON exported: ${coll.name}`);
    }

    await client.close();

    console.log("✅ Backup completed successfully at", backupFolder);
  } catch (err) {
    console.error("❌ Backup failed:", err);
  }
}

// ---------- AUTO SCHEDULE ----------
function scheduleBackup() {
  const now = new Date();
  let nextRun = new Date();
  nextRun.setHours(BACKUP_HOUR, BACKUP_MINUTE, 0, 0);

  if (now > nextRun) nextRun.setDate(nextRun.getDate() + 1); // schedule next day if time passed

  const timeout = nextRun - now;
  console.log(`🕒 Next backup scheduled at: ${nextRun.toLocaleString()}`);

  setTimeout(async () => {
    await backupDatabase();
    scheduleBackup(); // schedule next backup
  }, timeout);
}

// Start auto-backup
scheduleBackup();

// Optional: run immediately once
backupDatabase();
