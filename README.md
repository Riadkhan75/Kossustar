# RK VIDEO - Professional Mobile-First Video Streaming Platform

RK VIDEO is a production-ready, mobile-first video streaming web application built with HTML5, CSS3, JavaScript (ES6+), and **Firebase Realtime Database**.

---

## 🌟 Key Updates & Features

- **🎥 Direct Video Add (সরাসরি ভিডিও অ্যাড) & No Thumbnail Required:**
  - **সরাসরি ফাইল আপলোড (Direct Video Upload):** সরাসরি আপনার মোবাইল বা কম্পিউটার থেকে ভিডিও ফাইল (.mp4, .webm, ইত্যাদি) ড্র্যাগ করে বা ফাইল সিলেক্ট করে আপলোড করার সুবিধা।
  - **সরাসরি ভিডিও লিংক (Direct Video URL):** যেকোনো ডিরেক্ট MP4, Dropbox, Google Drive সরাসরি স্ট্রিমিং লিংক ইনপুট দেওয়ার ব্যবস্থা।
  - **স্বয়ংক্রিয় সময়কাল (Auto-detected Duration):** ভিডিও লোড হওয়ামাত্র স্বয়ংক্রিয়ভাবে সময়কাল (যেমন: 04:20) ডিটেক্ট হয়।
  - **থাম্বনেইল অপশন অপসারণ (No Thumbnail Needed):** থাম্বনেইল দেওয়ার কোনো ঝামেলা নেই; ভিডিওর ফ্রেম থেকেই স্বয়ংক্রিয়ভাবে হাই-কোয়ালিটি থাম্বনেইল ক্যাপচার হয়।
- **🔒 Admin Entrance & Confidential Password:**
  - **Menu Access:** Conveniently available inside the site navigation Menu (accessible via the Navbar Menu button ☰ or Mobile Bottom Nav "মেনু" button) without needing to manually type the URL path in the address bar.
  - **Direct Path:** Also accessible via `/adminriad` and `/admin.html`.
  - **Hidden Password:** The password is kept completely hidden (masked with dots) on the login screen with an eye toggle button. The password is **`205090`**.
- **🏷️ Dynamic Category Management:**
  - All old hardcoded categories have been deleted.
  - Dedicated **"ক্যাটাগরি ব্যবস্থাপনা (Category Management)"** tab in the Admin Panel.
  - Admin can add any custom categories (e.g., নাটক, গান, বিনোদন, মুভি, ইত্যাদি).
  - Admin-created categories appear in real-time on the homepage as filter chips and inside the video upload form.
- **⚡ Instant Real-Time Website Name Change:**
  - Admin can change the website name at any time from **"সাইট সেটিংস (Site Settings)"**.
  - Changing the name immediately updates the site title `<title>`, top navbar logo branding (`#siteBrandName`), and footer copyright.
- **📱 Mobile-First Pure Video Feed:**
  - 2-column compact grid on mobile, 3 on tablet, 4 on desktop (max width 1100px).
  - Clean, fresh homepage displaying **only videos** with zero clutter.
- **💰 Adsterra Ads Integration:**
  - Dedicated Adsterra tab in Admin Panel.
  - Top Banner Ad Slot (728x90, 320x50, Native).
  - Bottom Banner Ad Slot (728x90, 300x250, Native).
  - Popunder Script & Social Bar Script integration.
  - One-click Enable/Disable master switch.
- **🎬 Fullscreen / Modal Video Player:**
  - Standard HTML5 `<video controls playsinline>`.
  - MP4 and direct streaming support with automatic Dropbox raw link formatter.
  - Real-time incrementing views counter via Firebase transactions.
  - Interactive Like button with instant local feedback and Firebase sync.
  - Copy video link & share feature with toast notifications.
- **🎨 Premium Light & Dark Themes:** Smooth light theme (`#f3f4f6` bg, `#ffffff` cards, `#ff4500` accent) with full Dark Mode toggle.

---

## 📁 File Structure

```text
├── index.html          # Public pure video streaming platform frontend (no admin links)
├── admin.html          # Secret admin control panel (/adminriad)
├── style.css           # Global responsive styles, light/dark themes, Poppins & Hind Siliguri fonts
├── app.js              # Public site engine, video player, dynamic categories, dynamic site name
├── admin.js            # Admin dashboard logic, category management, video CRUD, settings
├── firebase-config.js  # Firebase configuration and initialization module
├── vercel.json         # Vercel deployment configuration & /adminriad routing rewrite
└── README.md           # Setup and deployment documentation
```

---

## 🔑 Secret Admin Login

- Secret URL: `/adminriad`
- **Password:** `205090` (Keep this confidential; it is hidden from the login screen)

---

## 🚀 Vercel.com Deployment & Login Guide (100% Ready)

This project is fully configured and ready for **1-click deployment on Vercel**:

1. **Push or Import to Vercel:**
   - Link your GitHub repository in [vercel.com](https://vercel.com).
   - Framework Preset: **Vite** (detected automatically).
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Click **Deploy**!

2. **Accessing Admin Panel on Vercel:**
   - You can access the Admin Panel directly from the site navigation **Menu** (☰ button in the top navbar or "মেনু" in the bottom bar).
   - Or directly visit: `https://your-project.vercel.app/adminriad` or `/admin.html`.
   - Enter your password: **`205090`**.
   - Click **"লগইন করুন"** — the dashboard opens instantly!

3. **Connecting Firebase on Vercel (No Code Edit Needed):**
   - You can connect your Firebase Realtime Database right from the Admin Panel:
   - Go to Admin Panel -> **"ফায়ারবেস রুলস"** tab.
   - Paste your Firebase Web App configuration JSON into the text box.
   - Click **"ফায়ারবেস সেভ ও কানেক্ট করুন"**.
   - Your site will instantly connect to Firebase live!
   - (Or you can paste your credentials directly into `firebase-config.js` before deploying).

---

## 🏷️ How to Manage Categories

1. Log into `/adminriad` with password `205090`.
2. Click on the **"ক্যাটাগরি ব্যবস্থাপনা (Category Management)"** tab.
3. Type the category name in the input box (e.g. `নাটক`, `কমেডি`, `মিউজিক`).
4. Click **"+ ক্যাটাগরি যুক্ত করুন"**.
5. The category will instantly be available for video uploads and will appear on the homepage as a filter chip!
