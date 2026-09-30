/**
 * ============================================================================
 * RK VIDEO - Public Streaming App Logic
 * Mobile-First, Realtime Database Powered, Dynamic Categories & Dynamic Name
 * ============================================================================
 */

(function () {
  'use strict';

  // State Management
  let allVideos = [];
  let allCategories = [];
  let currentCategory = 'All';
  let searchQuery = '';
  let activeVideo = null;
  let isLocalMode = false;
  let db = null;
  const injectedScripts = new Set();

  // DOM Elements
  const videoGrid = document.getElementById('videoGrid');
  const videoEmptyState = document.getElementById('videoEmptyState');
  const videoCounter = document.getElementById('videoCounter');
  const searchContainer = document.getElementById('searchContainer');
  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const searchToggleBtn = document.getElementById('searchToggleBtn');
  const categoryChipsContainer = document.getElementById('categoryChipsContainer');
  const siteBrandName = document.getElementById('siteBrandName');
  const liveBadgeText = document.getElementById('liveBadgeText');
  const footerBrand = document.getElementById('footerBrand');
  const adsterraTopSlot = document.getElementById('adsterraTopSlot');
  const adsterraBottomSlot = document.getElementById('adsterraBottomSlot');

  // Adsterra Top Message Ad Elements
  const topMessageAdBar = document.getElementById('topMessageAdBar');
  const topMessageSender = document.getElementById('topMessageSender');
  const topMessageBody = document.getElementById('topMessageBody');
  const topMessageBtn = document.getElementById('topMessageBtn');
  const topMessageBtnText = document.getElementById('topMessageBtnText');
  const closeTopMessageBtn = document.getElementById('closeTopMessageBtn');

  // Player Elements
  const playerBackdrop = document.getElementById('playerModalBackdrop');
  const playerCloseBtn = document.getElementById('playerCloseBtn');
  const mainVideoPlayer = document.getElementById('mainVideoPlayer');
  const playerTitle = document.getElementById('playerTitle');
  const playerHeaderTitle = document.getElementById('playerHeaderTitle');
  const playerViewsCount = document.getElementById('playerViewsCount');
  const playerLikesCount = document.getElementById('playerLikesCount');
  const playerCategoryTag = document.getElementById('playerCategoryTag');
  const playerLikeBtn = document.getElementById('playerLikeBtn');
  const playerLikeBtnText = document.getElementById('playerLikeBtnText');
  const playerShareBtn = document.getElementById('playerShareBtn');

  // Controls & Extras
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIconSun = document.getElementById('themeIconSun');
  const themeIconMoon = document.getElementById('themeIconMoon');
  const backToTopBtn = document.getElementById('backToTopBtn');
  const toastContainer = document.getElementById('toastContainer');
  const bnavSearch = document.getElementById('bnavSearch');

  // Format number for display
  function formatNumber(num) {
    if (!num || isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
  }

  // Toast Notification
  function showToast(message, duration = 3000) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'opacity 0.25s, transform 0.25s';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  // Safe Direct Video & Cloud Storage URL Formatter
  function safeVideoUrl(url) {
    if (!url) return '';
    if (window.RK_FIREBASE && window.RK_FIREBASE.formatDirectVideoUrl) {
      return window.RK_FIREBASE.formatDirectVideoUrl(url);
    }
    if (window.RK_FIREBASE && window.RK_FIREBASE.formatDropboxUrl) {
      return window.RK_FIREBASE.formatDropboxUrl(url);
    }
    return url;
  }

  // Safely Render Adsterra Ad Snippets (executing script tags in isolated context to prevent document.write collisions)
  function renderAdSnippet(container, code) {
    if (!container) return;
    container.innerHTML = '';
    if (!code || !code.trim()) {
      container.style.display = 'none';
      return;
    }
    container.style.display = 'flex';

    try {
      // If code contains script tags (standard Adsterra atOptions + invoke.js)
      if (code.includes('<script')) {
        const iframe = document.createElement('iframe');
        iframe.style.border = 'none';
        iframe.style.overflow = 'hidden';
        iframe.style.width = '100%';
        iframe.style.minHeight = '70px';
        iframe.style.display = 'block';
        iframe.scrolling = 'no';
        iframe.setAttribute('loading', 'lazy');
        iframe.srcdoc = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                html, body {
                  margin: 0;
                  padding: 0;
                  background: transparent;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100%;
                }
              </style>
            </head>
            <body>
              ${code}
            </body>
          </html>
        `;
        container.appendChild(iframe);
      } else {
        container.innerHTML = code;
      }
    } catch (e) {
      console.warn("Error rendering Adsterra snippet:", e);
    }
  }

  // Safely Inject Global Adsterra Scripts (Popunder, Social Bar, In-Page Push)
  function injectGlobalAdScript(code, scriptId = '') {
    if (!code || !code.trim()) return;
    const key = scriptId || code.trim().substring(0, 80);
    if (injectedScripts.has(key)) return;
    injectedScripts.add(key);

    try {
      const temp = document.createElement('div');
      temp.innerHTML = code;

      Array.from(temp.childNodes).forEach(node => {
        if (node.tagName === 'SCRIPT') {
          const script = document.createElement('script');
          Array.from(node.attributes).forEach(attr => {
            script.setAttribute(attr.name, attr.value);
          });
          script.text = node.innerHTML;
          if (script.src && !script.hasAttribute('async')) {
            script.async = true;
          }
          document.head.appendChild(script);
        } else if (node.nodeType === 1) {
          document.body.appendChild(node.cloneNode(true));
        }
      });
    } catch (e) {
      console.warn("Error injecting global Adsterra script:", e);
    }
  }

  // Initialize Theme
  function initTheme() {
    const savedTheme = localStorage.getItem('rk_theme') || 'light';
    applyTheme(savedTheme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem('rk_theme', next);
      });
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      if (themeIconSun) themeIconSun.style.display = 'none';
      if (themeIconMoon) themeIconMoon.style.display = 'block';
    } else {
      if (themeIconSun) themeIconSun.style.display = 'block';
      if (themeIconMoon) themeIconMoon.style.display = 'none';
    }
  }

  // Initialize Firebase Data Listeners
  function initData() {
    const fbResult = window.RK_FIREBASE.initFirebase();
    isLocalMode = fbResult.isLocal;
    db = fbResult.db;

    if (!isLocalMode && db) {
      // 1. Listen for Videos (/videos)
      db.ref('videos').on('value', (snapshot) => {
        const val = snapshot.val();
        if (val) {
          allVideos = Object.keys(val).map(key => ({
            ...val[key],
            videoId: val[key].videoId || key
          }));
        } else {
          allVideos = [];
        }
        renderVideos();
      }, (err) => {
        console.error("Firebase videos fetch error:", err);
        loadLocalFallbackVideos();
      });

      // 2. Listen for Admin Categories (/categories)
      db.ref('categories').on('value', (snapshot) => {
        const val = snapshot.val();
        if (val) {
          allCategories = Object.keys(val).map(key => ({
            ...val[key],
            id: val[key].id || key
          }));
        } else {
          allCategories = [];
        }
        renderCategoryChips();
      }, (err) => {
        console.error("Firebase categories fetch error:", err);
        loadLocalFallbackCategories();
      });

      // 3. Listen for Site Settings & Adsterra (/settings)
      db.ref('settings').on('value', (snapshot) => {
        const settings = snapshot.val();
        if (settings) {
          applySiteSettings(settings);
        }
      });

    } else {
      // Local fallback mode
      loadLocalFallbackVideos();
      loadLocalFallbackCategories();
      loadLocalFallbackSettings();

      window.addEventListener('storage', (e) => {
        if (e.key === 'rk_local_videos') loadLocalFallbackVideos();
        if (e.key === 'rk_local_categories') loadLocalFallbackCategories();
        if (e.key === 'rk_local_settings') loadLocalFallbackSettings();
      });
    }
  }

  function loadLocalFallbackVideos() {
    try {
      const stored = localStorage.getItem('rk_local_videos');
      allVideos = stored ? JSON.parse(stored) : [];
    } catch (e) {
      allVideos = [];
    }
    renderVideos();
  }

  function loadLocalFallbackCategories() {
    try {
      const stored = localStorage.getItem('rk_local_categories');
      allCategories = stored ? JSON.parse(stored) : [];
    } catch (e) {
      allCategories = [];
    }
    renderCategoryChips();
  }

  function loadLocalFallbackSettings() {
    try {
      const stored = localStorage.getItem('rk_local_settings');
      if (stored) {
        applySiteSettings(JSON.parse(stored));
      }
    } catch (e) {}
  }

  // Dynamic Site Settings Application
  function applySiteSettings(settings) {
    if (!settings) return;

    // Website Name Update (Instantly reflected on Home, Menu, Footer, and Title)
    if (settings.siteName) {
      const newName = settings.siteName.trim();
      document.title = newName;
      if (siteBrandName) {
        siteBrandName.textContent = newName;
      }
      if (footerBrand) {
        footerBrand.textContent = newName;
      }
      const menuSiteBrand = document.getElementById('menuSiteBrand');
      if (menuSiteBrand) {
        menuSiteBrand.textContent = newName;
      }
      const drawerFooterBrand = document.getElementById('drawerFooterBrand');
      if (drawerFooterBrand) {
        drawerFooterBrand.textContent = newName;
      }
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', newName);

      try {
        localStorage.setItem('rk_site_name', newName);
      } catch (e) {}
    }

    // Live Badge Text
    if (settings.liveBadgeText && liveBadgeText) {
      liveBadgeText.textContent = settings.liveBadgeText;
    }

    // Primary Theme Color
    if (settings.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
    }

    // Apply Adsterra Ads if enabled
    const adsterraEnabled = settings.adsterraEnabled !== false;
    if (adsterraEnabled) {
      if (settings.adsterraBannerTop && adsterraTopSlot) {
        renderAdSnippet(adsterraTopSlot, settings.adsterraBannerTop);
      } else if (adsterraTopSlot) {
        adsterraTopSlot.style.display = 'none';
      }

      if (settings.adsterraBannerBottom && adsterraBottomSlot) {
        renderAdSnippet(adsterraBottomSlot, settings.adsterraBannerBottom);
      } else if (adsterraBottomSlot) {
        adsterraBottomSlot.style.display = 'none';
      }

      if (settings.adsterraPopunder) {
        injectGlobalAdScript(settings.adsterraPopunder, 'popunder');
      }
      if (settings.adsterraSocialBar) {
        injectGlobalAdScript(settings.adsterraSocialBar, 'socialbar');
      }
      if (settings.adsterraMessageAdCode) {
        injectGlobalAdScript(settings.adsterraMessageAdCode, 'messageadcode');
      }

      // Adsterra Top Message-Style Notification Bar
      const messageAdEnabled = settings.adsterraMessageAdEnabled !== false;
      const isMsgClosed = sessionStorage.getItem('rk_closed_msg_ad') === 'true';
      if (messageAdEnabled && !isMsgClosed && topMessageAdBar) {
        if (topMessageSender) topMessageSender.textContent = settings.adsterraMessageSender || '💬 (1) নতুন নোটিফিকেশন';
        if (topMessageBody) topMessageBody.textContent = settings.adsterraMessageText || '🔥 আনকাট ফুল HD ভিডিও দেখতে ও দ্রুত ডাউনলোড করতে এখানে চাপুন...';
        if (topMessageBtnText) topMessageBtnText.textContent = settings.adsterraMessageBtnText || 'ওপেন করুন ⚡';
        const targetUrl = settings.adsterraSmartlink || '#';
        if (topMessageBtn) {
          topMessageBtn.href = targetUrl;
          topMessageBtn.target = '_blank';
          topMessageBtn.rel = 'noopener noreferrer';
        }
        topMessageAdBar.style.display = 'block';
      } else if (topMessageAdBar) {
        topMessageAdBar.style.display = 'none';
      }
    } else {
      if (adsterraTopSlot) adsterraTopSlot.style.display = 'none';
      if (adsterraBottomSlot) adsterraBottomSlot.style.display = 'none';
      if (topMessageAdBar) topMessageAdBar.style.display = 'none';
    }
  }

  // Render Category Chips Dynamically
  function renderCategoryChips() {
    if (!categoryChipsContainer) return;

    let html = `<button class="category-chip ${currentCategory === 'All' ? 'active' : ''}" data-category="All">সব / All</button>`;

    if (allCategories && allCategories.length > 0) {
      html += allCategories.map(cat => {
        const catName = cat.name || cat;
        const isActive = currentCategory.toLowerCase() === catName.toLowerCase() ? 'active' : '';
        return `<button class="category-chip ${isActive}" data-category="${escapeHtml(catName)}">${escapeHtml(catName)}</button>`;
      }).join('');
    }

    categoryChipsContainer.innerHTML = html;
  }

  // Filter & Render Videos
  function renderVideos() {
    if (!videoGrid) return;

    let filtered = allVideos.filter(v => v.active !== false);

    // Filter by Category
    if (currentCategory && currentCategory !== 'All') {
      filtered = filtered.filter(v => {
        const cat = (v.category || '').toLowerCase().trim();
        const target = currentCategory.toLowerCase().trim();
        return cat === target || cat.includes(target) || target.includes(cat);
      });
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(v => {
        const titleMatch = (v.title || '').toLowerCase().includes(query);
        const catMatch = (v.category || '').toLowerCase().includes(query);
        return titleMatch || catMatch;
      });
    }

    // Sort by latest createdAt
    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (videoCounter) {
      videoCounter.textContent = `${filtered.length} টি ভিডিও`;
    }

    if (filtered.length === 0) {
      videoGrid.innerHTML = '';
      if (videoEmptyState) videoEmptyState.style.display = 'block';
      return;
    }

    if (videoEmptyState) videoEmptyState.style.display = 'none';

    videoGrid.innerHTML = filtered.map(v => {
      const formattedViews = formatNumber(v.views || 0);
      const formattedLikes = formatNumber(v.likes || 0);
      const thumb = v.thumbUrl || '';
      const duration = v.duration || '03:30';
      const rawUrl = v.videoUrl || '';
      const isIndexed = rawUrl.startsWith('indexeddb://');
      const safeUrl = isIndexed ? '' : safeVideoUrl(rawUrl);

      let mediaHtml = '';
      if (thumb) {
        mediaHtml = `
          <img 
            src="${escapeHtml(thumb)}" 
            alt="${escapeHtml(v.title || 'Video')}" 
            class="video-thumb" 
            loading="lazy" 
          />
        `;
      } else if (!isIndexed && safeUrl) {
        mediaHtml = `
          <video 
            class="video-thumb" 
            preload="metadata" 
            muted 
            playsinline 
            src="${escapeHtml(safeUrl)}#t=0.5"
          ></video>
        `;
      } else {
        mediaHtml = `
          <div class="video-thumb" style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1e293b, #0f172a); color: var(--color-primary);">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
        `;
      }

      return `
        <article class="video-card" data-id="${v.videoId}" tabindex="0" role="button" aria-label="${escapeHtml(v.title || '')}">
          <div class="video-thumb-wrap">
            ${mediaHtml}
            <span class="video-badge-hd">HD</span>
            <span class="video-badge-duration">${escapeHtml(duration)}</span>
            <div class="video-play-overlay">
              <div class="play-circle">
                <svg viewBox="0 0 24 24">
                  <polygon points="6 3 20 12 6 21 6 3"></polygon>
                </svg>
              </div>
            </div>
          </div>
          <div class="video-info">
            <h3 class="video-title">${escapeHtml(v.title || 'ভিডিওর শিরোনাম')}</h3>
            <div class="video-meta">
              <span class="video-views" title="মোট ভিউ">
                👁 ${formattedViews}
              </span>
              <span class="video-likes" title="মোট লাইক">
                👍 ${formattedLikes}
              </span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    videoGrid.querySelectorAll('.video-card').forEach(card => {
      card.addEventListener('click', () => {
        const vid = card.getAttribute('data-id');
        const found = allVideos.find(v => v.videoId === vid);
        if (found) {
          openVideoPlayer(found);
        }
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });
  }

  let activeVideoBlobUrl = null;

  // Open Video Player Modal
  async function openVideoPlayer(video) {
    if (!video || !playerBackdrop || !mainVideoPlayer) return;
    activeVideo = video;

    if (activeVideoBlobUrl) {
      URL.revokeObjectURL(activeVideoBlobUrl);
      activeVideoBlobUrl = null;
    }

    const rawUrl = video.videoUrl || '';
    if (rawUrl.startsWith('indexeddb://')) {
      const vidKey = rawUrl.replace('indexeddb://', '') || video.videoId;
      if (window.RK_INDEXED_DB) {
        const blob = await window.RK_INDEXED_DB.getVideoBlob(vidKey);
        if (blob) {
          activeVideoBlobUrl = URL.createObjectURL(blob);
          mainVideoPlayer.src = activeVideoBlobUrl;
        } else {
          showToast("ভিডিও ফাইলটি পাওয়া যায়নি।");
          return;
        }
      } else {
        showToast("ভিডিও স্টোরেজ পাওয়া যায়নি।");
        return;
      }
    } else {
      mainVideoPlayer.src = safeVideoUrl(rawUrl);
    }

    mainVideoPlayer.poster = video.thumbUrl || '';
    if (playerTitle) playerTitle.textContent = video.title || 'ভিডিওর শিরোনাম';
    if (playerHeaderTitle) playerHeaderTitle.textContent = video.title || 'ভিডিও প্লেয়ার';
    if (playerCategoryTag) playerCategoryTag.textContent = video.category || 'Viral';
    if (playerViewsCount) playerViewsCount.textContent = `👁 ${formatNumber(video.views || 0)} ভিউজ`;
    if (playerLikesCount) playerLikesCount.textContent = `👍 ${formatNumber(video.likes || 0)} লাইক`;

    const isLiked = localStorage.getItem(`rk_liked_${video.videoId}`) === 'true';
    updateLikeButtonUI(isLiked);

    playerBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';

    const playPromise = mainVideoPlayer.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn("Autoplay was prevented by browser policy or invalid URL:", err);
      });
    }

    incrementViewCount(video.videoId);
  }

  // Close Video Player Modal
  function closeVideoPlayer() {
    if (!playerBackdrop || !mainVideoPlayer) return;
    mainVideoPlayer.pause();
    if (activeVideoBlobUrl) {
      URL.revokeObjectURL(activeVideoBlobUrl);
      activeVideoBlobUrl = null;
    }
    mainVideoPlayer.src = '';
    playerBackdrop.classList.remove('open');
    document.body.style.overflow = '';
    activeVideo = null;
  }

  // Increment Views Count
  function incrementViewCount(videoId) {
    if (!videoId) return;

    if (!isLocalMode && db) {
      const viewsRef = db.ref(`videos/${videoId}/views`);
      viewsRef.transaction((currentViews) => {
        return (currentViews || 0) + 1;
      }, (error, committed, snapshot) => {
        if (!error && committed && snapshot) {
          const newViews = snapshot.val();
          if (activeVideo && activeVideo.videoId === videoId && playerViewsCount) {
            playerViewsCount.textContent = `👁 ${formatNumber(newViews)} ভিউজ`;
          }
        }
      });
    } else {
      const idx = allVideos.findIndex(v => v.videoId === videoId);
      if (idx !== -1) {
        allVideos[idx].views = (allVideos[idx].views || 0) + 1;
        localStorage.setItem('rk_local_videos', JSON.stringify(allVideos));
        if (playerViewsCount) {
          playerViewsCount.textContent = `👁 ${formatNumber(allVideos[idx].views)} ভিউজ`;
        }
        renderVideos();
      }
    }
  }

  // Handle Like Button Click
  function handleLike() {
    if (!activeVideo) return;
    const videoId = activeVideo.videoId;
    const key = `rk_liked_${videoId}`;
    const alreadyLiked = localStorage.getItem(key) === 'true';

    if (alreadyLiked) {
      showToast("আপনি ইতোমধ্যে এই ভিডিওতে লাইক দিয়েছেন!");
      return;
    }

    localStorage.setItem(key, 'true');
    updateLikeButtonUI(true);

    if (!isLocalMode && db) {
      const likesRef = db.ref(`videos/${videoId}/likes`);
      likesRef.transaction((currentLikes) => {
        return (currentLikes || 0) + 1;
      }, (error, committed, snapshot) => {
        if (!error && committed && snapshot) {
          const newLikes = snapshot.val();
          if (playerLikesCount) {
            playerLikesCount.textContent = `👍 ${formatNumber(newLikes)} লাইক`;
          }
          showToast("ভিডিওতে লাইক দেওয়ার জন্য ধন্যবাদ! ❤️");
        }
      });
    } else {
      const idx = allVideos.findIndex(v => v.videoId === videoId);
      if (idx !== -1) {
        allVideos[idx].likes = (allVideos[idx].likes || 0) + 1;
        localStorage.setItem('rk_local_videos', JSON.stringify(allVideos));
        if (playerLikesCount) {
          playerLikesCount.textContent = `👍 ${formatNumber(allVideos[idx].likes)} লাইক`;
        }
        renderVideos();
        showToast("ভিডিওতে লাইক দেওয়ার জন্য ধন্যবাদ! ❤️");
      }
    }
  }

  function updateLikeButtonUI(liked) {
    if (!playerLikeBtn) return;
    if (liked) {
      playerLikeBtn.classList.add('liked');
      if (playerLikeBtnText) playerLikeBtnText.textContent = 'লাইকড';
    } else {
      playerLikeBtn.classList.remove('liked');
      if (playerLikeBtnText) playerLikeBtnText.textContent = 'লাইক';
    }
  }

  // Handle Share / Copy Link
  function handleShare() {
    if (!activeVideo) return;
    const shareUrl = window.location.origin + window.location.pathname + '#video=' + activeVideo.videoId;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast("ভিডিওর লিংক কপি করা হয়েছে!");
      }).catch(() => {
        prompt("ভিডিওর লিংক কপি করুন:", shareUrl);
      });
    } else {
      prompt("ভিডিওর লিংক কপি করুন:", shareUrl);
    }
  }

  // Category Filtering Setup
  function setupCategories() {
    if (!categoryChipsContainer) return;
    categoryChipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.category-chip');
      if (!chip) return;

      categoryChipsContainer.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      currentCategory = chip.getAttribute('data-category') || 'All';
      renderVideos();
    });
  }

  // Search Setup
  function setupSearch() {
    if (searchToggleBtn && searchContainer) {
      searchToggleBtn.addEventListener('click', () => {
        const isOpen = searchContainer.classList.toggle('open');
        searchToggleBtn.classList.toggle('active', isOpen);
        if (isOpen && searchInput) {
          searchInput.focus();
        }
      });
    }

    if (bnavSearch) {
      bnavSearch.addEventListener('click', () => {
        if (searchContainer) {
          searchContainer.classList.add('open');
          if (searchToggleBtn) searchToggleBtn.classList.add('active');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          if (searchInput) searchInput.focus();
        }
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (searchClearBtn) {
          searchClearBtn.classList.toggle('visible', searchQuery.length > 0);
        }
        renderVideos();
      });
    }

    if (searchClearBtn && searchInput) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClearBtn.classList.remove('visible');
        renderVideos();
        searchInput.focus();
      });
    }
  }

  // Back to Top and Scroll Helpers
  function setupScroll() {
    window.addEventListener('scroll', () => {
      if (!backToTopBtn) return;
      if (window.scrollY > 280) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // Video Error Handler
  function setupPlayerEvents() {
    if (playerCloseBtn) playerCloseBtn.addEventListener('click', closeVideoPlayer);

    if (playerBackdrop) {
      playerBackdrop.addEventListener('click', (e) => {
        if (e.target === playerBackdrop) {
          closeVideoPlayer();
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && playerBackdrop && playerBackdrop.classList.contains('open')) {
        closeVideoPlayer();
      }
    });

    if (playerLikeBtn) playerLikeBtn.addEventListener('click', handleLike);
    if (playerShareBtn) playerShareBtn.addEventListener('click', handleShare);

    if (mainVideoPlayer) {
      mainVideoPlayer.addEventListener('error', (e) => {
        console.error("Video player error:", e);
        showToast("ভিডিওটি বর্তমানে পাওয়া যাচ্ছে না।");
      });
    }
  }

  function checkUrlHash() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#video=')) {
      const vid = hash.replace('#video=', '');
      const found = allVideos.find(v => v.videoId === vid);
      if (found) {
        setTimeout(() => openVideoPlayer(found), 400);
      }
    }
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

  // Setup Side Menu Drawer (Admin link accessible in menu)
  function setupMenuDrawer() {
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const bnavMenuBtn = document.getElementById('bnavMenuBtn');
    const menuCloseBtn = document.getElementById('menuCloseBtn');
    const menuBackdrop = document.getElementById('menuBackdrop');
    const siteMenuDrawer = document.getElementById('siteMenuDrawer');
    const menuHomeLink = document.getElementById('menuHomeLink');
    const menuCategoriesLink = document.getElementById('menuCategoriesLink');
    const menuSearchBtn = document.getElementById('menuSearchBtn');
    const menuThemeToggleBtn = document.getElementById('menuThemeToggleBtn');

    function openMenu() {
      if (menuBackdrop) menuBackdrop.classList.add('open');
      if (siteMenuDrawer) siteMenuDrawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      if (menuBackdrop) menuBackdrop.classList.remove('open');
      if (siteMenuDrawer) siteMenuDrawer.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (menuToggleBtn) menuToggleBtn.addEventListener('click', openMenu);
    if (bnavMenuBtn) bnavMenuBtn.addEventListener('click', openMenu);
    if (menuCloseBtn) menuCloseBtn.addEventListener('click', closeMenu);
    if (menuBackdrop) menuBackdrop.addEventListener('click', closeMenu);

    if (menuHomeLink) {
      menuHomeLink.addEventListener('click', () => {
        closeMenu();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    if (menuCategoriesLink) {
      menuCategoriesLink.addEventListener('click', () => {
        closeMenu();
      });
    }

    if (menuSearchBtn) {
      menuSearchBtn.addEventListener('click', () => {
        closeMenu();
        if (searchContainer) {
          searchContainer.classList.add('open');
          if (searchToggleBtn) searchToggleBtn.classList.add('active');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          if (searchInput) searchInput.focus();
        }
      });
    }

    if (menuThemeToggleBtn) {
      menuThemeToggleBtn.addEventListener('click', () => {
        if (themeToggleBtn) themeToggleBtn.click();
      });
    }
  }

  // Pre-load Cached Site Branding before network
  function preLoadSiteBranding() {
    try {
      const cachedSettings = localStorage.getItem('rk_local_settings');
      if (cachedSettings) {
        applySiteSettings(JSON.parse(cachedSettings));
      }
      const cachedName = localStorage.getItem('rk_site_name');
      if (cachedName) {
        document.title = cachedName;
        if (siteBrandName) siteBrandName.textContent = cachedName;
        if (footerBrand) footerBrand.textContent = cachedName;
      }
    } catch (e) {}

    // Listen to changes from Admin Panel in other tabs or sessions
    window.addEventListener('storage', (e) => {
      if (e.key === 'rk_local_settings' && e.newValue) {
        try {
          applySiteSettings(JSON.parse(e.newValue));
        } catch (err) {}
      }
      if (e.key === 'rk_site_name' && e.newValue) {
        document.title = e.newValue;
        if (siteBrandName) siteBrandName.textContent = e.newValue;
        if (footerBrand) footerBrand.textContent = e.newValue;
      }
    });
  }

  // Top Message Ad Events
  function setupTopMessageAdEvents() {
    if (closeTopMessageBtn) {
      closeTopMessageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (topMessageAdBar) topMessageAdBar.style.display = 'none';
        sessionStorage.setItem('rk_closed_msg_ad', 'true');
      });
    }

    if (topMessageAdBar) {
      topMessageAdBar.addEventListener('click', (e) => {
        if (e.target && (e.target.id === 'closeTopMessageBtn' || e.target.closest('#closeTopMessageBtn'))) {
          return;
        }
        if (topMessageBtn && topMessageBtn.href && topMessageBtn.href !== '#' && !topMessageBtn.href.endsWith('#')) {
          window.open(topMessageBtn.href, '_blank', 'noopener,noreferrer');
        }
      });
    }
  }

  // Init App on DOM Loaded
  document.addEventListener('DOMContentLoaded', () => {
    preLoadSiteBranding();
    initTheme();
    setupTopMessageAdEvents();
    setupCategories();
    setupSearch();
    setupMenuDrawer();
    setupScroll();
    setupPlayerEvents();
    initData();
    checkUrlHash();
  });

})();
