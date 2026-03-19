# 📚 NEU Library Visitor Log

> A secure, role-based library visitor tracking web application for **New Era University**.

## 🔗 Live Application

https://renmatthewflores.github.io/neu-library-visitor-log/

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

