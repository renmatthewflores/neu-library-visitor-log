/**
 * NEU Library — Firestore Seed Script
 * Run this ONCE in the browser console while authenticated as admin,
 * or adapt it as a Node.js script with the Admin SDK.
 *
 * Usage (browser console, after logging in):
 *   Copy & paste this entire file into the browser console and press Enter.
 */

import { getFirestore, collection, addDoc, Timestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const REASONS = [
  "Study / Research",
  "Borrow / Return Books",
  "Use Computer",
  "Reference Reading",
  "Group Discussion",
  "Thesis / Capstone Work",
  "Faculty Research",
  "Event / Seminar",
  "Others"
];

const COLLEGES = [
  "College of Engineering",
  "College of Business Administration",
  "College of Computer Studies",
  "College of Education",
  "College of Arts and Sciences",
  "College of Nursing",
  "College of Architecture",
  "Graduate School",
  "N/A"
];

const NAMES = [
  "Maria Santos", "Juan Dela Cruz", "Ana Reyes", "Carlo Bautista",
  "Liza Gomez", "Ramon Cruz", "Elena Flores", "Mark Villanueva",
  "Rosa Mendoza", "Andres Aquino", "Teresa Lim", "Jose Manalo",
  "Carmen Ramos", "Pedro Ocampo", "Nora Pascual"
];

async function seed() {
  // Access the db from the running app
  const db = window.__neuDB;  // exposed by app.js if window.__neuDB = db;
  if (!db) {
    console.error("Firestore db not found. Make sure the app is running.");
    return;
  }

  const ref = collection(db, "visitors");
  const now = Date.now();
  const count = 60;
  let added = 0;

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.random() * 14; // last 2 weeks
    const dt = new Date(now - daysAgo * 86400 * 1000);
    dt.setHours(Math.floor(Math.random() * 10) + 7, Math.floor(Math.random() * 60));

    await addDoc(ref, {
      uid: `seed_${i}`,
      name: NAMES[Math.floor(Math.random() * NAMES.length)],
      email: `visitor${i}@neu.edu.ph`,
      reason: REASONS[Math.floor(Math.random() * REASONS.length)],
      college: COLLEGES[Math.floor(Math.random() * COLLEGES.length)],
      isEmployee: Math.random() > 0.75,
      visitedAt: Timestamp.fromDate(dt)
    });
    added++;
    if (added % 10 === 0) console.log(`Seeded ${added}/${count}...`);
  }

  console.log(`✅ Done! Seeded ${added} visitor records.`);
}

seed();
