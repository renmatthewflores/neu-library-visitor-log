// ============================================================
//  NEU Library Visitor Log — Main Application
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfig, ADMIN_EMAILS } from "./firebase-config.js";

// ──────────────────────────────────────────────
//  Firebase Init
// ──────────────────────────────────────────────
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ hd: "neu.edu.ph" });

// ──────────────────────────────────────────────
//  App State
// ──────────────────────────────────────────────
let state = {
  user: null,
  role: "user",        // "user" | "admin"
  loading: true,
  timeRange: "day",    // "day" | "week" | "custom"
  customStart: null,
  customEnd: null,
  filterReason: "",
  filterCollege: "",
  filterEmployee: "",
  visitors: [],
  dataLoading: false
};

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

// ──────────────────────────────────────────────
//  Render Root
// ──────────────────────────────────────────────
const $app = document.getElementById("app");

function render() {
  if (state.loading) {
    $app.innerHTML = `
      <div class="bg-pattern"></div>
      <div class="loading-state" style="min-height:100vh">
        <div class="spinner"></div>
        <span>Initializing…</span>
      </div>`;
    return;
  }
  if (!state.user) { renderLogin(); return; }
  if (state.role === "admin") { renderAdmin(); }
  else { renderWelcome(); }
}

// ──────────────────────────────────────────────
//  Login Page
// ──────────────────────────────────────────────
function renderLogin(error = "") {
  $app.innerHTML = `
    <div class="bg-pattern"></div>
    <div class="login-page">
      <div class="login-card">
        <div class="login-emblem">📚</div>
        <div class="institution">Nueva Ecija University of Science and Technology</div>
        <h1>Library Visitor Log</h1>
        <p class="subtitle">Sign in with your institutional Google account to continue.</p>
        <div class="divider"></div>
        <button class="google-btn" id="google-signin-btn">
          ${googleSVG()}
          Sign in with Google
        </button>
        ${error ? `<div class="error-banner">${error}</div>` : ""}
      </div>
    </div>`;
  document.getElementById("google-signin-btn").addEventListener("click", handleGoogleSignIn);
}

async function handleGoogleSignIn() {
  const btn = document.getElementById("google-signin-btn");
  if (!btn) return;
  btn.classList.add("loading");
  btn.innerHTML = `${googleSVG()} Signing in…`;
  try {
    await signInWithRedirect(auth, provider);

    // ── Enforce institutional domain ──────────────────────────────────
    if (!user.email?.endsWith("@neu.edu.ph") && !ADMIN_EMAILS.includes(user.email)) {
      await signOut(auth);
      renderLogin("Access is restricted to <strong>@neu.edu.ph</strong> accounts only. Please use your institutional email.");
      return;
    }
    // ─────────────────────────────────────────────────────────────────
  } catch (err) {
    console.error(err);
    let msg = "Sign-in failed. Please try again.";
    if (err.code === "auth/popup-closed-by-user") msg = "Sign-in was cancelled.";
    else if (err.code === "auth/popup-blocked") msg = "Pop-up was blocked by your browser. Please allow pop-ups.";
    renderLogin(msg);
  }
}

// ──────────────────────────────────────────────
//  Navbar (shared)
// ──────────────────────────────────────────────
function renderNavbar() {
  const isAdmin = ADMIN_EMAILS.includes(state.user?.email);
  const avatarHtml = state.user?.photoURL
    ? `<div class="user-avatar"><img src="${state.user.photoURL}" alt="" /></div>`
    : `<div class="user-avatar">${(state.user?.displayName || "U")[0]}</div>`;

  return `
    <nav class="navbar">
      <div class="navbar-brand">
        <div class="brand-icon">📚</div>
        NEU Library
      </div>
      <div class="navbar-actions">
        ${isAdmin ? `
          <div class="role-toggle">
            <button class="role-toggle-btn ${state.role === 'user' ? 'active' : ''}" data-role="user">User</button>
            <button class="role-toggle-btn ${state.role === 'admin' ? 'active' : ''}" data-role="admin">Admin</button>
          </div>` : ""}
        <div class="user-chip">
          ${avatarHtml}
          <span>${state.user?.displayName?.split(" ")[0] || "User"}</span>
        </div>
        <button class="logout-btn" id="logout-btn">Sign out</button>
      </div>
    </nav>`;
}

function bindNavbar() {
  document.querySelectorAll(".role-toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.role = btn.dataset.role;
      state.visitors = [];
      render();
      if (state.role === "admin") loadVisitors();
    });
  });
  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await signOut(auth);
  });
}

