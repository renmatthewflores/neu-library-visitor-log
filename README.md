# 📚 NEU Library Visitor Log

> A secure, role-based library visitor tracking web application for **Nueva Ecija University of Science and Technology**.

## 🔗 Live Application

**[https://YOUR-PROJECT-ID.web.app](https://YOUR-PROJECT-ID.web.app)**

> ⚠️ Replace this URL with your actual Firebase Hosting URL after deployment (see Deployment section below).

---

## ✨ Features

| Feature | Description |
|---|---|
| **Google OAuth** | Sign in with `@neu.edu.ph` Google accounts |
| **Role-Based Access** | Same account can switch between User and Admin roles |
| **Visitor Logging** | Automatically logs each authenticated visit to Firestore |
| **Welcome Screen** | Regular users see a personalized "Welcome to NEU Library!" screen |
| **Admin Dashboard** | View statistics by day, week, or custom date range |
| **Smart Filters** | Filter stats by reason for visit, college, or visitor type (student/employee) |
| **Breakdown Cards** | Visual bar charts for visits by reason, college, and day |
| **Secure Rules** | Firestore security rules enforce read/write access per role |

---

## 🏗️ Tech Stack

- **Frontend**: Vanilla HTML + CSS + ES Modules (no build step)
- **Auth**: Firebase Authentication (Google Provider)
- **Database**: Cloud Firestore
- **Hosting**: Firebase Hosting
- **CDN**: Firebase SDK v10 via `gstatic.com`

---

## 🚀 Setup & Deployment

### Prerequisites
- Node.js 18+ (for Firebase CLI only)
- A Firebase project (free Spark plan is sufficient)
- Firebase CLI: `npm install -g firebase-tools`

---

### Step 1 — Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → name it (e.g., `neu-library-log`)
3. Enable **Google Analytics** (optional)

---

### Step 2 — Enable Authentication

1. In your Firebase console, go to **Build → Authentication**
2. Click **"Get started"**
3. Under **Sign-in method**, enable **Google**
4. Set the **support email** (your email)
5. Save

---

### Step 3 — Create Firestore Database

1. Go to **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (you'll add rules next)
4. Select a region close to the Philippines (e.g., `asia-southeast1`)

---

### Step 4 — Get Your Firebase Config

1. In Firebase console, go to ⚙️ **Project Settings → General**
2. Scroll to **"Your apps"**, click **"Add app" → Web (`</>`)**
3. Register the app (e.g., `neu-library-web`)
4. Copy the `firebaseConfig` object

---

### Step 5 — Add Config to the App

Open `src/firebase-config.js` and replace the placeholder values:

```js
export const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

export const ADMIN_EMAILS = [
  "jcesperanza@neu.edu.ph"
  // Add more admin emails here if needed
];
```

---

### Step 6 — Add Authorized Domain

1. In Firebase console, go to **Authentication → Settings → Authorized domains**
2. Add your Firebase Hosting domain: `your-project-id.web.app`
3. Also add `localhost` for local testing

---

### Step 7 — Deploy Firestore Rules

```bash
firebase login
firebase use --add   # select your project
firebase deploy --only firestore:rules
```

---

### Step 8 — Create Firestore Composite Index

The app queries visitors by `visitedAt` field. You may need to create an index:

1. Run the app and open the browser console
2. If you see a Firestore index error, it will include a link to auto-create the index
3. Click the link and create the index in the Firebase console

Or create it manually:
- Collection: `visitors`
- Fields: `visitedAt` (Ascending), then `visitedAt` (Descending)

---

### Step 9 — Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

Your app will be live at: `https://YOUR-PROJECT-ID.web.app`

**Update the Live Application link at the top of this README!**

---

### (Optional) Seed Sample Data

To test the admin dashboard with sample data, open your browser console on the app and run:

```js
// This seeds 30 sample visitor records into Firestore
// Only run once, from the browser console while authenticated as admin
import("./src/app.js")  // then use Firestore directly
```

Or use the Firebase console → Firestore → "visitors" collection to add documents manually.

**Sample document structure:**
```json
{
  "uid": "user_uid_here",
  "name": "Maria Santos",
  "email": "msantos@neu.edu.ph",
  "reason": "Study / Research",
  "college": "College of Engineering",
  "isEmployee": false,
  "visitedAt": <Timestamp>
}
```

---

## 👤 Account Roles

### Regular User (`jcesperanza@neu.edu.ph`)
- Signs in via Google
- Greeted with: **"Welcome to NEU Library!"**
- Sees their name, email, and current date/time

### Admin (`jcesperanza@neu.edu.ph`)
- Same account — uses the **role toggle** in the navbar (User ↔ Admin)
- Views visitor statistics dashboard
- Filters by: reason, college, employee status
- Switches between: Today / This Week / Custom Date Range

---

## 🔐 Security Model

```
Firestore Rules:
  visitors/{docId}
    CREATE  → any authenticated user (own uid only)
    READ    → admin emails only (jcesperanza@neu.edu.ph)
    UPDATE  → denied
    DELETE  → denied
```

Role switching is **client-side only** — the admin UI is gated by `ADMIN_EMAILS` in `firebase-config.js`. Firestore rules independently enforce that only admins can read visitor data, so even if someone inspects the code, the data remains protected.

---

## 📁 Project Structure

```
neu-library-visitor-log/
├── index.html              # App shell
├── firebase.json           # Firebase hosting + Firestore config
├── firestore.rules         # Firestore security rules
├── src/
│   ├── app.js              # Main application logic
│   ├── firebase-config.js  # 🔑 Your Firebase config goes here
│   └── styles.css          # All styles
└── README.md               # This file
```

---

## 📸 Screenshots

| Login | Welcome (User) | Admin Dashboard |
|---|---|---|
| Google Sign-in | Personalized greeting | Stats with filters |

---

## 📝 License

For academic use — Nueva Ecija University of Science and Technology.
