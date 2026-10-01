/**
 * ============================================================================
 * RK VIDEO - Admin Control Panel Engine
 * Password (205090), Dynamic Categories, Dynamic Site Name, Adsterra Ads
 * ============================================================================
 */

(function () {
  'use strict';

  const MASTER_PASSWORD = '205090';

  let isLocalMode = false;
  let db = null;
  let adminVideos = [];
  let adminCategories = [];
  let adminSettings = {};

  // DOM Elements
  const adminLoginSection = document.getElementById('adminLoginSection');
  const adminDashboardSection = document.getElementById('adminDashboardSection');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminPassword = document.getElementById('adminPassword');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  const adminToastContainer = document.getElementById('adminToastContainer');
  const adminHeaderBrand = document.getElementById('adminHeaderBrand');

  // Firebase Sync & Warning Elements
  const firebasePermissionWarning = document.getElementById('firebasePermissionWarning');
  const syncLocalDataBanner = document.getElementById('syncLocalDataBanner');
  const syncLocalCount = document.getElementById('syncLocalCount');
  const syncToFirebaseBtn = document.getElementById('syncToFirebaseBtn');

  // KPI Elements
  const kpiTotalVideos = document.getElementById('kpiTotalVideos');
  const kpiActiveVideos = document.getElementById('kpiActiveVideos');
  const kpiTotalCategories = document.getElementById('kpiTotalCategories');
  const kpiTotalViews = document.getElementById('kpiTotalViews');
  const clearAllVideosBtn = document.getElementById('clearAllVideosBtn');

  // Lists
  const adminVideosList = document.getElementById('adminVideosList');
  const adminCategoriesList = document.getElementById('adminCategoriesList');
  const addCategoryForm = document.getElementById('addCategoryForm');
  const newCategoryInput = document.getElementById('newCategoryInput');

  // Video Modal & Form
  const videoModalBackdrop = document.getElementById('videoModalBackdrop');
  const videoModalHeading = document.getElementById('videoModalHeading');
  const videoForm = document.getElementById('videoForm');
  const formVideoId = document.getElementById('formVideoId');
  const formVideoTitle = document.getElementById('formVideoTitle');
  const formVideoUrl = document.getElementById('formVideoUrl');
  const formCategory = document.getElementById('formCategory');
  const formCustomCategory = document.getElementById('formCustomCategory');
  const formDuration = document.getElementById('formDuration');
  const formVideoActive = document.getElementById('formVideoActive');
  const addNewVideoBtn = document.getElementById('addNewVideoBtn');
  const closeVideoModalBtn = document.getElementById('closeVideoModalBtn');
  const cancelVideoModalBtn = document.getElementById('cancelVideoModalBtn');
  const saveVideoBtn = document.getElementById('saveVideoBtn');

  // Direct Video Source Elements
  const sourceTabUrl = document.getElementById('sourceTabUrl');
  const sourceTabFile = document.getElementById('sourceTabFile');
  const urlSourceSection = document.getElementById('urlSourceSection');
  const fileSourceSection = document.getElementById('fileSourceSection');
  const formVideoFileInput = document.getElementById('formVideoFileInput');
  const videoDropZone = document.getElementById('videoDropZone');
  const dropZonePrompt = document.getElementById('dropZonePrompt');
  const selectedFileInfo = document.getElementById('selectedFileInfo');
  const selectedFileName = document.getElementById('selectedFileName');
  const selectedFileSize = document.getElementById('selectedFileSize');
  const removeFileBtn = document.getElementById('removeFileBtn');
  const previewContainer = document.getElementById('previewContainer');
  const modalVideoPreview = document.getElementById('modalVideoPreview');
  const singleFileProgressContainer = document.getElementById('singleFileProgressContainer');
  const singleFileProgressStatus = document.getElementById('singleFileProgressStatus');
  const singleFileProgressPercent = document.getElementById('singleFileProgressPercent');
  const singleFileProgressFill = document.getElementById('singleFileProgressFill');

  let activeVideoSourceMode = 'url'; // 'url' | 'file'
  let currentSelectedFile = null;
  let currentFileBlobUrl = null;
  let currentCapturedThumb = '';
  let existingVideoThumb = '';

  // Bulk / Multiple Videos DOM Elements
  const addMultipleVideosBtn = document.getElementById('addMultipleVideosBtn');
  const switchToBulkModalBtn = document.getElementById('switchToBulkModalBtn');
  const bulkVideoModalBackdrop = document.getElementById('bulkVideoModalBackdrop');
  const closeBulkVideoModalBtn = document.getElementById('closeBulkVideoModalBtn');
  const bulkTabFiles = document.getElementById('bulkTabFiles');
  const bulkTabUrls = document.getElementById('bulkTabUrls');
  const bulkFilesSection = document.getElementById('bulkFilesSection');
  const bulkUrlsSection = document.getElementById('bulkUrlsSection');

  // Bulk Mode 1 (Files) Elements
  const bulkFilesCategory = document.getElementById('bulkFilesCategory');
  const bulkFilesCustomCategory = document.getElementById('bulkFilesCustomCategory');
  const bulkVideoDropZone = document.getElementById('bulkVideoDropZone');
  const bulkVideoFilesInput = document.getElementById('bulkVideoFilesInput');
  const bulkQueueContainer = document.getElementById('bulkQueueContainer');
  const bulkQueueCount = document.getElementById('bulkQueueCount');
  const bulkClearQueueBtn = document.getElementById('bulkClearQueueBtn');
  const bulkQueueList = document.getElementById('bulkQueueList');
  const bulkFilesProgressContainer = document.getElementById('bulkFilesProgressContainer');
  const bulkFilesProgressStatus = document.getElementById('bulkFilesProgressStatus');
  const bulkFilesProgressPercent = document.getElementById('bulkFilesProgressPercent');
  const bulkFilesProgressFill = document.getElementById('bulkFilesProgressFill');
  const cancelBulkFilesBtn = document.getElementById('cancelBulkFilesBtn');
  const saveBulkFilesBtn = document.getElementById('saveBulkFilesBtn');
  const saveBulkFilesCount = document.getElementById('saveBulkFilesCount');

  // Bulk Mode 2 (URLs) Elements
  const bulkUrlsCategory = document.getElementById('bulkUrlsCategory');
  const bulkUrlsCustomCategory = document.getElementById('bulkUrlsCustomCategory');
  const bulkUrlsSampleBtn = document.getElementById('bulkUrlsSampleBtn');
  const bulkUrlsTextarea = document.getElementById('bulkUrlsTextarea');
  const bulkUrlsCountBadge = document.getElementById('bulkUrlsCountBadge');
  const bulkUrlsProgressContainer = document.getElementById('bulkUrlsProgressContainer');
  const bulkUrlsProgressStatus = document.getElementById('bulkUrlsProgressStatus');
  const bulkUrlsProgressPercent = document.getElementById('bulkUrlsProgressPercent');
  const bulkUrlsProgressFill = document.getElementById('bulkUrlsProgressFill');
  const cancelBulkUrlsBtn = document.getElementById('cancelBulkUrlsBtn');
  const saveBulkUrlsBtn = document.getElementById('saveBulkUrlsBtn');

  let activeBulkTab = 'files'; // 'files' | 'urls'
  let bulkQueueFiles = []; // Array of { id, file, title, duration, thumbUrl }
  let isBulkProcessing = false;

  // Adsterra Ads Elements
  const adsterraForm = document.getElementById('adsterraForm');
  const adsterraEnabledSwitch = document.getElementById('adsterraEnabledSwitch');
  const adsterraBannerTop = document.getElementById('adsterraBannerTop');
  const adsterraBannerBottom = document.getElementById('adsterraBannerBottom');
  const adsterraPopunder = document.getElementById('adsterraPopunder');
  const adsterraSocialBar = document.getElementById('adsterraSocialBar');
  const adsterraSmartlink = document.getElementById('adsterraSmartlink');
  const adsterraSmartlinkText = document.getElementById('adsterraSmartlinkText');
  const adsterraSmartlinkPlayer = document.getElementById('adsterraSmartlinkPlayer');
  const adsterraSmartlinkFloating = document.getElementById('adsterraSmartlinkFloating');
  const adsterraMessageAdEnabled = document.getElementById('adsterraMessageAdEnabled');
  const adsterraMessageAdCode = document.getElementById('adsterraMessageAdCode');
  const adsterraMessageSender = document.getElementById('adsterraMessageSender');
  const adsterraMessageText = document.getElementById('adsterraMessageText');
  const adsterraMessageBtnText = document.getElementById('adsterraMessageBtnText');

  // Confirmation Modals Elements
  const confirmDeleteModalBackdrop = document.getElementById('confirmDeleteModalBackdrop');
  const confirmDeleteVideoTitle = document.getElementById('confirmDeleteVideoTitle');
  const confirmDeleteVideoBtn = document.getElementById('confirmDeleteVideoBtn');
  const cancelDeleteVideoBtn = document.getElementById('cancelDeleteVideoBtn');
  let videoToDeleteId = null;

  const confirmClearAllModalBackdrop = document.getElementById('confirmClearAllModalBackdrop');
  const confirmClearAllBtn = document.getElementById('confirmClearAllBtn');
  const cancelClearAllBtn = document.getElementById('cancelClearAllBtn');

  const confirmDeleteCatModalBackdrop = document.getElementById('confirmDeleteCatModalBackdrop');
  const confirmDeleteCatName = document.getElementById('confirmDeleteCatName');
  const confirmDeleteCatBtn = document.getElementById('confirmDeleteCatBtn');
  const cancelDeleteCatBtn = document.getElementById('cancelDeleteCatBtn');
  let catToDeleteId = null;

  // Site Settings Elements
  const siteSettingsForm = document.getElementById('siteSettingsForm');
  const settingSiteName = document.getElementById('settingSiteName');
  const settingLiveBadgeText = document.getElementById('settingLiveBadgeText');
  const settingPrimaryColor = document.getElementById('settingPrimaryColor');
  const settingPrimaryColorPicker = document.getElementById('settingPrimaryColorPicker');

  // Toast Function
  function showToast(message, duration = 3000) {
    if (!adminToastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${message}</span>
    `;
    adminToastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'opacity 0.25s, transform 0.25s';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  // Setup Admin Tabs
  function setupTabs() {
    const tabs = document.querySelectorAll('.admin-tab-btn');
    const panes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab');
        tabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.style.display = 'none');

        tab.classList.add('active');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.style.display = 'block';
      });
    });
  }

  // Setup Password Authentication (Hidden Password: 205090)
  function initAuth() {
    const fbResult = window.RK_FIREBASE.initFirebase();
    isLocalMode = fbResult.isLocal;
    db = fbResult.db;

    const isAuthenticated = sessionStorage.getItem('rk_admin_auth') === 'true' || localStorage.getItem('rk_admin_auth') === 'true';

    if (isAuthenticated) {
      showDashboard();
      loadData();
    } else {
      showLogin();
    }

    if (adminLoginForm) {
      adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredPassword = (adminPassword.value || '').trim();

        if (enteredPassword === MASTER_PASSWORD) {
          sessionStorage.setItem('rk_admin_auth', 'true');
          localStorage.setItem('rk_admin_auth', 'true');
          showToast("স্বাগতম! অ্যাডমিন প্যানেলে সফলভাবে প্রবেশ করেছেন।");
          showDashboard();
          loadData();
        } else {
          showToast("ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন।");
          adminPassword.value = '';
          adminPassword.focus();
        }
      });
    }

    // Password visibility toggle
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const eyeIconOpen = document.getElementById('eyeIconOpen');
    const eyeIconClosed = document.getElementById('eyeIconClosed');

    if (togglePasswordBtn && adminPassword) {
      togglePasswordBtn.addEventListener('click', () => {
        const isPassword = adminPassword.getAttribute('type') === 'password';
        if (isPassword) {
          adminPassword.setAttribute('type', 'text');
          if (eyeIconOpen) eyeIconOpen.style.display = 'none';
          if (eyeIconClosed) eyeIconClosed.style.display = 'block';
        } else {
          adminPassword.setAttribute('type', 'password');
          if (eyeIconOpen) eyeIconOpen.style.display = 'block';
          if (eyeIconClosed) eyeIconClosed.style.display = 'none';
        }
      });
    }

    if (adminLogoutBtn) {
      adminLogoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('rk_admin_auth');
        localStorage.removeItem('rk_admin_auth');
        showToast("লগআউট সম্পন্ন হয়েছে");
        showLogin();
      });
    }
  }

  function showLogin() {
    if (adminLoginSection) adminLoginSection.style.display = 'flex';
    if (adminDashboardSection) adminDashboardSection.style.display = 'none';
    if (adminLogoutBtn) adminLogoutBtn.style.display = 'none';
    if (adminPassword) {
      adminPassword.value = '';
      adminPassword.focus();
    }
  }

  function showDashboard() {
    if (adminLoginSection) adminLoginSection.style.display = 'none';
    if (adminDashboardSection) adminDashboardSection.style.display = 'block';
    if (adminLogoutBtn) adminLogoutBtn.style.display = 'inline-block';
  }

  // Check if there are local videos waiting to be synced to Firebase
  function checkSyncLocalDataBanner() {
    try {
      const stored = localStorage.getItem('rk_local_videos');
      const localVideos = stored ? JSON.parse(stored) : [];
      if (localVideos.length > 0 && adminVideos.length === 0 && syncLocalDataBanner) {
        if (syncLocalCount) syncLocalCount.textContent = localVideos.length.toString();
        syncLocalDataBanner.style.display = 'block';
      } else if (syncLocalDataBanner) {
        syncLocalDataBanner.style.display = 'none';
      }
    } catch(e) {}
  }

  async function syncLocalDataToFirebase() {
    if (!db) {
      showToast("Firebase ডাটাবেস সক্রিয় নেই!");
      return;
    }
    if (syncToFirebaseBtn) {
      syncToFirebaseBtn.disabled = true;
      syncToFirebaseBtn.textContent = "সিঙ্ক হচ্ছে...";
    }

    try {
      const vRaw = localStorage.getItem('rk_local_videos');
      const localVideos = vRaw ? JSON.parse(vRaw) : [];
      const cRaw = localStorage.getItem('rk_local_categories');
      const localCategories = cRaw ? JSON.parse(cRaw) : [];
      const sRaw = localStorage.getItem('rk_local_settings');
      const localSettings = sRaw ? JSON.parse(sRaw) : null;

      // 1. Sync videos to Firebase Realtime Database
      for (const v of localVideos) {
        if (v && v.videoId) {
          await db.ref(`videos/${v.videoId}`).set(v);
        }
      }

      // 2. Sync categories to Firebase
      for (const c of localCategories) {
        if (c && c.id) {
          await db.ref(`categories/${c.id}`).set(c);
        }
      }

      // 3. Sync settings to Firebase
      if (localSettings) {
        await db.ref('settings').update(localSettings);
      }

      showToast("🎉 চমৎকার! সব ভিডিও ও সেটিংস সফলভাবে Firebase-এ সিঙ্ক হয়েছে!");
      if (syncLocalDataBanner) syncLocalDataBanner.style.display = 'none';
    } catch(err) {
      console.error("Sync error:", err);
      if (err.message && err.message.includes('permission_denied')) {
        if (firebasePermissionWarning) firebasePermissionWarning.style.display = 'block';
        showToast("⚠️ Firebase পারমিশন ত্রুটি! Firebase Console থেকে Rules সেট করুন।");
      } else {
        showToast("সিঙ্ক ত্রুটি: " + err.message);
      }
    } finally {
      if (syncToFirebaseBtn) {
        syncToFirebaseBtn.disabled = false;
        syncToFirebaseBtn.textContent = "🚀 Firebase-এ সিঙ্ক করুন";
      }
    }
  }

  if (syncToFirebaseBtn) {
    syncToFirebaseBtn.addEventListener('click', syncLocalDataToFirebase);
  }

  // Load Data
  function loadData() {
    if (!isLocalMode && db) {
      // 1. Listen for Videos
      db.ref('videos').on('value', snapshot => {
        if (firebasePermissionWarning) firebasePermissionWarning.style.display = 'none';
        const val = snapshot.val();
        adminVideos = val ? Object.keys(val).map(k => ({ ...val[k], videoId: val[k].videoId || k })) : [];
        renderAdminVideos();
        updateKpis();
        checkSyncLocalDataBanner();
      }, err => {
        console.error("Firebase videos fetch error:", err);
        if (err.code === 'PERMISSION_DENIED' || (err.message && err.message.includes('permission_denied'))) {
          if (firebasePermissionWarning) firebasePermissionWarning.style.display = 'block';
        }
        loadLocalData();
      });

      // 2. Listen for Categories (Sorted newest first so new category shows at top)
      db.ref('categories').on('value', snapshot => {
        const val = snapshot.val();
        adminCategories = val ? Object.keys(val).map(k => ({ ...val[k], id: val[k].id || k })) : [];
        adminCategories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        renderAdminCategories();
        populateCategoryDropdown();
        updateKpis();
      }, err => {
        console.error("Firebase categories fetch error:", err);
      });

      // 3. Listen for Settings
      db.ref('settings').on('value', snapshot => {
        adminSettings = snapshot.val() || window.RK_FIREBASE.INITIAL_SITE_SETTINGS;
        populateSettings(adminSettings);
      }, err => {
        console.error("Firebase settings fetch error:", err);
      });

      updateFirebaseBadge();
    } else {
      loadLocalData();
    }
  }

  function loadLocalData() {
    try {
      const v = localStorage.getItem('rk_local_videos');
      adminVideos = v ? JSON.parse(v) : [];
      const c = localStorage.getItem('rk_local_categories');
      adminCategories = c ? JSON.parse(c) : [];
      adminCategories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      const s = localStorage.getItem('rk_local_settings');
      adminSettings = s ? JSON.parse(s) : window.RK_FIREBASE.INITIAL_SITE_SETTINGS;
    } catch (e) {
      adminVideos = [];
      adminCategories = [];
      adminSettings = window.RK_FIREBASE.INITIAL_SITE_SETTINGS;
    }
    renderAdminVideos();
    renderAdminCategories();
    populateCategoryDropdown();
    populateSettings(adminSettings);
    updateKpis();
    updateFirebaseBadge();
  }

  // Update KPIs
  function updateKpis() {
    const totalVids = adminVideos.length;
    const activeVids = adminVideos.filter(v => v.active !== false).length;
    const totalCats = adminCategories.length;
    const totalV = adminVideos.reduce((acc, v) => acc + (Number(v.views) || 0), 0);

    if (kpiTotalVideos) kpiTotalVideos.textContent = totalVids;
    if (kpiActiveVideos) kpiActiveVideos.textContent = activeVids;
    if (kpiTotalCategories) kpiTotalCategories.textContent = totalCats;
    if (kpiTotalViews) kpiTotalViews.textContent = totalV.toLocaleString();
  }

  // Clear All Videos
  if (clearAllVideosBtn) {
    clearAllVideosBtn.addEventListener('click', (e) => {
      e.preventDefault();
      promptClearAllVideos();
    });
  }

  if (confirmClearAllBtn) {
    confirmClearAllBtn.addEventListener('click', () => {
      executeClearAllVideos();
    });
  }

  if (cancelClearAllBtn) {
    cancelClearAllBtn.addEventListener('click', () => {
      closeClearAllModal();
    });
  }

  function promptClearAllVideos() {
    if (confirmClearAllModalBackdrop) {
      confirmClearAllModalBackdrop.classList.add('open');
    } else {
      executeClearAllVideos();
    }
  }

  function closeClearAllModal() {
    if (confirmClearAllModalBackdrop) {
      confirmClearAllModalBackdrop.classList.remove('open');
    }
  }

  async function executeClearAllVideos() {
    closeClearAllModal();

    if (window.RK_INDEXED_DB) {
      try {
        for (const v of adminVideos) {
          const id = v.videoId || v.id;
          if (id) await window.RK_INDEXED_DB.deleteVideoBlob(id);
        }
      } catch (e) {}
    }

    adminVideos = [];
    try {
      localStorage.setItem('rk_local_videos', '[]');
      localStorage.setItem('rk_last_updated', Date.now().toString());
    } catch (e) {}

    renderAdminVideos();
    updateKpis();

    if (db) {
      db.ref('videos').set({}).catch(err => console.warn("Firebase clear videos notice:", err));
    }

    try {
      window.dispatchEvent(new CustomEvent('rk_videos_updated', { detail: { action: 'clearAll' } }));
    } catch (e) {}

    showToast("সকল ভিডিও সফলভাবে মুছে ডাটাবেস খালি করা হয়েছে!");
  }

  // ==========================================
  // CATEGORIES MANAGEMENT
  // ==========================================
  function renderAdminCategories() {
    if (!adminCategoriesList) return;

    if (adminCategories.length === 0) {
      adminCategoriesList.innerHTML = `
        <div style="text-align: center; padding: 24px 16px; color: var(--color-text-muted); background: var(--color-subtle-bg); border-radius: var(--radius-md); border: 1px dashed var(--color-border);">
          কোনো ক্যাটাগরি তৈরি করা হয়নি। উপরের ফর্মে নাম লিখে <strong>"+ ক্যাটাগরি যুক্ত করুন"</strong> বাটনে চাপ দিন।
        </div>
      `;
      return;
    }

    // Always sort newest category at the top
    adminCategories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    adminCategoriesList.innerHTML = adminCategories.map(cat => {
      return `
        <div class="item-row" data-id="${cat.id}">
          <div class="item-row-left">
            <span style="font-size: 1.1rem;">🏷️</span>
            <div>
              <div class="item-title-text" style="font-size: 1rem;">${escapeHtml(cat.name)}</div>
            </div>
          </div>
          <div class="item-actions">
            <button class="btn-danger delete-cat-btn" title="ক্যাটাগরি মুছুন">
              🗑 মুছুন
            </button>
          </div>
        </div>
      `;
    }).join('');

    adminCategoriesList.querySelectorAll('.delete-cat-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const row = e.target.closest('.item-row');
        const catId = row.getAttribute('data-id');
        promptDeleteCategory(catId);
      });
    });
  }

  // Add Category (Always adds at the top)
  if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (newCategoryInput.value || '').trim();
      if (!name) return;

      const exists = adminCategories.some(c => (c.name || '').toLowerCase() === name.toLowerCase());
      if (exists) {
        showToast("এই ক্যাটাগরিটি ইতোমধ্যে রয়েছে!");
        return;
      }

      const catId = 'cat_' + Date.now();
      const newCat = { id: catId, name: name, createdAt: Date.now() };

      if (!isLocalMode && db) {
        db.ref(`categories/${catId}`).set(newCat)
          .then(() => {
            showToast("ক্যাটাগরি সফলভাবে যুক্ত হয়েছে এবং সবার উপরে দেখাচ্ছে!");
            newCategoryInput.value = '';
          })
          .catch(err => showToast("ত্রুটি: " + err.message));
      } else {
        adminCategories.unshift(newCat);
        adminCategories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        localStorage.setItem('rk_local_categories', JSON.stringify(adminCategories));
        newCategoryInput.value = '';
        renderAdminCategories();
        populateCategoryDropdown();
        updateKpis();
        showToast("ক্যাটাগরি সফলভাবে যুক্ত হয়েছে এবং সবার উপরে দেখাচ্ছে!");
      }
    });
  }

  // Delete Category Prompt & Execution
  function promptDeleteCategory(catId) {
    if (!catId) return;
    catToDeleteId = catId;
    const cat = adminCategories.find(c => (c.id || c.name) === catId);
    if (confirmDeleteCatName) {
      confirmDeleteCatName.textContent = cat ? `"${cat.name}"` : 'এই ক্যাটাগরি';
    }
    if (confirmDeleteCatModalBackdrop) {
      confirmDeleteCatModalBackdrop.classList.add('open');
    } else {
      executeDeleteCategory(catId);
    }
  }

  function closeDeleteCatModal() {
    catToDeleteId = null;
    if (confirmDeleteCatModalBackdrop) {
      confirmDeleteCatModalBackdrop.classList.remove('open');
    }
  }

  if (confirmDeleteCatBtn) {
    confirmDeleteCatBtn.addEventListener('click', () => {
      if (catToDeleteId) {
        executeDeleteCategory(catToDeleteId);
      }
    });
  }

  if (cancelDeleteCatBtn) {
    cancelDeleteCatBtn.addEventListener('click', () => {
      closeDeleteCatModal();
    });
  }

  function executeDeleteCategory(catId) {
    if (!catId) return;
    closeDeleteCatModal();

    adminCategories = adminCategories.filter(c => (c.id || c.name) !== catId);
    try {
      localStorage.setItem('rk_local_categories', JSON.stringify(adminCategories));
      localStorage.setItem('rk_last_updated', Date.now().toString());
    } catch (e) {}

    renderAdminCategories();
    populateCategoryDropdown();
    updateKpis();

    if (db) {
      db.ref(`categories/${catId}`).remove().catch(err => console.warn("Firebase category remove notice:", err));
    }

    showToast("ক্যাটাগরি মুছে ফেলা হয়েছে!");
  }

  // Populate Category options inside Video Modal (Newest Category at Top)
  function populateCategoryDropdown(selectedCategory = '') {
    if (!formCategory) return;
    formCategory.innerHTML = '';

    if (adminCategories.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '-- কোনো ক্যাটাগরি তৈরি নেই (নিচে লিখুন) --';
      formCategory.appendChild(opt);
      return;
    }

    adminCategories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    adminCategories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.name;
      opt.textContent = cat.name;
      if (selectedCategory && selectedCategory.toLowerCase() === cat.name.toLowerCase()) {
        opt.selected = true;
      }
      formCategory.appendChild(opt);
    });
  }

  // ==========================================
  // VIDEOS MANAGEMENT
  // ==========================================
  function renderAdminVideos() {
    if (!adminVideosList) return;

    if (adminVideos.length === 0) {
      adminVideosList.innerHTML = `
        <div style="text-align: center; padding: 32px 16px; color: var(--color-text-muted); background: var(--color-subtle-bg); border-radius: var(--radius-md); border: 1px dashed var(--color-border);">
          <div style="font-size: 1.1rem; font-weight: 600; color: var(--color-text); margin-bottom: 6px;">বর্তমানে কোনো ভিডিও নেই (ফুল ফ্রেশ)</div>
          <p style="font-size: 0.85rem; margin-bottom: 12px;">নতুন ভিডিও আপলোড করতে উপরের <strong>"+ নতুন ভিডিও যুক্ত করুন"</strong> বাটনে ক্লিক করুন।</p>
        </div>
      `;
      return;
    }

    adminVideosList.innerHTML = adminVideos.map(v => {
      const isChecked = v.active !== false ? 'checked' : '';
      const thumb = v.thumbUrl || '';
      const vUrl = v.videoUrl || '';
      let storageBadge = '';
      if (vUrl.includes('firebasestorage') || (vUrl.startsWith('http') && !v.isUploadedFile)) {
        storageBadge = '<span style="background: rgba(16, 185, 129, 0.12); color: #059669; border: 1px solid rgba(16, 185, 129, 0.3); padding: 1px 6px; border-radius: 4px; font-size: 0.68rem; font-weight: 700;" title="মোবাইল থেকে ডিলিট করলেও ক্লাউডে আজীবন সংরক্ষিত">☁️ ক্লাউড (স্থায়ী)</span>';
      } else if (vUrl.startsWith('/uploads/')) {
        storageBadge = '<span style="background: rgba(37, 99, 235, 0.12); color: #2563eb; border: 1px solid rgba(37, 99, 235, 0.3); padding: 1px 6px; border-radius: 4px; font-size: 0.68rem; font-weight: 700;" title="মোবাইল থেকে ডিলিট করলেও সার্ভারে স্থায়ীভাবে সংরক্ষিত">💾 সার্ভার ফাইল (স্থায়ী)</span>';
      } else if (vUrl.startsWith('indexeddb://')) {
        storageBadge = '<span style="background: rgba(245, 158, 11, 0.12); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3); padding: 1px 6px; border-radius: 4px; font-size: 0.68rem; font-weight: 700;" title="ডিভাইস ব্রাউজারে সংরক্ষিত">📱 লোকাল মেমোরি</span>';
      }

      return `
        <div class="item-row" data-id="${v.videoId}">
          <div class="item-row-left">
            ${thumb 
              ? `<img src="${escapeHtml(thumb)}" alt="" class="item-thumb-sm" onerror="this.style.display='none';" />`
              : `<div class="item-thumb-sm" style="display:flex;align-items:center;justify-content:center;background:#1e293b;color:var(--color-primary);font-size:1.1rem;border-radius:var(--radius-sm);font-weight:bold;">▶</div>`
            }
            <div>
              <div class="item-title-text">${escapeHtml(v.title || 'শিরোনামহীন')}</div>
              <div class="item-subtext">
                <span>📁 ${escapeHtml(v.category || 'General')}</span>
                <span>⏱ ${escapeHtml(v.duration || '00:00')}</span>
                <span>👁 ${v.views || 0}</span>
                <span>👍 ${v.likes || 0}</span>
                ${storageBadge}
              </div>
            </div>
          </div>
          <div class="item-actions">
            <label class="switch" title="সক্রিয় / নিষ্ক্রিয় করুন">
              <input type="checkbox" class="toggle-video-active" ${isChecked}>
              <span class="slider"></span>
            </label>
            <button class="btn-edit edit-video-btn" title="সম্পাদনা">
              ✏️ সম্পাদনা
            </button>
            <button class="btn-danger delete-video-btn" title="মুছুন">
              🗑 মুছুন
            </button>
          </div>
        </div>
      `;
    }).join('');

    adminVideosList.querySelectorAll('.item-row').forEach(row => {
      const vid = row.getAttribute('data-id');
      const toggle = row.querySelector('.toggle-video-active');
      const editBtn = row.querySelector('.edit-video-btn');
      const deleteBtn = row.querySelector('.delete-video-btn');

      if (toggle) {
        toggle.addEventListener('change', (e) => {
          toggleVideoStatus(vid, e.target.checked);
        });
      }

      if (editBtn) {
        editBtn.addEventListener('click', () => {
          const found = adminVideos.find(v => v.videoId === vid);
          if (found) openVideoModal(found);
        });
      }

      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          promptDeleteVideo(vid);
        });
      }
    });
  }

  function promptDeleteVideo(videoId) {
    if (!videoId) return;
    videoToDeleteId = videoId;
    const found = adminVideos.find(v => (v.videoId || v.id) === videoId);
    const title = found && found.title ? found.title : 'এই ভিডিওটি';
    if (confirmDeleteVideoTitle) {
      confirmDeleteVideoTitle.textContent = title;
    }
    if (confirmDeleteModalBackdrop) {
      confirmDeleteModalBackdrop.classList.add('open');
    } else {
      executeDeleteVideo(videoId);
    }
  }

  function closeDeleteVideoModal() {
    videoToDeleteId = null;
    if (confirmDeleteModalBackdrop) {
      confirmDeleteModalBackdrop.classList.remove('open');
    }
  }

  if (confirmDeleteVideoBtn) {
    confirmDeleteVideoBtn.addEventListener('click', () => {
      if (videoToDeleteId) {
        executeDeleteVideo(videoToDeleteId);
      }
    });
  }

  if (cancelDeleteVideoBtn) {
    cancelDeleteVideoBtn.addEventListener('click', () => {
      closeDeleteVideoModal();
    });
  }

  function toggleVideoStatus(videoId, active) {
    if (!isLocalMode && db) {
      db.ref(`videos/${videoId}/active`).set(active)
        .then(() => showToast(`ভিডিও ${active ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`))
        .catch(err => showToast("ত্রুটি: " + err.message));
    } else {
      const idx = adminVideos.findIndex(v => (v.videoId || v.id) === videoId);
      if (idx !== -1) {
        adminVideos[idx].active = active;
        localStorage.setItem('rk_local_videos', JSON.stringify(adminVideos));
        updateKpis();
        showToast(`ভিডিও ${active ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`);
      }
    }
  }

  async function executeDeleteVideo(videoId) {
    if (!videoId) return;
    const vid = videoId;
    closeDeleteVideoModal();

    // 1. Identify target video in array
    const targetVideo = adminVideos.find(v => (v.videoId || v.id) === vid);
    const firebaseKey = (targetVideo && (targetVideo.id || targetVideo.videoId)) || vid;

    // 2. Delete file blob from IndexedDB if stored
    if (window.RK_INDEXED_DB) {
      try {
        await window.RK_INDEXED_DB.deleteVideoBlob(vid);
        if (firebaseKey !== vid) {
          await window.RK_INDEXED_DB.deleteVideoBlob(firebaseKey);
        }
      } catch (idbErr) {
        console.warn("IndexedDB delete notice:", idbErr);
      }
    }

    // 2.b. Delete from server upload storage or Firebase Cloud Storage if applicable
    if (targetVideo && targetVideo.videoUrl) {
      if (targetVideo.videoUrl.startsWith('/uploads/')) {
        try {
          fetch('/api/delete-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: targetVideo.videoUrl })
          }).catch(() => {});
        } catch (delErr) {}
      } else if (targetVideo.videoUrl.includes('firebasestorage') && window.RK_FIREBASE && window.RK_FIREBASE.getStorage) {
        try {
          const st = window.RK_FIREBASE.getStorage();
          if (st) {
            st.refFromURL(targetVideo.videoUrl).delete().catch(() => {});
          }
        } catch (stDelErr) {}
      }
    }

    // 3. Immediately remove from in-memory adminVideos
    adminVideos = adminVideos.filter(v => (v.videoId || v.id) !== vid && (v.videoId || v.id) !== firebaseKey);

    // 4. Immediately persist to localStorage
    try {
      localStorage.setItem('rk_local_videos', JSON.stringify(adminVideos));
      localStorage.setItem('rk_last_updated', Date.now().toString());
    } catch (storageErr) {
      console.warn("LocalStorage save warning:", storageErr);
    }

    // 5. Instantly re-render Admin UI & update KPIs (zero lag!)
    renderAdminVideos();
    updateKpis();

    // 6. Delete from Firebase if database is connected
    if (db) {
      db.ref(`videos/${firebaseKey}`).remove().catch(err => {
        console.warn("Firebase video remove notice:", err);
      });
      if (targetVideo && targetVideo.videoId && targetVideo.videoId !== firebaseKey) {
        db.ref(`videos/${targetVideo.videoId}`).remove().catch(() => {});
      }
    }

    // 7. Dispatch custom events for real-time synchronization with homepage
    try {
      window.dispatchEvent(new CustomEvent('rk_videos_updated', { 
        detail: { action: 'delete', videoId: vid } 
      }));
    } catch (e) {}

    showToast("ভিডিও সফলভাবে মুছে ফেলা হয়েছে!");
  }

  // Format seconds to mm:ss
  function formatSecondsToDuration(sec) {
    if (!sec || isNaN(sec)) return '03:30';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Attempt to capture video thumbnail snapshot
  function tryCaptureVideoFrame(videoElement) {
    if (!videoElement) return;
    try {
      if (videoElement.duration && !isNaN(videoElement.duration) && formDuration) {
        formDuration.value = formatSecondsToDuration(videoElement.duration);
      }
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(videoElement.videoWidth || 640, 640);
      canvas.height = Math.min(videoElement.videoHeight || 360, 360);
      if (canvas.width > 0 && canvas.height > 0) {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        currentCapturedThumb = canvas.toDataURL('image/jpeg', 0.7);
      }
    } catch (e) {
      // Cross-origin issues on some remote video hosts might taint canvas
    }
  }

  function setVideoSourceMode(mode) {
    activeVideoSourceMode = mode;
    if (mode === 'url') {
      if (sourceTabUrl) sourceTabUrl.classList.add('active');
      if (sourceTabFile) sourceTabFile.classList.remove('active');
      if (urlSourceSection) urlSourceSection.style.display = 'block';
      if (fileSourceSection) fileSourceSection.style.display = 'none';
      if (formVideoUrl) formVideoUrl.required = (activeVideoSourceMode === 'url');
    } else {
      if (sourceTabUrl) sourceTabUrl.classList.remove('active');
      if (sourceTabFile) sourceTabFile.classList.add('active');
      if (urlSourceSection) urlSourceSection.style.display = 'none';
      if (fileSourceSection) fileSourceSection.style.display = 'block';
      if (formVideoUrl) formVideoUrl.required = false;
    }
  }

  function setupDirectVideoHandlers() {
    if (sourceTabUrl) {
      sourceTabUrl.addEventListener('click', () => setVideoSourceMode('url'));
    }
    if (sourceTabFile) {
      sourceTabFile.addEventListener('click', () => setVideoSourceMode('file'));
    }

    // Video Drop Zone and File Selection
    if (videoDropZone && formVideoFileInput) {
      videoDropZone.addEventListener('click', (e) => {
        if (e.target !== removeFileBtn && !e.target.closest('#removeFileBtn')) {
          formVideoFileInput.click();
        }
      });

      videoDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        videoDropZone.classList.add('dragover');
      });

      videoDropZone.addEventListener('dragleave', () => {
        videoDropZone.classList.remove('dragover');
      });

      videoDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        videoDropZone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          if (e.dataTransfer.files.length > 1) {
            closeVideoModal();
            openBulkVideoModal();
            handleBulkSelectedFiles(e.dataTransfer.files);
          } else {
            handleSelectedVideoFile(e.dataTransfer.files[0]);
          }
        }
      });

      formVideoFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          if (e.target.files.length > 1) {
            closeVideoModal();
            openBulkVideoModal();
            handleBulkSelectedFiles(e.target.files);
          } else {
            handleSelectedVideoFile(e.target.files[0]);
          }
        }
      });
    }

    if (removeFileBtn) {
      removeFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearSelectedVideoFile();
        if (formVideoFileInput) formVideoFileInput.click();
      });
    }

    // Live URL Preview & Duration detection
    if (formVideoUrl) {
      let debounceTimer = null;
      formVideoUrl.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const val = (formVideoUrl.value || '').trim();
          if (val) {
            const formatted = window.RK_FIREBASE && window.RK_FIREBASE.formatDirectVideoUrl 
              ? window.RK_FIREBASE.formatDirectVideoUrl(val) 
              : val;
            previewDirectVideo(formatted);
          } else {
            hidePreviewVideo();
          }
        }, 500);
      });
    }

    if (modalVideoPreview) {
      modalVideoPreview.addEventListener('loadedmetadata', () => {
        tryCaptureVideoFrame(modalVideoPreview);
      });
      modalVideoPreview.addEventListener('seeked', () => {
        tryCaptureVideoFrame(modalVideoPreview);
      });
    }
  }

  function handleSelectedVideoFile(file) {
    if (!file) return;
    const isVideo = (file.type && file.type.startsWith('video/')) || 
                    /\.(mp4|webm|mkv|mov|avi|flv|wmv|m4v|ts|3gp|m3u8|mpg|mpeg)$/i.test(file.name) ||
                    (file.size > 0 && !file.name.match(/\.(jpg|jpeg|png|gif|txt|html|pdf)$/i));
    if (!isVideo) {
      showToast("দয়া করে একটি সঠিক ভিডিও ফাইল নির্বাচন করুন (.mp4, .webm, ইত্যাদি)");
      return;
    }

    currentSelectedFile = file;
    if (currentFileBlobUrl) {
      URL.revokeObjectURL(currentFileBlobUrl);
    }
    currentFileBlobUrl = URL.createObjectURL(file);

    // Update Drop Zone UI
    if (dropZonePrompt) dropZonePrompt.style.display = 'none';
    if (selectedFileInfo) selectedFileInfo.style.display = 'flex';
    if (selectedFileName) selectedFileName.textContent = file.name;
    if (selectedFileSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      selectedFileSize.textContent = `${sizeMB} MB • ${file.type || 'Video'}`;
    }

    // Auto-fill video title if empty
    if (formVideoTitle && !formVideoTitle.value.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      formVideoTitle.value = baseName;
    }

    // Immediately capture duration & thumbnail frame from file
    extractVideoMetadata(file).then(meta => {
      if (meta.duration && formDuration) {
        formDuration.value = meta.duration;
      }
      if (meta.thumbUrl) {
        currentCapturedThumb = meta.thumbUrl;
      }
    });

    // Preview
    previewDirectVideo(currentFileBlobUrl);
  }

  function clearSelectedVideoFile() {
    currentSelectedFile = null;
    if (currentFileBlobUrl) {
      URL.revokeObjectURL(currentFileBlobUrl);
      currentFileBlobUrl = null;
    }
    if (formVideoFileInput) formVideoFileInput.value = '';
    if (dropZonePrompt) dropZonePrompt.style.display = 'block';
    if (selectedFileInfo) selectedFileInfo.style.display = 'none';
    hidePreviewVideo();
  }

  function previewDirectVideo(url) {
    if (!modalVideoPreview || !previewContainer) return;
    modalVideoPreview.src = url;
    modalVideoPreview.currentTime = 0.5;
    previewContainer.style.display = 'block';
  }

  function hidePreviewVideo() {
    if (!modalVideoPreview || !previewContainer) return;
    modalVideoPreview.pause();
    modalVideoPreview.src = '';
    previewContainer.style.display = 'none';
  }

  function openVideoModal(video = null) {
    if (!videoModalBackdrop) return;
    currentCapturedThumb = '';
    existingVideoThumb = '';
    clearSelectedVideoFile();

    if (video) {
      videoModalHeading.textContent = "ভিডিও সম্পাদনা করুন";
      formVideoId.value = video.videoId;
      formVideoTitle.value = video.title || '';
      formDuration.value = video.duration || '03:45';
      formVideoActive.checked = video.active !== false;
      existingVideoThumb = video.thumbUrl || '';
      populateCategoryDropdown(video.category || '');
      formCustomCategory.value = '';

      if (video.videoUrl && (video.videoUrl.startsWith('indexeddb://') || video.videoUrl.startsWith('/uploads/'))) {
        setVideoSourceMode('file');
        if (formVideoUrl) formVideoUrl.value = '';
        if (dropZonePrompt) dropZonePrompt.style.display = 'none';
        if (selectedFileInfo) selectedFileInfo.style.display = 'flex';
        if (selectedFileName) selectedFileName.textContent = video.fileName || "আপলোডকৃত সরাসরি ভিডিও ফাইল";
        if (selectedFileSize) selectedFileSize.textContent = video.fileSize ? `${(video.fileSize/(1024*1024)).toFixed(1)} MB` : "ডিভাইস স্টোরেজ";

        // Load preview
        if (video.videoUrl.startsWith('indexeddb://') && window.RK_INDEXED_DB) {
          const vkey = video.videoUrl.replace('indexeddb://', '') || video.videoId;
          window.RK_INDEXED_DB.getVideoBlob(vkey).then(blob => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              previewDirectVideo(url);
            }
          });
        } else if (video.videoUrl.startsWith('/uploads/')) {
          previewDirectVideo(video.videoUrl);
        }
      } else {
        setVideoSourceMode('url');
        if (formVideoUrl) formVideoUrl.value = video.videoUrl || '';
        if (video.videoUrl) {
          const formatted = window.RK_FIREBASE && window.RK_FIREBASE.formatDirectVideoUrl 
            ? window.RK_FIREBASE.formatDirectVideoUrl(video.videoUrl) 
            : video.videoUrl;
          previewDirectVideo(formatted);
        }
      }
    } else {
      videoModalHeading.textContent = "নতুন ভিডিও যোগ করুন";
      videoForm.reset();
      formVideoId.value = '';
      formVideoActive.checked = true;
      formDuration.value = '03:45';
      formCustomCategory.value = '';
      populateCategoryDropdown();
      // Default directly to FILE UPLOAD mode for fast mobile video adding
      setVideoSourceMode('file');
      hidePreviewVideo();
    }
    videoModalBackdrop.classList.add('open');
  }

  function closeVideoModal() {
    if (videoModalBackdrop) videoModalBackdrop.classList.remove('open');
    if (singleFileProgressContainer) singleFileProgressContainer.style.display = 'none';
    if (saveVideoBtn) {
      saveVideoBtn.disabled = false;
      saveVideoBtn.innerHTML = '<span>সংরক্ষণ করুন</span>';
    }
    hidePreviewVideo();
    clearSelectedVideoFile();
  }

  if (videoForm) {
    videoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const vid = formVideoId.value || 'vid_' + Date.now();
      const title = formVideoTitle.value.trim();

      // Category selection: take custom if typed, else dropdown
      let finalCategory = (formCustomCategory.value || '').trim();
      if (!finalCategory) {
        finalCategory = (formCategory.value || '').trim();
      }
      if (!finalCategory) {
        finalCategory = 'General';
      }

      let finalVideoUrl = '';
      let isUploadedFile = false;
      let fileName = '';
      let fileSize = 0;

      if (activeVideoSourceMode === 'file') {
        if (!currentSelectedFile && !formVideoId.value) {
          showToast("দয়া করে সরাসরি একটি ভিডিও ফাইল নির্বাচন করুন!");
          return;
        }

        if (currentSelectedFile) {
          isUploadedFile = true;
          fileName = currentSelectedFile.name;
          fileSize = currentSelectedFile.size;

          // Activate Live Upload Progress Bar
          if (singleFileProgressContainer) {
            singleFileProgressContainer.style.display = 'block';
            if (singleFileProgressPercent) singleFileProgressPercent.textContent = '0%';
            if (singleFileProgressFill) singleFileProgressFill.style.width = '0%';
            if (singleFileProgressStatus) singleFileProgressStatus.textContent = 'ভিডিও স্থায়ী ক্লাউড স্টোরেজে আপলোড হচ্ছে...';
          }
          if (saveVideoBtn) {
            saveVideoBtn.disabled = true;
            saveVideoBtn.innerHTML = '<span>⏳ ক্লাউডে আপলোড হচ্ছে...</span>';
          }

          try {
            const uploadResult = await window.RK_FIREBASE.uploadVideoToCloud(
              currentSelectedFile,
              vid,
              (pct, msg) => {
                if (singleFileProgressPercent) singleFileProgressPercent.textContent = `${pct}%`;
                if (singleFileProgressFill) singleFileProgressFill.style.width = `${pct}%`;
                if (singleFileProgressStatus) singleFileProgressStatus.textContent = `${msg} (${pct}%)`;
              }
            );

            if (uploadResult && uploadResult.url) {
              finalVideoUrl = uploadResult.url;
            } else {
              finalVideoUrl = 'indexeddb://' + vid;
            }
          } catch (uploadErr) {
            console.warn("Upload fallback error:", uploadErr);
            finalVideoUrl = 'indexeddb://' + vid;
            if (window.RK_INDEXED_DB) {
              await window.RK_INDEXED_DB.saveVideoBlob(vid, currentSelectedFile);
            }
          }
        } else {
          // Editing existing file-based video
          const foundExisting = adminVideos.find(v => v.videoId === vid);
          if (foundExisting) {
            finalVideoUrl = foundExisting.videoUrl;
            isUploadedFile = true;
            fileName = foundExisting.fileName || '';
            fileSize = foundExisting.fileSize || 0;
          }
        }
      } else {
        const rawUrl = (formVideoUrl.value || '').trim();
        if (!rawUrl) {
          showToast("দয়া করে সরাসরি একটি ভিডিওর লিংক দিন!");
          return;
        }
        finalVideoUrl = window.RK_FIREBASE && window.RK_FIREBASE.formatDirectVideoUrl 
          ? window.RK_FIREBASE.formatDirectVideoUrl(rawUrl) 
          : rawUrl;
      }

      // Thumbnail is auto-captured from the video, NO manual input needed!
      const finalThumb = currentCapturedThumb || existingVideoThumb || '';

      const videoData = {
        videoId: vid,
        title: title,
        videoUrl: finalVideoUrl,
        thumbUrl: finalThumb,
        isUploadedFile: isUploadedFile,
        fileName: fileName,
        fileSize: fileSize,
        category: finalCategory,
        duration: (formDuration.value || '').trim() || '03:30',
        active: formVideoActive.checked,
        createdAt: Date.now()
      };

      // Always save locally first so the video is immediately accessible
      const idx = adminVideos.findIndex(v => v.videoId === vid);
      if (idx !== -1) {
        adminVideos[idx] = { ...adminVideos[idx], ...videoData };
      } else {
        videoData.views = videoData.views || 0;
        videoData.likes = videoData.likes || 0;
        adminVideos.unshift(videoData);
      }
      try {
        localStorage.setItem('rk_local_videos', JSON.stringify(adminVideos));
      } catch (storageErr) {
        console.warn("Storage warning:", storageErr);
      }
      renderAdminVideos();
      updateKpis();

      if (!isLocalMode && db) {
        try {
          await db.ref(`videos/${vid}`).update(videoData);
          showToast("ভিডিও সফলভাবে সংরক্ষিত হয়েছে!");
          closeVideoModal();
        } catch (err) {
          console.warn("Firebase sync notice:", err);
          showToast("ভিডিও লোকাল মেমোরিতে সফলভাবে সংরক্ষিত হয়েছে!");
          closeVideoModal();
        } finally {
          if (saveVideoBtn) {
            saveVideoBtn.disabled = false;
            saveVideoBtn.innerHTML = '<span>সংরক্ষণ করুন</span>';
          }
          if (singleFileProgressContainer) {
            singleFileProgressContainer.style.display = 'none';
          }
        }
      } else {
        showToast("ভিডিও সফলভাবে সংরক্ষিত হয়েছে!");
        closeVideoModal();
        if (saveVideoBtn) {
          saveVideoBtn.disabled = false;
          saveVideoBtn.innerHTML = '<span>সংরক্ষণ করুন</span>';
        }
        if (singleFileProgressContainer) {
          singleFileProgressContainer.style.display = 'none';
        }
      }
    });
  }

  // ==========================================
  // BULK / MULTIPLE VIDEOS MANAGEMENT ENGINE
  // ==========================================

  function populateBulkCategories() {
    let cats = [];
    if (adminCategories && adminCategories.length > 0) {
      adminCategories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      cats = adminCategories.map(c => c.name);
    } else {
      cats = ['General', 'মুভি', 'নাটক', 'গান', 'ফান', 'ট্রেন্ডিং'];
    }

    const optionsHtml = cats.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('');

    if (bulkFilesCategory) {
      bulkFilesCategory.innerHTML = optionsHtml;
    }
    if (bulkUrlsCategory) {
      bulkUrlsCategory.innerHTML = optionsHtml;
    }
  }

  function setBulkTab(tab) {
    activeBulkTab = tab;
    if (tab === 'files') {
      if (bulkTabFiles) bulkTabFiles.classList.add('active');
      if (bulkTabUrls) bulkTabUrls.classList.remove('active');
      if (bulkFilesSection) bulkFilesSection.style.display = 'block';
      if (bulkUrlsSection) bulkUrlsSection.style.display = 'none';
    } else {
      if (bulkTabFiles) bulkTabFiles.classList.remove('active');
      if (bulkTabUrls) bulkTabUrls.classList.add('active');
      if (bulkFilesSection) bulkFilesSection.style.display = 'none';
      if (bulkUrlsSection) bulkUrlsSection.style.display = 'block';
      parseAndCountBulkUrls();
    }
  }

  function openBulkVideoModal() {
    if (!bulkVideoModalBackdrop) return;
    if (videoModalBackdrop) videoModalBackdrop.classList.remove('open');

    populateBulkCategories();
    if (!isBulkProcessing) {
      setBulkTab(activeBulkTab || 'files');
      if (bulkFilesProgressContainer) bulkFilesProgressContainer.style.display = 'none';
      if (bulkUrlsProgressContainer) bulkUrlsProgressContainer.style.display = 'none';
    }
    bulkVideoModalBackdrop.classList.add('open');
  }

  function closeBulkVideoModal() {
    if (isBulkProcessing) {
      if (!confirm("ভিডিও প্রক্রিয়া চলছে। আপনি কি সত্যিই বন্ধ করতে চান?")) return;
    }
    if (bulkVideoModalBackdrop) bulkVideoModalBackdrop.classList.remove('open');
    if (!isBulkProcessing) {
      clearBulkQueue();
    }
  }

  function clearBulkQueue() {
    bulkQueueFiles = [];
    if (bulkVideoFilesInput) bulkVideoFilesInput.value = '';
    if (bulkQueueContainer) bulkQueueContainer.style.display = 'none';
    if (bulkQueueList) bulkQueueList.innerHTML = '';
    if (bulkQueueCount) bulkQueueCount.textContent = '0';
    if (saveBulkFilesCount) saveBulkFilesCount.textContent = '0';
    if (saveBulkFilesBtn) saveBulkFilesBtn.disabled = true;
    if (bulkFilesProgressContainer) bulkFilesProgressContainer.style.display = 'none';
  }

  // Extract duration and auto-capture thumbnail frame from a Video File
  function extractVideoMetadata(file) {
    return new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(file);
        const tempVideo = document.createElement('video');
        tempVideo.preload = 'metadata';
        tempVideo.muted = true;
        tempVideo.playsInline = true;
        tempVideo.src = url;

        let resolved = false;
        const done = (duration, thumbUrl) => {
          if (resolved) return;
          resolved = true;
          URL.revokeObjectURL(url);
          resolve({ duration: duration || '03:30', thumbUrl: thumbUrl || '' });
        };

        const timer = setTimeout(() => {
          done('03:30', '');
        }, 3500);

        tempVideo.addEventListener('loadeddata', () => {
          try {
            // Seek to 1st second (instant keyframe) instead of middle to avoid freezing on big videos
            tempVideo.currentTime = Math.min(1.0, (tempVideo.duration > 0.5 ? 0.8 : 0.1));
          } catch (e) {
            done('03:30', '');
          }
        });

        tempVideo.addEventListener('seeked', () => {
          clearTimeout(timer);
          let thumb = '';
          try {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(tempVideo.videoWidth || 360, 360);
            canvas.height = Math.min(tempVideo.videoHeight || 202, 202);
            if (canvas.width > 0 && canvas.height > 0) {
              const ctx = canvas.getContext('2d');
              ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
              thumb = canvas.toDataURL('image/jpeg', 0.5);
            }
          } catch (e) {}
          const dur = formatSecondsToDuration(tempVideo.duration);
          done(dur, thumb);
        });

        tempVideo.addEventListener('error', () => {
          clearTimeout(timer);
          done('03:30', '');
        });
      } catch (e) {
        resolve({ duration: '03:30', thumbUrl: '' });
      }
    });
  }

  function handleBulkSelectedFiles(files) {
    if (!files || files.length === 0) return;

    const newItems = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type && !file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mkv|mov|avi|flv|wmv|m4v|ts|3gp)$/i)) {
        continue;
      }
      const rawName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
      const item = {
        id: 'bulk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        file: file,
        title: rawName || `ভিডিও ${bulkQueueFiles.length + i + 1}`,
        sizeMb: (file.size / (1024 * 1024)).toFixed(1),
        duration: '03:30',
        thumbUrl: '',
        isLoadingMeta: true
      };
      bulkQueueFiles.push(item);
      newItems.push(item);
    }

    if (bulkQueueFiles.length === 0) {
      showToast("কোনো সঠিক ভিডিও ফাইল পাওয়া যায়নি!");
      return;
    }

    renderBulkQueueList();
    if (bulkQueueContainer) bulkQueueContainer.style.display = 'block';
    if (saveBulkFilesBtn) saveBulkFilesBtn.disabled = false;

    // Asynchronously extract duration and frame snapshot for each video
    newItems.forEach(item => {
      extractVideoMetadata(item.file).then(meta => {
        item.duration = meta.duration;
        item.thumbUrl = meta.thumbUrl;
        item.isLoadingMeta = false;
        updateBulkQueueItemUI(item.id);
      });
    });
  }

  function updateBulkQueueItemUI(itemId) {
    const item = bulkQueueFiles.find(x => x.id === itemId);
    if (!item) return;
    const cardEl = document.querySelector(`.bulk-queue-item[data-id="${itemId}"]`);
    if (!cardEl) return;

    const thumbWrap = cardEl.querySelector('.bulk-queue-item-thumb');
    if (thumbWrap) {
      if (item.thumbUrl) {
        thumbWrap.innerHTML = `<img src="${item.thumbUrl}" alt="" />`;
      } else {
        thumbWrap.innerHTML = `<span>▶</span>`;
      }
    }
    const metaDur = cardEl.querySelector('.item-dur-badge');
    if (metaDur) {
      metaDur.textContent = `⏱ ${item.duration}`;
    }
  }

  function renderBulkQueueList() {
    if (!bulkQueueList) return;
    if (bulkQueueCount) bulkQueueCount.textContent = bulkQueueFiles.length.toString();
    if (saveBulkFilesCount) saveBulkFilesCount.textContent = bulkQueueFiles.length.toString();

    if (bulkQueueFiles.length === 0) {
      if (bulkQueueContainer) bulkQueueContainer.style.display = 'none';
      if (saveBulkFilesBtn) saveBulkFilesBtn.disabled = true;
      bulkQueueList.innerHTML = '';
      return;
    }

    bulkQueueList.innerHTML = bulkQueueFiles.map(item => `
      <div class="bulk-queue-item" data-id="${item.id}">
        <div class="bulk-queue-item-thumb">
          ${item.thumbUrl 
            ? `<img src="${item.thumbUrl}" alt="" />`
            : `<span>${item.isLoadingMeta ? '⏳' : '▶'}</span>`
          }
        </div>
        <div class="bulk-queue-item-body">
          <input 
            type="text" 
            class="bulk-queue-item-title-input" 
            value="${escapeHtml(item.title)}" 
            placeholder="ভিডিওর শিরোনাম লিখুন..." 
            title="শিরোনাম পরিবর্তন করতে পারেন"
          />
          <div class="bulk-queue-item-meta">
            <span>💾 ${item.sizeMb} MB</span>
            <span class="item-dur-badge">⏱ ${escapeHtml(item.duration)}</span>
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;">${escapeHtml(item.file.name)}</span>
          </div>
        </div>
        <button type="button" class="btn-danger remove-bulk-item-btn" style="padding: 4px 8px; font-size: 0.75rem; border-radius: 4px;" title="তালিকা থেকে বাদ দিন">
          ✕
        </button>
      </div>
    `).join('');

    // Attach event listeners for each item in queue
    bulkQueueList.querySelectorAll('.bulk-queue-item').forEach(card => {
      const id = card.getAttribute('data-id');
      const titleInput = card.querySelector('.bulk-queue-item-title-input');
      const removeBtn = card.querySelector('.remove-bulk-item-btn');

      if (titleInput) {
        titleInput.addEventListener('input', (e) => {
          const target = bulkQueueFiles.find(x => x.id === id);
          if (target) target.title = e.target.value;
        });
      }

      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          bulkQueueFiles = bulkQueueFiles.filter(x => x.id !== id);
          renderBulkQueueList();
        });
      }
    });
  }

  // Save all queued video files into IndexedDB & Firebase/LocalStorage
  async function processAndSaveBulkFiles() {
    if (bulkQueueFiles.length === 0) {
      showToast("কোনো ভিডিও ফাইল নির্বাচিত নেই!");
      return;
    }

    let batchCategory = (bulkFilesCustomCategory.value || '').trim();
    if (!batchCategory) {
      batchCategory = (bulkFilesCategory.value || '').trim();
    }
    if (!batchCategory) {
      batchCategory = 'General';
    }

    isBulkProcessing = true;
    if (saveBulkFilesBtn) saveBulkFilesBtn.disabled = true;
    if (cancelBulkFilesBtn) cancelBulkFilesBtn.disabled = true;
    if (bulkFilesProgressContainer) bulkFilesProgressContainer.style.display = 'block';

    const total = bulkQueueFiles.length;
    let savedCount = 0;

    for (let i = 0; i < total; i++) {
      const item = bulkQueueFiles[i];
      const vid = 'vid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

      if (bulkFilesProgressStatus) {
        bulkFilesProgressStatus.textContent = `সংরক্ষণ হচ্ছে... (${i + 1}/${total}) ${item.title}`;
      }
      const pct = Math.round(((i + 0.5) / total) * 100);
      if (bulkFilesProgressPercent) bulkFilesProgressPercent.textContent = `${pct}%`;
      if (bulkFilesProgressFill) bulkFilesProgressFill.style.width = `${pct}%`;

      // 1. Upload to Permanent Cloud/Server Storage
      let finalBulkUrl = 'indexeddb://' + vid;
      try {
        const uploadRes = await window.RK_FIREBASE.uploadVideoToCloud(
          item.file,
          vid,
          (filePct, statusMsg) => {
            const overallPct = Math.round(((i + (filePct / 100)) / total) * 100);
            if (bulkFilesProgressPercent) bulkFilesProgressPercent.textContent = `${overallPct}%`;
            if (bulkFilesProgressFill) bulkFilesProgressFill.style.width = `${overallPct}%`;
            if (bulkFilesProgressStatus) {
              bulkFilesProgressStatus.textContent = `(${i + 1}/${total}) ${item.title} - ${statusMsg}`;
            }
          }
        );
        if (uploadRes && uploadRes.url) {
          finalBulkUrl = uploadRes.url;
        }
      } catch (bulkUploadErr) {
        console.warn("Bulk upload fallback error:", bulkUploadErr);
        if (window.RK_INDEXED_DB) {
          try {
            await window.RK_INDEXED_DB.saveVideoBlob(vid, item.file);
          } catch (e) {}
        }
      }

      // 2. Prepare video object (Thumbnail auto captured, NO thumbnail input required)
      const videoData = {
        videoId: vid,
        title: (item.title || '').trim() || item.file.name,
        videoUrl: finalBulkUrl,
        thumbUrl: item.thumbUrl || '',
        isUploadedFile: true,
        fileName: item.file.name,
        fileSize: item.file.size,
        category: batchCategory,
        duration: item.duration || '03:30',
        active: true,
        views: 0,
        likes: 0,
        createdAt: Date.now() + i
      };

      // 3. Save to Local state and Firebase
      const existIdx = adminVideos.findIndex(v => v.videoId === vid);
      if (existIdx !== -1) {
        adminVideos[existIdx] = videoData;
      } else {
        adminVideos.unshift(videoData);
      }

      if (!isLocalMode && db) {
        try {
          await db.ref(`videos/${vid}`).set(videoData);
        } catch (fbErr) {
          console.error("Firebase bulk video save error:", fbErr);
        }
      }

      savedCount++;
      const donePct = Math.round(((i + 1) / total) * 100);
      if (bulkFilesProgressPercent) bulkFilesProgressPercent.textContent = `${donePct}%`;
      if (bulkFilesProgressFill) bulkFilesProgressFill.style.width = `${donePct}%`;
    }

    try {
      localStorage.setItem('rk_local_videos', JSON.stringify(adminVideos));
    } catch (storageErr) {
      console.warn("Storage warning:", storageErr);
    }
    renderAdminVideos();
    updateKpis();

    isBulkProcessing = false;
    if (cancelBulkFilesBtn) cancelBulkFilesBtn.disabled = false;
    showToast(`🎉 একসাথে ${savedCount} টি ভিডিও সফলভাবে আপলোড ও যুক্ত হয়েছে!`);
    clearBulkQueue();
    closeBulkVideoModal();
  }

  // Parse lines from URLs textarea and count valid ones
  function parseAndCountBulkUrls() {
    const text = (bulkUrlsTextarea ? bulkUrlsTextarea.value : '') || '';
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const validCount = lines.filter(l => l.includes('http://') || l.includes('https://') || l.includes('dropbox') || l.includes('drive.google')).length;

    if (bulkUrlsCountBadge) {
      bulkUrlsCountBadge.textContent = `সনাক্ত লিংক: ${validCount} টি`;
      bulkUrlsCountBadge.style.color = validCount > 0 ? '#16a34a' : 'var(--color-primary)';
    }
    if (saveBulkUrlsBtn) {
      saveBulkUrlsBtn.disabled = validCount === 0;
    }
    return lines;
  }

  // Save all URLs pasted in textarea
  async function processAndSaveBulkUrls() {
    const lines = parseAndCountBulkUrls();
    if (lines.length === 0) {
      showToast("অনুগ্রহ করে অন্তত একটি ভিডিও লিংক পেস্ট করুন!");
      return;
    }

    let batchCategory = (bulkUrlsCustomCategory.value || '').trim();
    if (!batchCategory) {
      batchCategory = (bulkUrlsCategory.value || '').trim();
    }
    if (!batchCategory) {
      batchCategory = 'General';
    }

    isBulkProcessing = true;
    if (saveBulkUrlsBtn) saveBulkUrlsBtn.disabled = true;
    if (cancelBulkUrlsBtn) cancelBulkUrlsBtn.disabled = true;
    if (bulkUrlsProgressContainer) bulkUrlsProgressContainer.style.display = 'block';

    const validItems = [];
    lines.forEach((line, idx) => {
      let rawUrl = '';
      let title = '';

      if (line.includes('|')) {
        const parts = line.split('|');
        title = parts[0].trim();
        rawUrl = parts.slice(1).join('|').trim();
      } else {
        rawUrl = line.trim();
      }

      if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
        if (rawUrl.includes('dropbox.com') || rawUrl.includes('drive.google.com')) {
          rawUrl = 'https://' + rawUrl;
        } else {
          return; // skip non-url lines
        }
      }

      const formattedUrl = window.RK_FIREBASE && window.RK_FIREBASE.formatDirectVideoUrl
        ? window.RK_FIREBASE.formatDirectVideoUrl(rawUrl)
        : rawUrl;

      if (!title) {
        // Derive title from url or fallback
        try {
          const parsed = new URL(formattedUrl);
          const segs = parsed.pathname.split('/').filter(Boolean);
          const last = segs[segs.length - 1] || '';
          title = decodeURIComponent(last.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim()) || `ভিডিও ${idx + 1}`;
        } catch (e) {
          title = `ভিডিও ${idx + 1}`;
        }
      }

      validItems.push({ title, url: formattedUrl });
    });

    if (validItems.length === 0) {
      showToast("কোনো সঠিক ভিডিও লিংক পাওয়া যায়নি!");
      isBulkProcessing = false;
      if (saveBulkUrlsBtn) saveBulkUrlsBtn.disabled = false;
      if (cancelBulkUrlsBtn) cancelBulkUrlsBtn.disabled = false;
      if (bulkUrlsProgressContainer) bulkUrlsProgressContainer.style.display = 'none';
      return;
    }

    const total = validItems.length;
    let savedCount = 0;

    for (let i = 0; i < total; i++) {
      const item = validItems[i];
      const vid = 'vid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

      if (bulkUrlsProgressStatus) {
        bulkUrlsProgressStatus.textContent = `লিংক সেভ হচ্ছে... (${i + 1}/${total}) ${item.title}`;
      }
      const pct = Math.round(((i + 1) / total) * 100);
      if (bulkUrlsProgressPercent) bulkUrlsProgressPercent.textContent = `${pct}%`;
      if (bulkUrlsProgressFill) bulkUrlsProgressFill.style.width = `${pct}%`;

      const videoData = {
        videoId: vid,
        title: item.title,
        videoUrl: item.url,
        thumbUrl: '', // Auto-rendered as clean poster or frame on client
        isUploadedFile: false,
        category: batchCategory,
        duration: '03:30',
        active: true,
        views: 0,
        likes: 0,
        createdAt: Date.now() + i
      };

      if (!isLocalMode && db) {
        try {
          await db.ref(`videos/${vid}`).set(videoData);
        } catch (fbErr) {
          console.error("Firebase bulk url save error:", fbErr);
        }
      } else {
        adminVideos.unshift(videoData);
      }

      savedCount++;
    }

    if (isLocalMode || !db) {
      try {
        localStorage.setItem('rk_local_videos', JSON.stringify(adminVideos));
      } catch (storageErr) {
        console.warn("Storage warning:", storageErr);
      }
      renderAdminVideos();
      updateKpis();
    }

    isBulkProcessing = false;
    if (saveBulkUrlsBtn) saveBulkUrlsBtn.disabled = false;
    if (cancelBulkUrlsBtn) cancelBulkUrlsBtn.disabled = false;
    if (bulkUrlsTextarea) bulkUrlsTextarea.value = '';
    parseAndCountBulkUrls();
    showToast(`🎉 ${savedCount} টি ভিডিও লিংক সফলভাবে যুক্ত হয়েছে!`);
    closeBulkVideoModal();
  }

  function setupBulkVideoHandlers() {
    // Mode Switcher Tabs
    if (bulkTabFiles) {
      bulkTabFiles.addEventListener('click', () => setBulkTab('files'));
    }
    if (bulkTabUrls) {
      bulkTabUrls.addEventListener('click', () => setBulkTab('urls'));
    }

    // Modal open / close triggers
    if (addMultipleVideosBtn) {
      addMultipleVideosBtn.addEventListener('click', openBulkVideoModal);
    }
    if (switchToBulkModalBtn) {
      switchToBulkModalBtn.addEventListener('click', () => {
        closeVideoModal();
        openBulkVideoModal();
      });
    }
    if (closeBulkVideoModalBtn) {
      closeBulkVideoModalBtn.addEventListener('click', closeBulkVideoModal);
    }
    if (cancelBulkFilesBtn) {
      cancelBulkFilesBtn.addEventListener('click', closeBulkVideoModal);
    }
    if (cancelBulkUrlsBtn) {
      cancelBulkUrlsBtn.addEventListener('click', closeBulkVideoModal);
    }

    // Multi-File Dropzone & File Input
    if (bulkVideoDropZone && bulkVideoFilesInput) {
      bulkVideoDropZone.addEventListener('click', () => {
        bulkVideoFilesInput.click();
      });

      bulkVideoDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        bulkVideoDropZone.classList.add('dragover');
      });

      bulkVideoDropZone.addEventListener('dragleave', () => {
        bulkVideoDropZone.classList.remove('dragover');
      });

      bulkVideoDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        bulkVideoDropZone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleBulkSelectedFiles(e.dataTransfer.files);
        }
      });

      bulkVideoFilesInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleBulkSelectedFiles(e.target.files);
        }
      });
    }

    if (bulkClearQueueBtn) {
      bulkClearQueueBtn.addEventListener('click', clearBulkQueue);
    }

    if (saveBulkFilesBtn) {
      saveBulkFilesBtn.addEventListener('click', processAndSaveBulkFiles);
    }

    // URLs Mode Handlers
    if (bulkUrlsTextarea) {
      bulkUrlsTextarea.addEventListener('input', parseAndCountBulkUrls);
    }

    if (bulkUrlsSampleBtn) {
      bulkUrlsSampleBtn.addEventListener('click', () => {
        if (bulkUrlsTextarea) {
          bulkUrlsTextarea.value = [
            'বিগ বাক বানি HD ট্রেলার | https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            'এলিফ্যান্টস ড্রিম 4K সিনেমা | https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            'ফর বিগ কসমস ফিল্ম | https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
          ].join('\n');
          parseAndCountBulkUrls();
        }
      });
    }

    if (saveBulkUrlsBtn) {
      saveBulkUrlsBtn.addEventListener('click', processAndSaveBulkUrls);
    }
  }

  // ==========================================
  // SETTINGS & ADSTERRA
  // ==========================================
  function populateSettings(s) {
    if (!s) return;
    const currentName = s.siteName || 'RK VIDEO';
    if (settingSiteName) settingSiteName.value = currentName;
    if (adminHeaderBrand) adminHeaderBrand.textContent = currentName;
    document.title = currentName + " - অ্যাডমিন কন্ট্রোল প্যানেল";
    try {
      localStorage.setItem('rk_site_name', currentName);
    } catch(e) {}
    if (settingLiveBadgeText) settingLiveBadgeText.value = s.liveBadgeText || 'LIVE 4K';
    const settingWatermarkText = document.getElementById('settingWatermarkText');
    if (settingWatermarkText) settingWatermarkText.value = s.watermarkText || s.siteName || 'RK VIDEO';
    if (settingPrimaryColor) settingPrimaryColor.value = s.primaryColor || '#ff4500';
    if (settingPrimaryColorPicker) settingPrimaryColorPicker.value = s.primaryColor || '#ff4500';

    if (adsterraEnabledSwitch) adsterraEnabledSwitch.checked = s.adsterraEnabled !== false;
    if (adsterraBannerTop) adsterraBannerTop.value = s.adsterraBannerTop || '';
    if (adsterraBannerBottom) adsterraBannerBottom.value = s.adsterraBannerBottom || '';
    if (adsterraPopunder) adsterraPopunder.value = s.adsterraPopunder || '';
    if (adsterraSocialBar) adsterraSocialBar.value = s.adsterraSocialBar || '';
    if (adsterraSmartlink) adsterraSmartlink.value = s.adsterraSmartlink || '';
    if (adsterraSmartlinkText) adsterraSmartlinkText.value = s.adsterraSmartlinkText || '⚡ হাই স্পিড ডাউনলোড / ফুল HD লিংক';
    if (adsterraSmartlinkPlayer) adsterraSmartlinkPlayer.checked = s.adsterraSmartlinkPlayer !== false;
    if (adsterraSmartlinkFloating) adsterraSmartlinkFloating.checked = s.adsterraSmartlinkFloating !== false;

    if (adsterraMessageAdEnabled) adsterraMessageAdEnabled.checked = s.adsterraMessageAdEnabled !== false;
    if (adsterraMessageAdCode) adsterraMessageAdCode.value = s.adsterraMessageAdCode || '';
    if (adsterraMessageSender) adsterraMessageSender.value = s.adsterraMessageSender || '💬 (1) নতুন নোটিফিকেশন';
    if (adsterraMessageText) adsterraMessageText.value = s.adsterraMessageText || '🔥 আনকাট ফুল HD ভিডিও দেখতে ও দ্রুত ডাউনলোড করতে এখানে চাপুন...';
    if (adsterraMessageBtnText) adsterraMessageBtnText.value = s.adsterraMessageBtnText || 'ওপেন করুন ⚡';

    const antiAdblockEnabled = document.getElementById('antiAdblockEnabled');
    const adultAdsAlwaysActive = document.getElementById('adultAdsAlwaysActive');
    const adultAdsTriggerOnPlay = document.getElementById('adultAdsTriggerOnPlay');
    const antiAdblockNotice = document.getElementById('antiAdblockNotice');
    const adultDirectUrl = document.getElementById('adultDirectUrl');

    if (antiAdblockEnabled) antiAdblockEnabled.checked = s.antiAdblockEnabled !== false;
    if (adultAdsAlwaysActive) adultAdsAlwaysActive.checked = s.adultAdsAlwaysActive !== false;
    if (adultAdsTriggerOnPlay) adultAdsTriggerOnPlay.checked = s.adultAdsTriggerOnPlay !== false;
    if (antiAdblockNotice) antiAdblockNotice.checked = s.antiAdblockNotice !== false;
    if (adultDirectUrl) adultDirectUrl.value = s.adultDirectUrl || '';

    // 18+ Age Alert Settings
    const ageAlertEnabledSwitch = document.getElementById('ageAlertEnabledSwitch');
    const settingAgeAlertTitle = document.getElementById('settingAgeAlertTitle');
    const settingAgeAlertMessage = document.getElementById('settingAgeAlertMessage');
    const settingAgeConfirmBtn = document.getElementById('settingAgeConfirmBtn');
    const settingAgeExitBtn = document.getElementById('settingAgeExitBtn');

    if (ageAlertEnabledSwitch) ageAlertEnabledSwitch.checked = s.ageAlertEnabled !== false;
    if (settingAgeAlertTitle) settingAgeAlertTitle.value = s.ageAlertTitle || '⚠️ ১৮+ সতর্কতা ও বয়স যাচাই';
    if (settingAgeAlertMessage) settingAgeAlertMessage.value = s.ageAlertMessage || 'এই ওয়েবসাইটে ১৮+ কনটেন্ট বা প্রাপ্তবয়স্কদের উপযোগী বিনোদন রয়েছে। ওয়েবসাইটে প্রবেশ করতে হলে আপনার বয়স ১৮ বছর বা তার বেশি হতে হবে।';
    if (settingAgeConfirmBtn) settingAgeConfirmBtn.value = s.ageAlertConfirmBtn || '✅ আমি ১৮+ বছর বয়সী (প্রবেশ করুন)';
    if (settingAgeExitBtn) settingAgeExitBtn.value = s.ageAlertExitBtn || '❌ আমার বয়স ১৮ এর কম (বাহির হন)';
  }

  // Bottom Banner Quick Format Template Inserters
  const bottomTemplate300Btn = document.getElementById('bottomTemplate300Btn');
  const bottomTemplateNativeBtn = document.getElementById('bottomTemplateNativeBtn');
  const bottomTemplate728Btn = document.getElementById('bottomTemplate728Btn');
  const bottomTemplateCustomBtn = document.getElementById('bottomTemplateCustomBtn');

  if (bottomTemplate300Btn && adsterraBannerBottom) {
    bottomTemplate300Btn.addEventListener('click', () => {
      adsterraBannerBottom.value = `<script type="text/javascript">
\tatOptions = {
\t\t'key' : 'YOUR_300x250_ADSTERRA_KEY',
\t\t'format' : 'iframe',
\t\t'height' : 250,
\t\t'width' : 300,
\t\t'params' : {}
\t};
</script>
<script type="text/javascript" src="//www.topcreativeformat.com/YOUR_300x250_ADSTERRA_KEY/invoke.js"></script>`;
      showToast("300x250 বড় ব্যানার ফরম্যাট পেস্ট করা হয়েছে! 'YOUR_300x250_ADSTERRA_KEY' বদলে আপনার Adsterra কী দিন।");
    });
  }

  if (bottomTemplateNativeBtn && adsterraBannerBottom) {
    bottomTemplateNativeBtn.addEventListener('click', () => {
      adsterraBannerBottom.value = `<script async="async" data-cfasync="false" src="//pl12345678.profitablegatecpm.com/YOUR_NATIVE_KEY/invoke.js"></script>
<div id="container-YOUR_NATIVE_KEY"></div>`;
      showToast("Native 4x1 কার্ড ফরম্যাট পেস্ট করা হয়েছে! আপনার Adsterra Native স্ক্রিপ্ট দিন।");
    });
  }

  if (bottomTemplate728Btn && adsterraBannerBottom) {
    bottomTemplate728Btn.addEventListener('click', () => {
      adsterraBannerBottom.value = `<script type="text/javascript">
\tatOptions = {
\t\t'key' : 'YOUR_728x90_ADSTERRA_KEY',
\t\t'format' : 'iframe',
\t\t'height' : 90,
\t\t'width' : 728,
\t\t'params' : {}
\t};
</script>
<script type="text/javascript" src="//www.topcreativeformat.com/YOUR_728x90_ADSTERRA_KEY/invoke.js"></script>`;
      showToast("728x90 লিডারবোর্ড ব্যানার ফরম্যাট পেস্ট করা হয়েছে!");
    });
  }

  if (bottomTemplateCustomBtn && adsterraBannerBottom) {
    bottomTemplateCustomBtn.addEventListener('click', () => {
      const targetLink = (adsterraSmartlink && adsterraSmartlink.value) ? adsterraSmartlink.value : 'https://your-adult-direct-link.com';
      adsterraBannerBottom.value = `<div style="text-align:center; padding:16px; border-radius:12px; background:linear-gradient(135deg, #1e1b4b, #311042); border:1.5px solid #ec4899; box-shadow:0 8px 24px rgba(236,72,153,0.25); max-width:600px; margin:0 auto; width:100%;">
  <a href="${targetLink}" target="_blank" rel="noopener noreferrer" style="display:block; text-decoration:none; color:#fff;">
    <div style="display:inline-block; background:#e11d48; color:#fff; font-size:12px; font-weight:700; padding:3px 10px; border-radius:999px; margin-bottom:8px;">🔞 18+ VIP LIVE EXCLUSIVE</div>
    <div style="font-size:17px; font-weight:700; margin-bottom:6px; color:#f43f5e;">⚡ আনকাট ফুল HD ভিডিও ও সরাসরি ডাউনলোড লিংক</div>
    <div style="font-size:13px; color:#cbd5e1; margin-bottom:12px;">কোনো বাফারিং নেই • হাই স্পিড আল্ট্রা 4K স্ট্রিমিং</div>
    <span style="display:inline-block; background:linear-gradient(90deg, #f43f5e, #e11d48); color:#fff; font-weight:700; font-size:14px; padding:10px 28px; border-radius:8px; box-shadow:0 4px 14px rgba(225,29,72,0.4);">সরাসরি ওপেন করুন ▶</span>
  </a>
</div>`;
      showToast("কাস্টম প্রিমিয়াম ১৮+ ব্যানার ফরম্যাট পেস্ট করা হয়েছে!");
    });
  }

  if (settingPrimaryColorPicker && settingPrimaryColor) {
    settingPrimaryColorPicker.addEventListener('input', (e) => {
      settingPrimaryColor.value = e.target.value;
    });
    settingPrimaryColor.addEventListener('input', (e) => {
      settingPrimaryColorPicker.value = e.target.value;
    });
  }

  // Save Adsterra Settings
  if (adsterraForm) {
    adsterraForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const updatedAdsterra = {
        ...adminSettings,
        adsterraEnabled: adsterraEnabledSwitch.checked,
        adsterraBannerTop: (adsterraBannerTop.value || '').trim(),
        adsterraBannerBottom: (adsterraBannerBottom.value || '').trim(),
        adsterraPopunder: (adsterraPopunder.value || '').trim(),
        adsterraSocialBar: (adsterraSocialBar.value || '').trim(),
        adsterraSmartlink: (adsterraSmartlink ? adsterraSmartlink.value : '').trim(),
        adsterraSmartlinkText: (adsterraSmartlinkText ? adsterraSmartlinkText.value : '').trim() || '⚡ হাই স্পিড ডাউনলোড / ফুল HD লিংক',
        adsterraSmartlinkPlayer: adsterraSmartlinkPlayer ? adsterraSmartlinkPlayer.checked : true,
        adsterraSmartlinkFloating: adsterraSmartlinkFloating ? adsterraSmartlinkFloating.checked : true,
        adsterraMessageAdEnabled: adsterraMessageAdEnabled ? adsterraMessageAdEnabled.checked : true,
        adsterraMessageAdCode: (adsterraMessageAdCode ? adsterraMessageAdCode.value : '').trim(),
        adsterraMessageSender: (adsterraMessageSender ? adsterraMessageSender.value : '').trim() || '💬 (1) নতুন নোটিফিকেশন',
        adsterraMessageText: (adsterraMessageText ? adsterraMessageText.value : '').trim() || '🔥 আনকাট ফুল HD ভিডিও দেখতে ও দ্রুত ডাউনলোড করতে এখানে চাপুন...',
        adsterraMessageBtnText: (adsterraMessageBtnText ? adsterraMessageBtnText.value : '').trim() || 'ওপেন করুন ⚡',
        antiAdblockEnabled: document.getElementById('antiAdblockEnabled') ? document.getElementById('antiAdblockEnabled').checked : true,
        adultAdsAlwaysActive: document.getElementById('adultAdsAlwaysActive') ? document.getElementById('adultAdsAlwaysActive').checked : true,
        adultAdsTriggerOnPlay: document.getElementById('adultAdsTriggerOnPlay') ? document.getElementById('adultAdsTriggerOnPlay').checked : true,
        antiAdblockNotice: document.getElementById('antiAdblockNotice') ? document.getElementById('antiAdblockNotice').checked : true,
        adultDirectUrl: (document.getElementById('adultDirectUrl') ? document.getElementById('adultDirectUrl').value : '').trim(),
        ageAlertEnabled: document.getElementById('ageAlertEnabledSwitch') ? document.getElementById('ageAlertEnabledSwitch').checked : true,
        ageAlertTitle: (document.getElementById('settingAgeAlertTitle') ? document.getElementById('settingAgeAlertTitle').value : '').trim() || '⚠️ ১৮+ সতর্কতা ও বয়স যাচাই',
        ageAlertMessage: (document.getElementById('settingAgeAlertMessage') ? document.getElementById('settingAgeAlertMessage').value : '').trim() || 'এই ওয়েবসাইটে ১৮+ কনটেন্ট বা প্রাপ্তবয়স্কদের উপযোগী বিনোদন রয়েছে। ওয়েবসাইটে প্রবেশ করতে হলে আপনার বয়স ১৮ বছর বা তার বেশি হতে হবে।',
        ageAlertConfirmBtn: (document.getElementById('settingAgeConfirmBtn') ? document.getElementById('settingAgeConfirmBtn').value : '').trim() || '✅ আমি ১৮+ বছর বয়সী (প্রবেশ করুন)',
        ageAlertExitBtn: (document.getElementById('settingAgeExitBtn') ? document.getElementById('settingAgeExitBtn').value : '').trim() || '❌ আমার বয়স ১৮ এর কম (বাহির হন)'
      };

      if (!isLocalMode && db) {
        db.ref('settings').update(updatedAdsterra)
          .then(() => showToast("অ্যাডস্টেরা বিজ্ঞাপন সেটিংস সফলভাবে সংরক্ষিত হয়েছে!"))
          .catch(err => showToast("ত্রুটি: " + err.message));
      } else {
        localStorage.setItem('rk_local_settings', JSON.stringify(updatedAdsterra));
        adminSettings = updatedAdsterra;
        showToast("অ্যাডস্টেরা বিজ্ঞাপন সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
      }
    });
  }

  // Save Site Branding Settings (Dynamic Website Name)
  if (siteSettingsForm) {
    siteSettingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newSiteName = settingSiteName.value.trim() || 'RK VIDEO';
      const watermarkVal = (document.getElementById('settingWatermarkText') ? document.getElementById('settingWatermarkText').value.trim() : '') || newSiteName;
      const updatedSettings = {
        ...adminSettings,
        siteName: newSiteName,
        watermarkText: watermarkVal,
        liveBadgeText: settingLiveBadgeText.value.trim(),
        primaryColor: settingPrimaryColor.value.trim()
      };

      // Instantly update admin header brand and title
      if (adminHeaderBrand) {
        adminHeaderBrand.textContent = newSiteName;
      }
      document.title = newSiteName + " - অ্যাডমিন কন্ট্রোল প্যানেল";

      try {
        localStorage.setItem('rk_site_name', newSiteName);
        localStorage.setItem('rk_local_settings', JSON.stringify(updatedSettings));
      } catch (e) {}

      if (!isLocalMode && db) {
        db.ref('settings').update(updatedSettings)
          .then(() => showToast(`ওয়েবসাইটের নাম "${newSiteName}" সফলভাবে আপডেট হয়েছে!`))
          .catch(err => showToast("ত্রুটি: " + err.message));
      } else {
        adminSettings = updatedSettings;
        showToast(`ওয়েবসাইটের নাম "${newSiteName}" সফলভাবে আপডেট হয়েছে!`);
      }
    });
  }

  // Modal triggers
  if (addNewVideoBtn) addNewVideoBtn.addEventListener('click', () => openVideoModal());
  if (closeVideoModalBtn) closeVideoModalBtn.addEventListener('click', closeVideoModal);
  if (cancelVideoModalBtn) cancelVideoModalBtn.addEventListener('click', closeVideoModal);

  // Firebase Config Setup on Vercel
  const firebaseConfigForm = document.getElementById('firebaseConfigForm');
  const firebaseConfigInput = document.getElementById('firebaseConfigInput');
  const resetFirebaseConfigBtn = document.getElementById('resetFirebaseConfigBtn');
  const firebaseStatusBadge = document.getElementById('firebaseStatusBadge');

  function updateFirebaseBadge() {
    if (!firebaseStatusBadge) return;
    const projId = (window.RK_FIREBASE && window.RK_FIREBASE.config && window.RK_FIREBASE.config.projectId) || 'rk-portfolio-66771';
    if (!isLocalMode && db) {
      firebaseStatusBadge.textContent = `🟢 ফায়ারবেস সক্রিয় (${projId})`;
      firebaseStatusBadge.style.backgroundColor = '#dcfce7';
      firebaseStatusBadge.style.color = '#15803d';
    } else {
      firebaseStatusBadge.textContent = '🟡 লোকাল মোড (Local Fallback)';
      firebaseStatusBadge.style.backgroundColor = '#fef3c7';
      firebaseStatusBadge.style.color = '#92400e';
    }

    try {
      const saved = localStorage.getItem('rk_firebase_config');
      if (saved && firebaseConfigInput && !firebaseConfigInput.value) {
        firebaseConfigInput.value = saved;
      } else if (window.RK_FIREBASE && window.RK_FIREBASE.config && firebaseConfigInput && !firebaseConfigInput.value) {
        firebaseConfigInput.value = JSON.stringify(window.RK_FIREBASE.config, null, 2);
      }
    } catch (e) {}
  }

  if (firebaseConfigForm) {
    firebaseConfigForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let raw = (firebaseConfigInput.value || '').trim();
      if (!raw) return;

      try {
        if (raw.includes('{') && raw.includes('}')) {
          const start = raw.indexOf('{');
          const end = raw.lastIndexOf('}');
          raw = raw.substring(start, end + 1);
        }

        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (jsonErr) {
          parsed = (new Function(`return ${raw}`))();
        }

        if (parsed && (parsed.apiKey || parsed.databaseURL)) {
          localStorage.setItem('rk_firebase_config', JSON.stringify(parsed));
          showToast("🔥 ফায়ারবেস সফলভাবে সেভ হয়েছে! পেজ রিলোড হচ্ছে...");
          setTimeout(() => window.location.reload(), 1200);
        } else {
          showToast("অনুগ্রহ করে একটি সঠিক Firebase Config প্রদান করুন।");
        }
      } catch (err) {
        showToast("ত্রুটি: সঠিক JSON ফরম্যাট দিন।");
      }
    });
  }

  if (resetFirebaseConfigBtn) {
    resetFirebaseConfigBtn.addEventListener('click', () => {
      if (confirm("আপনি কি ফায়ারবেস কনফিগারেশন মুছে লোকাল মোডে ফেরত যেতে চান?")) {
        localStorage.removeItem('rk_firebase_config');
        showToast("ফায়ারবেস কনফিগারেশন রিসেট হয়েছে! পেজ রিলোড হচ্ছে...");
        setTimeout(() => window.location.reload(), 1000);
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupDirectVideoHandlers();
    setupBulkVideoHandlers();
    initAuth();
  });

})();