// ──────────────────────────────────────────────
//  Welcome Page (Regular User)
// ──────────────────────────────────────────────
function renderWelcome() {
  const name = state.user?.displayName || "Visitor";
  const email = state.user?.email || "";
  $app.innerHTML = `
    ${renderNavbar()}
    <div class="bg-pattern"></div>
    <div class="welcome-page">
      <div class="welcome-card">
        <span class="welcome-illustration">📚</span>
        <h2>Welcome to NEU Library!</h2>
        <p class="welcome-subtitle">
          Hello, <span class="user-name">${name}</span>!<br/>
          We're glad to have you here. Enjoy your visit.
        </p>
        <div class="info-chips">
          <div class="info-chip">✉️ ${email}</div>
          <div class="info-chip">🗓️ ${new Date().toLocaleDateString("en-PH", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</div>
          <div class="info-chip">🕐 ${new Date().toLocaleTimeString("en-PH", { hour:"2-digit", minute:"2-digit" })}</div>
        </div>
      </div>
    </div>`;
  bindNavbar();
}

// ──────────────────────────────────────────────
//  Admin Dashboard
// ──────────────────────────────────────────────
function renderAdmin() {
  $app.innerHTML = `
    ${renderNavbar()}
    <div class="bg-pattern"></div>
    <div class="admin-page">
      <div class="admin-header">
        <h2>📊 Visitor Statistics</h2>
        <p>Monitor library visits filtered by date range, reason, college, or visitor type.</p>
      </div>

      <!-- Time Range Tabs -->
      <div class="time-tabs">
        <button class="time-tab ${state.timeRange === 'day' ? 'active' : ''}" data-range="day">Today</button>
        <button class="time-tab ${state.timeRange === 'week' ? 'active' : ''}" data-range="week">This Week</button>
        <button class="time-tab ${state.timeRange === 'custom' ? 'active' : ''}" data-range="custom">Custom Range</button>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        ${state.timeRange === "custom" ? `
          <div class="filter-group">
            <label>From</label>
            <input type="date" id="date-start" value="${state.customStart || today()}" />
          </div>
          <div class="filter-group">
            <label>To</label>
            <input type="date" id="date-end" value="${state.customEnd || today()}" />
          </div>` : `<div class="filter-group" style="flex:0 0 auto"><span style="font-size:0.82rem;color:var(--text-muted);padding-top:1.4rem;display:block">${rangeLabel()}</span></div>`}
        <div class="filter-group">
          <label>Reason for Visit</label>
          <select id="filter-reason">
            <option value="">All Reasons</option>
            ${REASONS.map(r => `<option value="${r}" ${state.filterReason === r ? "selected" : ""}>${r}</option>`).join("")}
          </select>
        </div>
        <div class="filter-group">
          <label>College</label>
          <select id="filter-college">
            <option value="">All Colleges</option>
            ${COLLEGES.map(c => `<option value="${c}" ${state.filterCollege === c ? "selected" : ""}>${c}</option>`).join("")}
          </select>
        </div>
        <div class="filter-group">
          <label>Visitor Type</label>
          <select id="filter-employee">
            <option value="">All Types</option>
            <option value="student" ${state.filterEmployee === "student" ? "selected" : ""}>Students</option>
            <option value="employee" ${state.filterEmployee === "employee" ? "selected" : ""}>Employees (Teacher/Staff)</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn-primary" id="apply-filters-btn">Apply</button>
          <button class="btn-secondary" id="reset-filters-btn">Reset</button>
        </div>
      </div>

      <!-- Stats Content -->
      <div id="stats-content">
        ${renderStatsContent()}
      </div>
    </div>`;

  bindNavbar();
  bindAdminControls();
}

function renderStatsContent() {
  if (state.dataLoading) {
    return `<div class="loading-state"><div class="spinner"></div><span>Loading visitor data…</span></div>`;
  }

  const filtered = applyFilters(state.visitors);
  const total = filtered.length;

  if (total === 0) {
    return `
      <div class="stat-card" style="text-align:center;padding:3rem">
        <div style="font-size:3rem;margin-bottom:1rem">🔍</div>
        <p style="color:var(--text-muted)">No visitor records found for the selected filters.</p>
      </div>`;
  }

  // Aggregate
  const employees = filtered.filter(v => v.isEmployee).length;
  const students = filtered.filter(v => !v.isEmployee).length;
  const reasonCounts = countBy(filtered, "reason");
  const collegeCounts = countBy(filtered, "college");
  const dayCounts = countByDay(filtered);

  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];
  const topCollege = Object.entries(collegeCounts).sort((a, b) => b[1] - a[1])[0];

  return `
    <!-- Summary Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-icon red">👥</div>
        <div class="stat-value">${total}</div>
        <div class="stat-label">Total Visitors</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon gold">🎓</div>
        <div class="stat-value">${students}</div>
        <div class="stat-label">Students</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon blue">🏫</div>
        <div class="stat-value">${employees}</div>
        <div class="stat-label">Employees</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon green">📖</div>
        <div class="stat-value">${topReason ? topReason[1] : 0}</div>
        <div class="stat-label">${topReason ? topReason[0] : "—"}</div>
      </div>
    </div>

    <!-- Breakdown Cards -->
    <div class="breakdown-grid">
      ${renderBreakdownCard("📋 Visits by Reason", reasonCounts, total)}
      ${renderBreakdownCard("🏛️ Visits by College", collegeCounts, total)}
      ${renderBreakdownCard("📅 Visits by Day", dayCounts, total)}
    </div>

    <!-- Recent Visitors Table -->
    <div class="table-card">
      <h3>🕐 Recent Visitors <span style="font-size:0.78rem;font-weight:400;color:var(--text-muted);margin-left:8px">(Latest 50)</span></h3>
      ${renderVisitorTable(filtered.slice(0, 50))}
    </div>`;
}

