/**
 * ============================================================================
 * RK VIDEO - Firebase Configuration & Initialization
 * ============================================================================
 * 
 * Instructions:
 * 1. Go to Firebase Console: https://console.firebase.google.com
 * 2. Select or create your project.
 * 3. Create a "Realtime Database" and choose a region.
 * 4. Go to Project Settings -> General -> "Your apps" -> Add Web App (</>).
 * 5. Replace the placeholder values below with your actual Firebase config.
 */

// ============================================================================
// ⚠️ PASTE YOUR FIREBASE CONFIGURATION HERE ⚠️
// ============================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
// ============================================================================

// Check if user has entered real Firebase credentials
function isConfigured(config) {
  return config && 
    config.apiKey && 
    config.apiKey !== "YOUR_API_KEY" && 
    config.databaseURL && 
    config.databaseURL !== "YOUR_DATABASE_URL";
}

// Initial seed data: ALL DEMO VIDEOS, POSTS, AND OLD HARDCODED CATEGORIES DELETED
const INITIAL_DEMO_VIDEOS = [];
const INITIAL_DEMO_POSTS = [];
const INITIAL_CATEGORIES = [];

const INITIAL_SITE_SETTINGS = {
  siteName: "RK VIDEO",
  primaryColor: "#ff4500",
  liveBadgeText: "LIVE 4K",
  adsterraBannerTop: "",
  adsterraBannerBottom: "",
  adsterraPopunder: "",
  adsterraSocialBar: "",
  adsterraSmartlink: "",
  adsterraSmartlinkText: "⚡ হাই স্পিড ডাউনলোড / ফুল HD লিংক",
  adsterraSmartlinkPlayer: true,
  adsterraSmartlinkFloating: true,
  adsterraEnabled: true
};

// Safe Direct Video & Cloud Storage URL Formatter (Dropbox, Google Drive, Direct MP4/WebM)
function formatDirectVideoUrl(url) {
  if (!url || typeof url !== 'string') return url || '';
  let formatted = url.trim();

  // 1. Dropbox link formatting for direct MP4 stream
  if (formatted.includes('dropbox.com')) {
    if (formatted.includes('dl=0')) {
      formatted = formatted.replace('dl=0', 'raw=1');
    } else if (!formatted.includes('raw=1') && !formatted.includes('dl=1')) {
      formatted += (formatted.includes('?') ? '&' : '?') + 'raw=1';
    }
    formatted = formatted.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }

  // 2. Google Drive link formatting for direct stream/download
  if (formatted.includes('drive.google.com/file/d/')) {
    const match = formatted.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      formatted = `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  } else if (formatted.includes('drive.google.com/open?id=' || formatted.includes('drive.google.com/uc?id='))) {
    const match = formatted.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      formatted = `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  }

  return formatted;
}

// Backward compatibility alias
const formatDropboxUrl = formatDirectVideoUrl;

// IndexedDB Storage Engine for Direct Local / Uploaded Video Files
const RK_INDEXED_DB = {
  dbName: 'RK_VIDEO_DB',
  storeName: 'direct_videos',
  _db: null,

  async getDB() {
    if (this._db) return this._db;
    if (!window.indexedDB) return null;
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = (e) => {
        this._db = e.target.result;
        resolve(this._db);
      };
      request.onerror = () => resolve(null);
    });
  },

  async saveVideoBlob(id, fileOrBlob) {
    const db = await this.getDB();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.put(fileOrBlob, id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch (e) {
        console.warn("IndexedDB save error", e);
        resolve(false);
      }
    });
  },

  async getVideoBlob(id) {
    const db = await this.getDB();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  },

  async deleteVideoBlob(id) {
    const db = await this.getDB();
    if (!db) return;
    try {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).delete(id);
    } catch (e) {}
  }
};

// Global Firebase Wrapper with LocalStorage Fallback
let isFirebaseReady = false;
let dbInstance = null;
let authInstance = null;
let useLocalMode = false;

function initFirebase() {
  // Ensure old demo categories and caches are completely wiped clean
  try {
    if (localStorage.getItem('rk_clean_state_v6') !== 'true') {
      localStorage.setItem('rk_local_categories', '[]');
      localStorage.setItem('rk_clean_state_v6', 'true');
    }
  } catch (e) {
    console.warn("Storage wipe check error", e);
  }

  let runtimeConfig = { ...firebaseConfig };
  try {
    const savedConfig = localStorage.getItem('rk_firebase_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (isConfigured(parsed)) {
        runtimeConfig = parsed;
      }
    }
  } catch (e) {
    console.warn("Could not read localStorage config", e);
  }

  if (window.firebase && isConfigured(runtimeConfig)) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(runtimeConfig);
      }
      dbInstance = firebase.database();
      authInstance = firebase.auth();
      isFirebaseReady = true;
      useLocalMode = false;
      console.log("✅ Firebase Realtime Database connected successfully!");
      return { ready: true, isLocal: false, db: dbInstance, auth: authInstance };
    } catch (err) {
      console.error("Firebase initialization failed:", err);
    }
  }

  // Local fallback mode when Firebase credentials are not yet entered
  useLocalMode = true;
  isFirebaseReady = true;
  
  if (!localStorage.getItem('rk_local_videos')) {
    localStorage.setItem('rk_local_videos', JSON.stringify(INITIAL_DEMO_VIDEOS));
  }
  if (!localStorage.getItem('rk_local_categories')) {
    localStorage.setItem('rk_local_categories', JSON.stringify(INITIAL_CATEGORIES));
  }
  if (!localStorage.getItem('rk_local_settings')) {
    localStorage.setItem('rk_local_settings', JSON.stringify(INITIAL_SITE_SETTINGS));
  }

  return { ready: true, isLocal: true };
}

// Export functions to window
window.RK_INDEXED_DB = RK_INDEXED_DB;

window.RK_FIREBASE = {
  config: firebaseConfig,
  isConfigured,
  initFirebase,
  formatDropboxUrl,
  formatDirectVideoUrl,
  indexedDB: RK_INDEXED_DB,
  INITIAL_DEMO_VIDEOS,
  INITIAL_DEMO_POSTS,
  INITIAL_CATEGORIES,
  INITIAL_SITE_SETTINGS,
  getDb: () => dbInstance,
  getAuth: () => authInstance,
  isLocal: () => useLocalMode
};
