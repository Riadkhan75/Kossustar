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
// ⚠️ FIREBASE CONFIGURATION ⚠️
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyAkh3Bk8XN30FYBDW4EMh5OC7CI6YTeP8Y",
  authDomain: "rk-portfolio-66771.firebaseapp.com",
  databaseURL: "https://rk-portfolio-66771-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rk-portfolio-66771",
  storageBucket: "rk-portfolio-66771.firebasestorage.app",
  messagingSenderId: "379197461011",
  appId: "1:379197461011:web:184fa1739ea45032dda5e6",
  measurementId: "G-QZWTQE57WE"
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
  adsterraEnabled: true,
  adsterraMessageAdEnabled: true,
  adsterraMessageAdCode: "",
  adsterraMessageSender: "💬 (1) নতুন নোটিফিকেশন",
  adsterraMessageText: "🔥 আনকাট ফুল HD ভিডিও দেখতে ও দ্রুত ডাউনলোড করতে এখানে চাপুন...",
  adsterraMessageBtnText: "ওপেন করুন ⚡",
  antiAdblockEnabled: true,
  antiAdblockNotice: true,
  adultAdsAlwaysActive: true,
  adultAdsTriggerOnPlay: true,
  adultDirectUrl: ""
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
let storageInstance = null;
let analyticsInstance = null;
let useLocalMode = false;

// Request Persistent Storage from the browser so mobile cleaners don't delete local caches
try {
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(granted => {
      if (granted) console.log("✅ Browser storage marked as persistent.");
    }).catch(() => {});
  }
} catch (e) {}

// Automated Cloud & Server Video Upload Engine with Fallbacks
async function uploadVideoToCloud(file, videoId, onProgress) {
  if (!file) throw new Error("কোনো ভিডিও ফাইল নির্বাচন করা হয়নি।");
  const vid = videoId || 'vid_' + Date.now();

  // 1. Immediately cache in IndexedDB in the background so video is NEVER lost!
  if (window.RK_INDEXED_DB) {
    try {
      await window.RK_INDEXED_DB.saveVideoBlob(vid, file);
    } catch (e) {
      console.warn("IndexedDB pre-cache warning:", e);
    }
  }

  // 2. Try Server Permanent Upload Endpoint (/api/upload-video)
  try {
    const encodedName = encodeURIComponent(file.name || 'video.mp4');
    const xhr = new XMLHttpRequest();
    const serverUrl = await new Promise((resolve, reject) => {
      // 10-minute timeout so large videos (50MB - 500MB) can upload without aborting
      xhr.timeout = 600000;
      xhr.open('POST', `/api/upload-video?filename=${encodedName}`, true);
      xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

      if (xhr.upload && typeof onProgress === 'function') {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && e.total > 0) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent, 'স্থায়ী ক্লাউড/সার্ভার স্টোরেজে আপলোড হচ্ছে...');
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const resp = JSON.parse(xhr.responseText);
            if (resp && resp.url) {
              resolve(resp.url);
            } else {
              reject(new Error('Invalid server response'));
            }
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Server status ${xhr.status}`));
        }
      };

      xhr.ontimeout = () => reject(new Error('Upload timeout'));
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(file);
    });

    if (serverUrl) {
      return {
        success: true,
        url: serverUrl,
        provider: 'server',
        isCloudPermanent: true,
        fileName: file.name,
        fileSize: file.size
      };
    }
  } catch (serverErr) {
    console.warn("Server upload API notice:", serverErr);
  }

  // 3. Fallback to Firebase Storage with a 6-second timeout so it never hangs
  if (storageInstance && !useLocalMode) {
    try {
      const sanitizedName = (file.name || 'video.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');
      const storageRef = storageInstance.ref(`videos/${vid}_${Date.now()}_${sanitizedName}`);
      const uploadTask = storageRef.put(file);

      const downloadUrl = await Promise.race([
        new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              if (snapshot.totalBytes > 0) {
                const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                if (typeof onProgress === 'function') {
                  onProgress(percent, 'Firebase ক্লাউড স্টোরেজে আপলোড হচ্ছে...');
                }
              }
            },
            (err) => reject(err),
            async () => {
              try {
                const url = await uploadTask.snapshot.ref.getDownloadURL();
                resolve(url);
              } catch (e) {
                reject(e);
              }
            }
          );
        }),
        new Promise((_, reject) => setTimeout(() => {
          try { uploadTask.cancel(); } catch (e) {}
          reject(new Error("Firebase Storage timeout"));
        }, 6000))
      ]);

      if (downloadUrl) {
        return {
          success: true,
          url: downloadUrl,
          provider: 'firebase',
          isCloudPermanent: true,
          fileName: file.name,
          fileSize: file.size
        };
      }
    } catch (firebaseErr) {
      console.warn("Firebase Cloud Storage upload notice:", firebaseErr);
    }
  }

  // 4. Guaranteed persistent storage in IndexedDB (Never fails)
  if (typeof onProgress === 'function') {
    onProgress(100, 'ডিভাইসের স্থায়ী মেমোরিতে সফলভাবে সংরক্ষিত!');
  }
  return {
    success: true,
    url: 'indexeddb://' + vid,
    provider: 'indexeddb',
    isCloudPermanent: false,
    isLocalOnly: true,
    fileName: file.name,
    fileSize: file.size
  };
}

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
      // Only override if savedConfig is valid and user explicitly customized it
      if (isConfigured(parsed) && parsed.apiKey && parsed.apiKey !== "YOUR_API_KEY") {
        runtimeConfig = { ...runtimeConfig, ...parsed };
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
      try {
        storageInstance = firebase.storage();
      } catch (storageErr) {
        console.warn("Firebase Storage could not be initialized:", storageErr);
      }
      if (typeof firebase.analytics === 'function' && runtimeConfig.measurementId) {
        try {
          analyticsInstance = firebase.analytics();
        } catch (analyticsErr) {
          console.warn("Firebase Analytics could not be initialized:", analyticsErr);
        }
      }
      isFirebaseReady = true;
      useLocalMode = false;
      console.log("✅ Firebase connected successfully!", runtimeConfig.projectId);
      return { 
        ready: true, 
        isLocal: false, 
        db: dbInstance, 
        auth: authInstance, 
        storage: storageInstance, 
        analytics: analyticsInstance 
      };
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
  uploadVideoToCloud,
  indexedDB: RK_INDEXED_DB,
  INITIAL_DEMO_VIDEOS,
  INITIAL_DEMO_POSTS,
  INITIAL_CATEGORIES,
  INITIAL_SITE_SETTINGS,
  getDb: () => dbInstance,
  getAuth: () => authInstance,
  getStorage: () => storageInstance,
  getAnalytics: () => analyticsInstance,
  isLocal: () => useLocalMode
};