function renderBreakdownCard(title, counts, total) {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (sorted.length === 0) return `<div class="breakdown-card"><h3>${title}</h3><div class="empty-state"><p>No data</p></div></div>`;
  const rows = sorted.map(([label, count]) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return `
      <div class="breakdown-row">
        <span class="breakdown-label">${label}</span>
        <div class="breakdown-bar-wrap">
          <div class="breakdown-bar" style="width:${pct}%"></div>
        </div>
        <span class="breakdown-count">${count}</span>
      </div>`;
  }).join("");
  return `<div class="breakdown-card"><h3>${title}</h3>${rows}</div>`;
}

function renderVisitorTable(visitors) {
  if (!visitors.length) return `<div class="empty-state"><p>No records.</p></div>`;
  const rows = visitors.map(v => {
    const dt = v.visitedAt?.toDate ? v.visitedAt.toDate() : new Date(v.visitedAt);
    const dateStr = dt.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
    const timeStr = dt.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
    return `
      <tr>
        <td>${v.name || "—"}</td>
        <td>${v.college || "—"}</td>
        <td>${v.reason || "—"}</td>
        <td><span class="tag ${v.isEmployee ? 'employee' : 'student'}">${v.isEmployee ? "Employee" : "Student"}</span></td>
        <td style="color:var(--text-muted)">${dateStr} ${timeStr}</td>
      </tr>`;
  }).join("");
  return `
    <table>
      <thead><tr>
        <th>Name</th><th>College</th><th>Reason</th><th>Type</th><th>Date & Time</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ──────────────────────────────────────────────
//  Bind Admin Controls
// ──────────────────────────────────────────────
function bindAdminControls() {
  // Time tabs
  document.querySelectorAll(".time-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      state.timeRange = tab.dataset.range;
      render();
      loadVisitors();
    });
  });

  // Apply filters
  document.getElementById("apply-filters-btn")?.addEventListener("click", () => {
    state.filterReason = document.getElementById("filter-reason")?.value || "";
    state.filterCollege = document.getElementById("filter-college")?.value || "";
    state.filterEmployee = document.getElementById("filter-employee")?.value || "";
    if (state.timeRange === "custom") {
      state.customStart = document.getElementById("date-start")?.value || null;
      state.customEnd = document.getElementById("date-end")?.value || null;
      loadVisitors();
    } else {
      updateStatsContent();
    }
  });

  // Reset filters
  document.getElementById("reset-filters-btn")?.addEventListener("click", () => {
    state.filterReason = "";
    state.filterCollege = "";
    state.filterEmployee = "";
    state.customStart = null;
    state.customEnd = null;
    render();
    loadVisitors();
  });
}

function updateStatsContent() {
  const el = document.getElementById("stats-content");
  if (el) el.innerHTML = renderStatsContent();
}

// ──────────────────────────────────────────────
//  Firestore — Load Visitors
// ──────────────────────────────────────────────
async function loadVisitors() {
  state.dataLoading = true;
  updateStatsContent();

  try {
    const ref = collection(db, "visitors");
    let q;

    const { start, end } = getDateRange();
    q = query(
      ref,
      where("visitedAt", ">=", Timestamp.fromDate(start)),
      where("visitedAt", "<=", Timestamp.fromDate(end)),
      orderBy("visitedAt", "desc")
    );

    const snap = await getDocs(q);
    state.visitors = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Firestore error:", err);
    // If no composite index yet, fall back to unfiltered
    if (err.code === "failed-precondition" || err.code === "unimplemented") {
      try {
        const snap = await getDocs(collection(db, "visitors"));
        state.visitors = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e2) {
        state.visitors = [];
      }
    } else {
      state.visitors = getSampleData(); // dev fallback
    }
  }

  state.dataLoading = false;
  updateStatsContent();
}

// ──────────────────────────────────────────────
//  Helper: Date Range
// ──────────────────────────────────────────────
function getDateRange() {
  const now = new Date();
  if (state.timeRange === "day") {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (state.timeRange === "week") {
    const day = now.getDay();
    const start = new Date(now); start.setDate(now.getDate() - day); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  // custom
  const start = state.customStart ? new Date(state.customStart + "T00:00:00") : new Date(now.setHours(0,0,0,0));
  const end = state.customEnd ? new Date(state.customEnd + "T23:59:59") : new Date(now.setHours(23,59,59,999));
  return { start, end };
}

function rangeLabel() {
  const { start, end } = getDateRange();
  const fmt = (d) => d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  if (state.timeRange === "day") return `📅 Today — ${fmt(start)}`;
  return `📅 ${fmt(start)} – ${fmt(end)}`;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

// ──────────────────────────────────────────────
//  Helper: Filters & Aggregation
// ──────────────────────────────────────────────
function applyFilters(visitors) {
  return visitors.filter(v => {
    if (state.filterReason && v.reason !== state.filterReason) return false;
    if (state.filterCollege && v.college !== state.filterCollege) return false;
    if (state.filterEmployee === "employee" && !v.isEmployee) return false;
    if (state.filterEmployee === "student" && v.isEmployee) return false;
    return true;
  });
}

function countBy(arr, key) {
  const counts = {};
  arr.forEach(item => {
    const val = item[key] || "Unknown";
    counts[val] = (counts[val] || 0) + 1;
  });
  return counts;
}

function countByDay(arr) {
  const counts = {};
  arr.forEach(item => {
    const dt = item.visitedAt?.toDate ? item.visitedAt.toDate() : new Date(item.visitedAt);
    const day = dt.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
    counts[day] = (counts[day] || 0) + 1;
  });
  return counts;
}

// ──────────────────────────────────────────────
//  Sample Data (fallback for development/demo)
// ──────────────────────────────────────────────
function getSampleData() {
  const now = new Date();
  const names = ["Maria Santos", "Juan Dela Cruz", "Ana Reyes", "Carlo Bautista", "Liza Gomez",
    "Ramon Cruz", "Elena Flores", "Mark Villanueva", "Rosa Mendoza", "Andres Aquino"];
  return Array.from({ length: 40 }, (_, i) => {
    const dt = new Date(now.getTime() - Math.random() * 6 * 24 * 3600 * 1000);
    return {
      id: `sample_${i}`,
      name: names[Math.floor(Math.random() * names.length)],
      reason: REASONS[Math.floor(Math.random() * REASONS.length)],
      college: COLLEGES[Math.floor(Math.random() * COLLEGES.length)],
      isEmployee: Math.random() > 0.7,
      visitedAt: { toDate: () => dt }
    };
  });
}

// ──────────────────────────────────────────────
//  Google SVG Icon
// ──────────────────────────────────────────────
function googleSVG() {
  return `<svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>`;
}

// ──────────────────────────────────────────────
//  Auth State Observer
// ──────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
 if (user) {
    if (!user.email?.endsWith("@neu.edu.ph") && !ADMIN_EMAILS.includes(user.email)) {
      await signOut(auth);
      state.loading = false;
      renderLogin("Access is restricted to <strong>@neu.edu.ph</strong> accounts only.");
      return;
    }
    state.user = user;
    state.role = ADMIN_EMAILS.includes(user.email) ? "user" : "user";
    state.loading = false;
    render();

    const sessionKey = `neu_logged_${user.uid}_${new Date().toDateString()}`;
    if (!sessionStorage.getItem(sessionKey)) {
      try {
        await addDoc(collection(db, "visitors"), {
          uid: user.uid,
          name: user.displayName || "",
          email: user.email,
          reason: "General Visit",
          college: "N/A",
          isEmployee: false,
          visitedAt: serverTimestamp()
        });
        sessionStorage.setItem(sessionKey, "1");
      } catch (e) {
        console.warn("Could not log visitor:", e.message);
      }
    }

   
   
    render();
  } else {
    state.user = null;
    state.role = "user";
    state.loading = false;
    state.visitors = [];
    render();
  }
});

// Handle redirect result on page load
getRedirectResult(auth).then((result) => {
  if (result?.user) {
    const email = result.user.email || "";
    if (!email.endsWith("@neu.edu.ph") && !ADMIN_EMAILS.includes(email)) {
      signOut(auth);
    }
  }
}).catch((err) => {
  console.error(err);
});


// Initial render (show loading)
render();

