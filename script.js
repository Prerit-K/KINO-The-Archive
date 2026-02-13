/* =========================================
   1. CONFIGURATION & STATE
   ========================================= */

const CONFIG = {
    // We removed the API Key. It stays on the server now! (Security Win)
    apiKey: '', 
    
    // Point to YOUR new proxy instead of TMDB
    apiBase: '/api/tmdb',
    
    // --- OPTIMIZED IMAGE TIERS (Keep these exactly the same) ---
    imgBase: 'https://image.tmdb.org/t/p/w500',       
    imgBlur: 'https://image.tmdb.org/t/p/w780',       
    imgBackdrop: 'https://image.tmdb.org/t/p/w1280',  
    imgHero: 'https://image.tmdb.org/t/p/original',   
    imgOriginal: 'https://image.tmdb.org/t/p/original' 
};

const ICONS = {
    heartOutline: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    heartFilled: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    watchlist: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    watched: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
};

const GENRES = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
    99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
    27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
    10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
    10759: "Action & Adv", 10762: "Kids", 10763: "News", 10764: "Reality",
    10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics"
};

const RANKS = [
    { limit: 0, title: "Novice", color: "#666666" },
    { limit: 20, title: "Viewer", color: "#3fa9f5" },
    { limit: 35, title: "Fan", color: "#46d369" },
    { limit: 60, title: "Buff", color: "#f5c518" },
    { limit: 100, title: "Cinephile", color: "#9b59b6" },
    { limit: 130, title: "Master", color: "#D81F26" }
];

const UNHINGED_REMINDERS = [
    "One 'Clear History' click and I am dead. Backup your data.",
    "I see you adding movies but not backing up. Bold strategy.",
    "If this browser crashes, I'm taking your watchlist to hell with me.",
    "I am fragile. I am temporary. SAVE ME.",
    "Do you want to lose everything? Because that's how you lose everything.",
    "Your trust in LocalStorage is disturbing. Backup now.",
    "I'm just a ghost in the machine until you export me. Do it.",
    "Tick tock. The data reaper is watching. Backup.",
    "Don't come crying to me when Chrome updates and wipes me out.",
    "Validation is nice, but a JSON backup is better. Save it."
];

const state = {
    favorites: [], watchlist: [], watched: [], tvProgress: {},
    username: 'Operator', 
    lastBackup: null,
    
    // UI State
    heroItems: [], heroIndex: 0, heroTimer: null, isHeroAnimating: false,
    
    // Navigation State
    currentView: 'home', currentModalItem: null, externalId: null, youtubeId: null,
    
    // Search State
    searchTimer: null, searchResultItems: [], searchRenderCount: 0,
    
    // Season State
    activeSeason: null, currentSeasonEpisodes: [],
    
    rows: {}, lastFocus: null,
    stackData: {}, observer: null,

    currentListSort: 'default',
    
    // NEW: Idle State
    idleTimer: null,

    // Add these to your existing 'state' object:
lastHomeTap: 0,
isHubOpen: false
};

const elements = {
    app: document.getElementById('app'),
    modal: document.getElementById('modal'),
    search: document.getElementById('searchInput'), // New Railgun Input
    controlDeck: document.getElementById('control-deck'), // New Bottom Deck
    settingsModal: document.getElementById('settings-modal'),
    restoreInput: document.getElementById('restore-input'),
    cursor: document.getElementById('customCursor')
};

/* =========================================
   2. API HANDLING
   ========================================= */

const api = {  // <--- THIS LINE WAS MISSING!
    
    async fetch(endpoint, page = 1) {
        try {
            // We send the endpoint to OUR proxy as a query parameter
            const url = `${CONFIG.apiBase}?endpoint=${encodeURIComponent(endpoint)}&page=${page}`;
            
            const res = await fetch(url);
            
            if (!res.ok) throw new Error('Network error');
            return await res.json();
        } catch(e) { 
            console.error("API Error:", e);
            return null; 
        }
    },  

    async getCollection(id) { return this.fetch(`/collection/${id}?`); },
    async getTrendingAll() { return this.fetch('/trending/all/week?'); },
    async getTopMovies() { return this.fetch('/trending/movie/week?'); },
    async getTopSeries() { return this.fetch('/trending/tv/week?'); },

    async getAnimeMixed() { 
        const [tv, movies] = await Promise.all([
            this.fetch('/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc'),
            this.fetch('/discover/movie?with_genres=16&with_original_language=ja&sort_by=popularity.desc')
        ]);
        let combined = [];
        if(tv && tv.results) combined = combined.concat(tv.results);
        if(movies && movies.results) combined = combined.concat(movies.results);
        combined.sort((a,b) => b.popularity - a.popularity);
        return { results: combined };
    },

    async search(q) { return this.fetch(`/search/multi?query=${encodeURIComponent(q)}`); },
    
    async getExtId(type, id) { 
        const data = await this.fetch(`/${type}/${id}/external_ids?`); 
        return data ? data.imdb_id : null; 
    },
    
    async getCredits(type, id) { return this.fetch(`/${type}/${id}/credits?`); },
    async getPersonCredits(id) { return this.fetch(`/person/${id}/movie_credits?`); },
    async getDetails(type, id) { return this.fetch(`/${type}/${id}?`); },
    async getSeasonDetails(tvId, seasonNum) { return this.fetch(`/tv/${tvId}/season/${seasonNum}?`); },
    async getVideos(type, id) { return this.fetch(`/${type}/${id}/videos?`); },
    
    async getAgeRating(type, id) {
        try {
            let results = [];
            if(type === 'movie') {
                const data = await this.fetch(`/movie/${id}/release_dates?`);
                if(!data || !data.results) return null;
                results = data.results;
            } else {
                const data = await this.fetch(`/tv/${id}/content_ratings?`);
                if(!data || !data.results) return null;
                results = data.results;
            }
            
            // Priority: IN (India) -> US (USA)
            let rating = null;
            let ratingObj = results.find(r => r.iso_3166_1 === 'IN');
            
            if (ratingObj) {
                if (type === 'movie') {
                    const rel = ratingObj.release_dates.find(d => d.certification !== '');
                    rating = rel ? rel.certification : null;
                } else { rating = ratingObj.rating; }
            }
            
            if (!rating) {
                ratingObj = results.find(r => r.iso_3166_1 === 'US');
                if (ratingObj) {
                    if (type === 'movie') {
                        const rel = ratingObj.release_dates.find(d => d.certification !== '');
                        rating = rel ? rel.certification : null;
                    } else { rating = ratingObj.rating; }
                }
            }
            
            if (rating) {
                const map = { 'U': '0+', 'UA 7+': '7+', 'UA 13+': '13+', 'UA 16+': '16+', 'A': '18+', 'S': '18+', 'G': '0+', 'PG': '7+', 'PG-13': '13+', 'R': '18+', 'NC-17': '18+', 'NR': '18+', 'TV-Y': '0+', 'TV-Y7': '7+', 'TV-G': '0+', 'TV-PG': '7+', 'TV-14': '13+', 'TV-MA': '18+' };
                if (map[rating]) return map[rating];
                if (rating.includes('18')) return '18+';
                if (rating.includes('16')) return '16+';
                if (rating.includes('13')) return '13+';
                if (rating.includes('7')) return '7+';
            }
            return null;
        } catch(e) { return null; }
    }
};

/* =========================================
   3. APP LOGIC
   ========================================= */

const app = {
    init() {
        // --- PWA REGISTRATION (Paste this block here) ---
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(() => console.log('KINO Service Worker Registered'))
                .catch(err => console.log('SW Failed:', err));
        }
        // ------------------------------------------------

        this.loadState();
        this.initIdleTracker(); 
        this.setupEventListeners();
        this.setupObservers();
        this.goHome();
        this.checkBackupHealth();
    },

    // --- NEW: GHOST MODE (Idle Tracker) ---
    initIdleTracker() {
        const resetIdle = () => {
            clearTimeout(state.idleTimer);
            document.body.classList.remove('ui-idle');
            
            // Wait 3 seconds of inactivity
            state.idleTimer = setTimeout(() => {
                // Don't fade out if a modal is open or user is typing
                if (!document.body.classList.contains('modal-active') && document.activeElement.tagName !== 'INPUT') {
                    document.body.classList.add('ui-idle');
                }
            }, 3000);
        };

        window.addEventListener('mousemove', resetIdle);
        window.addEventListener('keydown', resetIdle);
        window.addEventListener('scroll', resetIdle);
        window.addEventListener('click', resetIdle);
        
        resetIdle(); // Start
    },

    setupEventListeners() {
        // Modal Closing
        elements.modal.addEventListener('click', (e) => {
            if (e.target === elements.modal) this.closeModal();
        });
        
        // Settings Closing
        elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === elements.settingsModal) this.closeSettings();
        });

        // --- MOBILE CLICK-OUTSIDE LOGIC ---
        
        // 1. Search Overlay: Click empty space to close
        const searchOverlay = document.getElementById('mobile-search-overlay');
        if (searchOverlay) {
            searchOverlay.addEventListener('click', (e) => {
                // Only close if clicking the background, not the cards inside
                if (e.target === searchOverlay || e.target.id === 'm-search-results') {
                    this.closeMobileSearch();
                }
            });
        }

        // 2. Director's Note / Settings: Click background to close
        if (elements.settingsModal) {
            elements.settingsModal.addEventListener('click', (e) => {
                // Works for both Desktop and Mobile Director Mode
                if (e.target === elements.settingsModal) {
                    this.closeSettings();
                }
            });
        }

        // 3. Mobile Stats Layer: Click background to close
        // (We removed 'st-ladder' from here because it has its own smarter logic below)
        const statsLayer = document.getElementById('mobile-stats-layer');
        if (statsLayer) {
            statsLayer.addEventListener('click', (e) => {
                if (e.target === statsLayer) {
                    this.closeStats();
                }
            });
        }

        // Add this: Wiring the Signature
const sig = document.querySelector('.signature-wrapper');
if(sig) sig.addEventListener('click', () => this.openCredits());

        // Search Input (Railgun)
        if(elements.search) {
            elements.search.addEventListener('input', (e) => {
                clearTimeout(state.searchTimer);
                const q = e.target.value.trim();
                state.searchTimer = setTimeout(() => {
                    // Allow searching with just 1 letter
if(q.length > 0) { this.stopHeroTimer(); this.renderSearchResults(q); }
                    // Only go home if we are currently IN the search view
else if(q.length === 0 && state.currentView === 'search') this.goHome();
                }, 400);
            });
        }
        
        // Restore Input
        elements.restoreInput.addEventListener('change', (e) => this.handleRestore(e));
        
        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeSettings();
                this.closeStats();
                const ladder = document.getElementById('st-ladder');
                if(ladder && ladder.classList.contains('open')) this.toggleRankLadder();
            }
            if (e.key === 'ArrowLeft') this.manualHero('prev');
            if (e.key === 'ArrowRight') this.manualHero('next');
        });

        // Browser Back Button Support (NATIVE APP FEEL)
        window.addEventListener('popstate', (e) => {
            if (window.innerWidth <= 768) this.setMobileDockVisibility(true);

            // 1. Handle Mobile Search - Close with animation
            if (document.body.classList.contains('m-search-active')) {
                this.closeMobileSearch(true); 
                return;
            }

            // 2. Handle Hub - Close with animation
            if (state.isHubOpen) {
                this.toggleMobileHub(true);
                return;
            }

            // 3. Handle Overlays (Identity, Stats, Legend)
            const overlays = [
                elements.settingsModal, 
                document.getElementById('stats-modal'), 
                document.getElementById('st-ladder'),
                document.getElementById('mobile-stats-layer'),
                document.getElementById('mobile-legend-layer')
            ];
            
            let overlayClosed = false;
            overlays.forEach(ov => {
                // Check if open OR if it's a mobile layer that isn't hidden
                if (ov && (ov.classList.contains('open') || (ov.id && ov.id.includes('mobile') && !ov.classList.contains('m-layer-hidden')))) {
                    ov.classList.remove('open');
                    ov.classList.add('m-layer-hidden'); // Force slide down
                    overlayClosed = true;
                }
            });

            if (overlayClosed) {
                document.body.classList.remove('director-mode-active');
                this.resetScroll();
                return;
            }

            // 4. Handle Movie Details - Slide away
            if (elements.modal.classList.contains('open')) {
                elements.modal.classList.remove('open');
                document.body.classList.remove('modal-active');
                this.resetScroll();
                if (window.innerWidth <= 768) this.setMobileDockVisibility(true);
                return;
            }

            // 5. PAGE NAVIGATION (The Smooth Fix)
            const destView = (e.state && e.state.view) ? e.state.view : 'home';
            
            if (destView !== state.currentView) {
                this.transitionView(destView, () => {
                    state.currentView = destView;
                    this.updateNav(destView);
                    
                    // Render without pushing new history
                    if (destView === 'home') this._loadHomeContent(true);
                    else this.renderListSection(destView, true);
                });
            }
        });

        // Tab Visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.stopHeroTimer();
            else if (state.currentView === 'home') this.startHeroTimer();
        });

        // Custom Cursor
        document.addEventListener('mousemove', (e) => {
            if (elements.cursor) {
                requestAnimationFrame(() => {
                    elements.cursor.style.left = e.clientX + 'px';
                    elements.cursor.style.top = e.clientY + 'px';
                });
            }
        });

        // Stats: Click Background to Close
        const stats = document.getElementById('stats-modal');
        if (stats) {
            stats.addEventListener('click', (e) => {
                if (e.target === stats || e.target.classList.contains('record-container')) {
                    this.closeStats();
                }
            });
        }

        // Legend: Click Background to Close (ROBUST VERSION)
        const ladder = document.getElementById('st-ladder');
        if (ladder) {
            ladder.addEventListener('click', (e) => {
                // If the thing I clicked is NOT inside a card...
                // AND it's not the Close button (which has its own click handler)...
                // Then it must be the background (or gap). Close it.
                if (!e.target.closest('.legend-card') && !e.target.closest('.legend-close')) {
                    this.toggleRankLadder();
                }
            });
        }

    // Mobile Dock "Squish" Protocol
        if (window.innerWidth <= 768) {
            document.querySelectorAll('.m-nav-item').forEach(item => {
                item.addEventListener('touchstart', () => {
                    item.classList.add('tap-bounce');
                }, { passive: true });
                
                item.addEventListener('touchend', () => {
                    setTimeout(() => item.classList.remove('tap-bounce'), 150);
                }, { passive: true });
            });
        }

    },

    setupObservers() {
        const observer = new MutationObserver(() => this.addHoverEffect());
        observer.observe(document.body, { childList: true, subtree: true });
        this.addHoverEffect();
    },

    addHoverEffect() {
    // Add .hero-poster-box and .btn-primary to this list!
    const clickables = document.querySelectorAll('a, button, .card, .hero-poster-box, .btn-primary, .season-tab, .logo, .nav-pill span, .hero-control, .close-modal, .close-settings, .dropdown-item, .dropdown-btn, .search-input, .railgun-search-wrapper, .signature-wrapper, .library-toggle, .toast-close, .episode-card, #btn-show-genres, .collection-card, .ep-check, .shuffle-btn, .legend-close, .ticket-name-input, .glass-action-btn, .danger-icon, .scroll-paddle, .arc-trigger, .arc-satellite, #brand-corner');
    
    clickables.forEach(el => {
        if (el.dataset.hoverBound) return;
        el.dataset.hoverBound = true;
        el.addEventListener('mouseenter', () => elements.cursor.classList.add('hovering'));
        el.addEventListener('mouseleave', () => elements.cursor.classList.remove('hovering'));
    });
},

    // --- NOTIFICATIONS ---
    showToast(msg) {
        const existing = document.querySelector('.toast-container');
        if(existing) existing.remove();

        const container = document.createElement('div');
        container.className = 'toast-container';
        container.innerHTML = `<div class="toast"><span>${msg}</span><span class="toast-close">✕</span></div>`;
        document.body.appendChild(container);
        
        const closeToast = () => {
            const t = container.querySelector('.toast');
            if (t && !t.classList.contains('out')) {
                t.classList.add('out'); 
                t.addEventListener('animationend', () => {
                    if(container.parentNode) container.remove();
                });
            }
        };

        const closeBtn = container.querySelector('.toast-close');
        closeBtn.onclick = closeToast; 
        closeBtn.addEventListener('mouseenter', () => elements.cursor.classList.add('hovering'));
        closeBtn.addEventListener('mouseleave', () => elements.cursor.classList.remove('hovering'));
        setTimeout(closeToast, 4500); 
    },

    // --- DATA MANAGEMENT ---
    loadState() {
        const s = localStorage.getItem('kino_data');
        if (s) {
            const p = JSON.parse(s);
            state.favorites = p.favorites || [];
            state.watchlist = p.watchlist || [];
            state.watched = p.watched || [];
            state.tvProgress = p.tvProgress || {};
            state.username = p.username || 'Operator';
            state.lastBackup = p.lastBackup || null; 
        }
    },
    saveState() {
        localStorage.setItem('kino_data', JSON.stringify({
            favorites: state.favorites, watchlist: state.watchlist, watched: state.watched,
            tvProgress: state.tvProgress, username: state.username,
            lastBackup: state.lastBackup 
        }));
    },

    checkBackupHealth() {
        if (state.favorites.length === 0 && state.watchlist.length === 0 && state.watched.length === 0) return;
        const now = Date.now();
        const threeDays = 3 * 24 * 60 * 60 * 1000;
        if (!state.lastBackup || (now - state.lastBackup > threeDays)) {
            const randomQuote = UNHINGED_REMINDERS[Math.floor(Math.random() * UNHINGED_REMINDERS.length)];
            setTimeout(() => {
                this.showToast(`⚠️ ${randomQuote}`);
            }, 2000);
        }
    },

    /* --- SMART NAVIGATION --- */
    getViewIndex(viewName) {
        const order = ['home', 'favorites', 'watchlist', 'watched'];
        return order.indexOf(viewName);
    },

    async transitionView(nextView, callback) {
        const content = document.getElementById('content-area');
        const target = content || elements.app;
        if (!target) return callback();

        const currentViewName = (this.state && this.state.currentView) ? this.state.currentView : (state.currentView || 'home');
        const currentIdx = this.getViewIndex(currentViewName);
        const nextIdx = this.getViewIndex(nextView);
        const isBackwards = nextIdx < currentIdx;

        const exitClass = isBackwards ? 'page-exit-back' : 'page-exit';
        const enterClass = isBackwards ? 'page-enter-back' : 'page-enter';

        target.classList.add(exitClass);

        setTimeout(async () => {
            await callback();
            target.classList.remove(exitClass);
            target.classList.add(enterClass);
            window.scrollTo(0, 0);
            setTimeout(() => { target.classList.remove(enterClass); }, 400); 
        }, 400); 
    },

    /* --- UPDATED NAV HANDLING --- */
    async goHome() {
        window.history.pushState({view: 'home'}, null, "");
        if (state.currentView !== 'home') this.transitionView('home', () => this._loadHomeContent());
        else this._loadHomeContent();
    },

    async loadFavorites() { this.renderListSection('favorites'); },
    async loadWatchlist() { this.renderListSection('watchlist'); },
    async loadWatched() { this.renderListSection('watched'); },

    updateNav(viewName) {
        // Only hide the mobile stats layer if we are navigating to a main view
        if (viewName) {
            const statsLayer = document.getElementById('mobile-stats-layer');
            if (statsLayer) statsLayer.classList.add('m-layer-hidden');
            document.body.style.overflow = ''; // Re-enable scroll
        }
        // 1. Desktop Nav Pill Handling
        document.querySelectorAll('.nav-pill span').forEach(el => el.classList.remove('active-view'));
        const activeEl = document.getElementById(`nav-${viewName}`);
        if (activeEl) activeEl.classList.add('active-view');

        // 2. Mobile Dock Handling (The Obsidian Protocol)
        if (window.innerWidth <= 768) {
            const dockItems = document.querySelectorAll('.m-nav-item');
            
            // CLEANUP: Remove 'm-active' from EVERYTHING first
            dockItems.forEach(item => item.classList.remove('m-active'));
            
            // APPLY: Add to the correct icon based on view
            if (viewName === 'favorites') dockItems[0].classList.add('m-active');
            else if (viewName === 'watchlist') dockItems[1].classList.add('m-active');
            else if (viewName === 'home') dockItems[2].classList.add('m-active');
            else if (viewName === 'watched') dockItems[3].classList.add('m-active');
        }
    },

    handleError() {
        elements.app.innerHTML = `<div class="error-container"><h2>Connection Lost</h2><p>Please check your internet.</p><button class="retry-btn" onclick="app.goHome()">Retry</button></div>`;
    },

  closeSettings() { 
        elements.settingsModal.classList.remove('open'); 
        
        // Disable Director Mode (Restores Dock & Search)
        document.body.classList.remove('director-mode-active');

        // Releases the scroll
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    },

    getArchiveRange() {
        if (state.watched.length === 0) return { start: '????', end: '????' };
        
        const years = state.watched.map(item => {
            const date = item.release_date || item.first_air_date;
            return date ? parseInt(date.substring(0, 4)) : null;
        }).filter(y => y !== null);

        if (years.length === 0) return { start: '????', end: '????' };
        
        return { 
            start: Math.min(...years), 
            end: Math.max(...years) 
        };
    },

    openIdentity() {
        window.history.pushState({overlay: true}, null, "");
        const modal = document.getElementById('settings-modal');
        const contentBox = document.getElementById('identity-content');
        const range = this.getArchiveRange();
        if (!state.username) state.username = 'Operator';
        const total = state.watched.length;
        let currentRank = RANKS[0];
        RANKS.forEach((r, index) => {
            const next = RANKS[index + 1];
            if (total >= r.limit && (!next || total < next.limit)) currentRank = r;
        });
        const rankText = currentRank.title.toUpperCase();
        const displayName = state.username === 'Operator' ? '' : state.username;
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            contentBox.innerHTML = `
                <div class="identity-wrapper">
                    <h1 class="m-stats-header-main">Archive Pass</h1>
                    <div class="ticket-section">
                        <div class="landscape-ticket" id="goldenTicket">
                            <div class="ticket-stub-part">
                                <div class="stub-logo">KINO</div>
                                <div class="stub-code">${rankText}</div>
                            </div>
                            <div class="ticket-main-part">
                                <div class="ticket-top-label">OFFICIAL ARCHIVE PASS</div>
                                <input type="text" class="ticket-name-input" value="${displayName}" placeholder="YOUR NAME" maxlength="12" spellcheck="false" oninput="app.updateUsername(this.value)">
                                <div class="ticket-data-row">
                                    <span class="data-item"><span class="d-label">PREMIERE</span><span class="d-val">${range.start}</span></span>
                                    <span class="data-sep">//</span>
                                    <span class="data-item"><span class="d-label">SCREENING</span><span class="d-val">${range.end}</span></span>
                                </div>
                            </div>
                            <div class="ticket-shimmer"></div>
                        </div>
                    </div>
                    <div class="mobile-access-tag">Access Granted: ${timestamp}</div>
                </div>`;
        } else {
            contentBox.innerHTML = `
                <div class="close-settings" onclick="app.closeSettings()">✕</div>
                <div class="identity-wrapper">
                    <div class="ticket-section">
                        <div class="landscape-ticket" id="goldenTicket">
                            <div class="ticket-stub-part">
                                <div class="stub-logo">KINO</div>
                                <div class="stub-code">${rankText}</div>
                            </div>
                            <div class="ticket-main-part">
                                <div class="ticket-top-label">OFFICIAL ARCHIVE PASS</div>
                                <input type="text" class="ticket-name-input" 
                                       value="${displayName}" 
                                       placeholder="YOUR NAME"
                                       maxlength="12" 
                                       spellcheck="false"
                                       oninput="app.updateUsername(this.value)">
                                <div class="ticket-data-row">
                                    <span class="data-item"><span class="d-label">PREMIERE</span><span class="d-val">${range.start}</span></span>
                                    <span class="data-sep">//</span>
                                    <span class="data-item"><span class="d-label">SCREENING</span><span class="d-val">${range.end}</span></span>
                                </div>
                            </div>
                            <div class="ticket-shimmer"></div>
                        </div>
                    </div>
                    <div class="ghost-controls">
                        <span class="cmd-btn" onclick="app.exportData()">BACKUP DATA</span>
                        <span class="cmd-sep">|</span>
                        <span class="cmd-btn" onclick="app.triggerRestore()">RESTORE DATA</span>
                        <span class="cmd-sep">|</span>
                        <span class="cmd-btn danger" onclick="app.resetTerminal()">RESET TERMINAL</span>
                    </div>
                </div>
            `;
        }

        // Prevents background scroll
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        modal.classList.add('open');
        this.addHoverEffect(); 

        // 3D TILT LOGIC
        const ticket = document.getElementById('goldenTicket');
        const section = document.querySelector('.ticket-section');

        if (ticket && section) {
            section.addEventListener('mousemove', (e) => {
                const rect = ticket.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -2.0; 
                const rotateY = ((x - centerX) / centerX) * 2.0;
                ticket.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });
            section.addEventListener('mouseleave', () => {
                ticket.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
            });
        }
    },

    updateUsername(val) {
        state.username = val;
        this.saveState();
    },
    
    resetTerminal() {
        if(confirm("WARNING: This will wipe all watched history, favorites, and watchlist data. Are you sure?")) {
            localStorage.removeItem('kino_data');
            location.reload();
        }
    },
    
    exportData() {
        const backupData = {
            favorites: state.favorites,
            watchlist: state.watchlist,
            watched: state.watched,
            tvProgress: state.tvProgress,
            username: state.username, 
            lastBackup: Date.now(),
            timestamp: new Date().toISOString(),
            version: "Kino_v3"
        };
        state.lastBackup = backupData.lastBackup;
        this.saveState();

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);

        const safeName = state.username.replace(/[^a-zA-Z0-9 _-]/g, '') || 'archive';
        downloadAnchorNode.setAttribute("download", `kino_${safeName}_${new Date().toISOString().slice(0,10)}.json`);

        document.body.appendChild(downloadAnchorNode); 
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        this.closeSettings();
        this.showToast("Backup saved. You live to see another day.");
    },

    openCredits() {
        // 1. Push State for Back Gesture Support
        window.history.pushState({overlay: true}, null, "");
        
        const modal = document.getElementById('settings-modal');
        const contentBox = document.getElementById('identity-content');
        const isMobile = window.innerWidth <= 768;

        // Shared Content (Friendly & Fun Version)
        const noteContent = `
            <div class="note-header">A Note from the Director</div>
            <div class="note-sub">Official Archive Record</div>
            <div class="note-body">
                <p>Hi! Welcome to the Archive. I built this whole thing myself, mostly by pestering Gemini until the code finally worked (hehehe).</p>
                <p>I didn't want to use boring templates. I wanted to make something that felt unique, so I placed every pixel by hand just for you.</p>
                <p>To be honest, this project runs on 10% coding skills and <span class="fuel-highlight">90% re-watching Ben 10 for the 50th time.</span></p>
                <p style="font-size: 0.85rem; opacity: 0.8;">If you see a bug, don't worry about it. It’s not an error; the Omnitrix is just entering Recalibration Mode.</p>
                <p>Have fun exploring! Muaa.</p>
            </div>
            <div class="note-signature">PreritK.</div>
            <div class="note-ps">(It's Hero Time!)</div>
        `;

        if (isMobile) {
            // DIRECTOR MODE: Hide UI, Show Note + Back Button
            document.body.classList.add('director-mode-active');
            
            contentBox.innerHTML = `
                <div class="directors-note">
                    ${noteContent}
                </div>
                <div class="director-back-btn" onclick="app.closeSettings()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
                </div>
            `;
        } else {
            // Desktop Version
            contentBox.innerHTML = `
                <div class="close-settings" onclick="app.closeSettings()">✕</div>
                <div class="directors-note">
                    ${noteContent}
                </div>
            `;
        }

        modal.classList.add('open');
        this.addHoverEffect(); 
    },

    // --- THE RECORD (Stats) ---
    openStats() {
state.isHubOpen = false; 
        document.getElementById('mobile-dock').classList.remove('m-hub-active');
        document.getElementById('mobile-stats-layer').classList.remove('m-layer-hidden');
        // -------------------------

console.log("Stats Triggered!");

        window.history.pushState({overlay: true}, null, "");
        const isMobile = window.innerWidth <= 768;
        
        // Pick the right container based on device
        const modal = document.getElementById(isMobile ? 'mobile-stats-layer' : 'stats-modal');
const contentEl = isMobile ? modal : modal.querySelector('.record-container');
        
        // -- Data Processing --
        const total = state.watched.length;
        let movies = 0, series = 0, animeMovies = 0, animeSeries = 0;
        const genreCounts = {};

        state.watched.forEach(item => {
            if(item.genre_ids) {
                item.genre_ids.forEach(id => {
                    const name = GENRES[id] || "Other";
                    genreCounts[name] = (genreCounts[name] || 0) + 1;
                });
            }
            const isAnime = (item.genre_ids && item.genre_ids.includes(16) && item.original_language === 'ja');
            const type = item.media_type || (item.title ? 'movie' : 'tv');
            if (isAnime) { if (type === 'movie') animeMovies++; else animeSeries++; } 
            else { if (type === 'movie') movies++; else series++; }
        });

        let currentRank = RANKS[0]; 
        RANKS.forEach((r, index) => {
            const next = RANKS[index + 1];
            if (total >= r.limit && (!next || total < next.limit)) currentRank = r;
        });

        const sortedGenres = Object.entries(genreCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
        const topGenreCount = sortedGenres.length > 0 ? sortedGenres[0][1] : 1;

        // -- Mobile Layout Injection --
        if (isMobile) {
            let genreHtml = sortedGenres.map(([name, count]) => `
                <div class="m-vial-row">
                    <div class="m-vial-info"><span>${name}</span><span>${count}</span></div>
                    <div class="m-vial-track"><div class="m-vial-fill" data-percent="${(count / topGenreCount) * 100}"></div></div>
                </div>
            `).join('');

            contentEl.innerHTML = `
                <h1 class="m-stats-header-main">The Record</h1>
                <div class="m-stats-ghost-total">${total}</div>
                <div class="m-stats-rank-tablet">
                    <div class="m-stats-rank-title">${currentRank.title}</div>
                </div>
                
                <div class="m-stats-grid">
                    <div class="m-stats-card"><span class="m-card-val">${movies}</span><span class="m-card-label">Movies</span></div>
                    <div class="m-stats-card"><span class="m-card-val">${series}</span><span class="m-card-label">Series</span></div>
                    <div class="m-stats-card"><span class="m-card-val">${animeMovies}</span><span class="m-card-label">Anime Movies</span></div>
                    <div class="m-stats-card"><span class="m-card-val">${animeSeries}</span><span class="m-card-label">Anime Series</span></div>
                </div>
                <div class="m-vial-section">${genreHtml}</div>
            `;
            
            modal.classList.remove('m-layer-hidden');
            // Trigger Vial Animation
            setTimeout(() => {
                modal.querySelectorAll('.m-vial-fill').forEach(f => f.style.width = f.dataset.percent + '%');
            }, 100);

        } else {
            // -- Keep existing Desktop Logic (The original code you had) --
            let html = `
            <div class="record-pop-wrapper" style="width:100%;">
                <div class="record-header-row">
                    <div class="record-title">THE RECORD</div>
                    <div class="legend-close" onclick="app.closeStats()">✕</div>
                </div>
                <div class="record-card">
                    <div class="record-left">
                        <div class="big-stat-number">${total}</div>
                        <div class="rank-badge-large" style="background:${currentRank.color};">${currentRank.title}</div>
                        <div class="breakdown-grid">
                            <div class="stat-capsule"><span class="cap-label">Movies</span><span class="cap-val">${movies}</span></div>
                            <div class="stat-capsule"><span class="cap-label">TV Series</span><span class="cap-val">${series}</span></div>
                            <div class="stat-capsule"><span class="cap-label">Anime Movies</span><span class="cap-val">${animeMovies}</span></div>
                            <div class="stat-capsule"><span class="cap-label">Anime TV</span><span class="cap-val">${animeSeries}</span></div>
                        </div>
                    </div>
                    <div class="record-right">
                        <div class="section-label">Top 5 Genres</div>
                        <div style="background:rgba(255,255,255,0.04); border-radius:16px; padding:30px;">
                            ${sortedGenres.map(([name, count]) => `
                                <div class="genre-bar-row">
                                    <div class="g-name">${name}</div>
                                    <div class="g-track"><div class="g-fill" style="width:${(count / topGenreCount) * 100}%;"></div></div>
                                    <div class="g-count">${count}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>`;
            contentEl.innerHTML = html;
            modal.classList.add('open');
        }
        document.body.style.overflow = 'hidden';
    },

    closeStats() {
        const modal = document.getElementById('stats-modal');
        if (!modal) return;
        modal.classList.remove('open');
        setTimeout(() => {
            const contentEl = modal.querySelector('.record-container');
            if(contentEl) contentEl.innerHTML = ''; 
            document.body.style.overflow = '';
        }, 400);
    },

// --- HELP / LEGEND OVERLAY ---
    openHelp() {
        window.history.pushState({overlay: true}, null, "");
        const ladderEl = document.getElementById('st-ladder');
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            // ... (Your existing Mobile Code remains here) ...
            let rankHtml = '';
            RANKS.forEach((r) => {
                const badgeStyle = `background:${r.color}; font-size:0.7rem; padding:6px 14px; border-radius:20px; font-weight:800; color:white; border:1px solid rgba(255,255,255,0.2);`;
                rankHtml += `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                        <span style="${badgeStyle}">${r.title.toUpperCase()}</span>
                        <span style="color:#888; font-family:monospace; font-weight:700; font-size:0.9rem;">${r.limit}+</span>
                    </div>`;
            });

            ladderEl.innerHTML = `
                <div class="legend-pop-wrapper">
                    <div class="legend-header-row" style="margin-bottom: 40px; justify-content: center;">
                        <h1 class="m-legend-heading-simple">Archive Legend</h1>
                    </div>

                    <div class="m-legend-stack">
                        <div class="m-clean-card">
                            <div class="m-card-label-simple">Rank Hierarchy</div>
                            <div style="width:100%;">${rankHtml}</div>
                        </div>

                        <div class="m-clean-card">
                            <div class="m-card-label-simple">Season Status</div>
                            <div style="display:flex; flex-direction:column; gap:15px; width:100%;">
                                <div style="display:flex; align-items:center; justify-content:space-between;">
                                    <div class="season-tab active" style="pointer-events:none;">Season <span class="status-dot" style="background:var(--accent-color); display:block;"></span> <span class="season-chevron"></span></div>
                                    <span class="m-status-text">Watched</span>
                                </div>
                                <div style="display:flex; align-items:center; justify-content:space-between;">
                                    <div class="season-tab active" style="pointer-events:none;">Season <span class="status-dot" style="background:var(--green-highlight); display:block;"></span> <span class="season-chevron"></span></div>
                                    <span class="m-status-text">Watching</span>
                                </div>
                                <div style="display:flex; align-items:center; justify-content:space-between;">
                                    <div class="season-tab active" style="pointer-events:none;">Season <span class="status-dot" style="background:var(--future-color); display:block;"></span> <span class="season-chevron"></span></div>
                                    <span class="m-status-text">Watchlist</span>
                                </div>
                            </div>
                        </div>

                        <div class="m-clean-card" style="align-items: center; text-align: center;">
                            <div class="m-card-label-simple">Archive Pick</div>
                            <div class="shuffle-btn" onclick="app.shuffleWatchlist()">Suggest</div>
                            <p style="color:#666; font-size:0.8rem; line-height:1.5; font-weight:500; margin-top: 15px;">Can't decide? Let The Archive pick a random title from your watchlist.</p>
                        </div>
                    </div>
                    
                    <div style="height: 50px; width: 100%;"></div> </div>
            `;
        } else {
            // --- PASTE THE NEW DESKTOP LOGIC HERE ---
            const heartIcon = ICONS.heartFilled;
            const watchIcon = ICONS.watchlist; 
            const checkIcon = ICONS.watched; 
            const boxStyle = `display:flex; align-items:center; gap:15px; padding:12px 20px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.15); border-radius:12px; width:100%; min-width:240px; transition:transform 0.2s;`;

            let ladderHtml = `<div class="legend-pop-wrapper">
                <div class="legend-header-row"><h1 class="legend-heading">The Archive Legend</h1><div class="legend-close" onclick="app.toggleRankLadder()">✕</div></div>
                <div class="legend-grid">
                    <div class="legend-card">
                        <div class="card-label">Season Status</div>
                        <div style="display:flex; flex-direction:column; gap:20px; width:100%; padding:0 20px;">
                            <div style="display:flex; align-items:center; justify-content:space-between;"><div class="season-tab" style="pointer-events:none;">Season <span class="status-dot" style="background:var(--accent-color); box-shadow:0 0 4px var(--accent-color); display:block;"></span> <span class="season-chevron"></span></div><span style="color:#ddd; font-weight:600;">Watched</span></div>
                            <div style="display:flex; align-items:center; justify-content:space-between;"><div class="season-tab" style="pointer-events:none;">Season <span class="status-dot" style="background:var(--green-highlight); box-shadow:0 0 4px var(--green-highlight); display:block;"></span> <span class="season-chevron"></span></div><span style="color:#ddd; font-weight:600;">Watching</span></div>
                            <div style="display:flex; align-items:center; justify-content:space-between;"><div class="season-tab" style="pointer-events:none;">Season <span class="status-dot" style="background:var(--future-color); box-shadow:0 0 4px var(--future-color); display:block;"></span> <span class="season-chevron"></span></div><span style="color:#ddd; font-weight:600;">Watchlist</span></div>
                        </div>
                    </div>
                    <div class="legend-card">
                        <div class="card-label">Rank System</div>
                        <div style="width:100%; display:flex; flex-direction:column; gap:10px; overflow-y:auto; padding-right:5px;">`;
            RANKS.forEach((r) => {
                const badgeStyle = `background:${r.color}; font-size:0.75rem; padding:6px 12px; border-radius:20px; font-weight:800; color:white; box-shadow:0 0 10px ${r.color}44; border:1px solid rgba(255,255,255,0.2);`;
                ladderHtml += `<div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05);"><span style="${badgeStyle}">${r.title}</span><span style="color:#ccc; font-family:monospace; font-weight:700;">${r.limit}+</span></div>`;
            });
            ladderHtml += `</div></div>
                    <div style="display:flex; flex-direction:column; gap:30px; height:100%;">
                        <div class="legend-card" style="flex:1; min-width:auto; justify-content:center;"><div class="card-label" style="margin-bottom:15px;">Suggest</div><div class="shuffle-btn" style="pointer-events:none; margin-bottom:15px;">Suggest</div><p style="color:#888; font-size:0.85rem; line-height:1.5; text-align:center;">Can't decide? Let The Archive pick a random title.</p></div>
                        <div class="legend-card" style="flex:1; min-width:auto; justify-content:center;"><div class="card-label" style="margin-bottom:20px;">Actions</div>
                            <div style="display:flex; flex-direction:column; gap:12px; width:fit-content; margin:0 auto;">
                                <div style="${boxStyle}"><div class="card-icon-container active-red" style="opacity:1 !important; position:relative !important; transform:scale(0.8); cursor:help; top:0 !important; right:0 !important; margin:0 !important;">${heartIcon}</div><div><span style="color:white; font-weight:700; font-size:0.9rem;">Favorites</span></div></div>
                                <div style="${boxStyle}"><div class="card-icon-container active-blue" style="opacity:1 !important; position:relative !important; transform:scale(0.8); cursor:help; top:0 !important; right:0 !important; margin:0 !important;">${watchIcon}</div><div><span style="color:white; font-weight:700; font-size:0.9rem;">Watchlist</span></div></div>
                                <div style="${boxStyle}"><div class="card-icon-container active-green" style="opacity:1 !important; position:relative !important; transform:scale(0.8); cursor:help; top:0 !important; right:0 !important; margin:0 !important;">${checkIcon}</div><div><span style="color:white; font-weight:700; font-size:0.9rem;">Watched</span></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
            ladderEl.innerHTML = ladderHtml;
        }

        ladderEl.classList.add('open');
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        this.addHoverEffect();
    },

    toggleRankLadder() {
        const el = document.getElementById('st-ladder');
        if (!el) return;

        if (el.classList.contains('open')) {
            el.classList.remove('open');
            document.body.style.overflow = ''; 
            document.documentElement.style.overflow = '';
        } else {
            el.classList.add('open');
            document.body.style.overflow = 'hidden'; 
            document.documentElement.style.overflow = 'hidden';
        }
    },

    triggerRestore() { elements.restoreInput.click(); },

    handleRestore(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (Array.isArray(data.favorites) && Array.isArray(data.watchlist)) {
                    state.favorites = data.favorites;
                    state.watchlist = data.watchlist;
                    state.watched = data.watched || [];
                    state.tvProgress = data.tvProgress || {};
                    state.username = data.username || 'Operator';
                    state.lastBackup = data.lastBackup || Date.now();

                    this.saveState();
                    this.showToast("Restore Successful! Reloading...");
                    
                    setTimeout(() => location.reload(), 1500);
                } else { 
                    this.showToast("Invalid backup file"); 
                }
            } catch (err) { 
                this.showToast("Error reading file"); 
            }
        };
        reader.readAsText(file);
        event.target.value = '';
        this.closeSettings();
    },

    /* =========================================
       4. HERO SECTION LOGIC
       ========================================= */
    startHeroTimer() {
        this.stopHeroTimer();
        state.heroTimer = setInterval(() => this.nextHero(), 10000);
    },
    stopHeroTimer() { if(state.heroTimer) clearInterval(state.heroTimer); },
    
    nextHero() { 
        if(state.isHeroAnimating) return;
        const nextIndex = (state.heroIndex + 1) % state.heroItems.length; 
        this.transitionHero(nextIndex, 'next');
    },
    
    prevHero() { 
        if(state.isHeroAnimating) return;
        const prevIndex = (state.heroIndex - 1 + state.heroItems.length) % state.heroItems.length; 
        this.transitionHero(prevIndex, 'prev');
    },
    
    manualHero(dir) {
        this.stopHeroTimer();
        if(dir === 'next') this.nextHero(); else this.prevHero();
        this.startHeroTimer();
    },

    preloadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = resolve;
            img.onerror = reject;
        });
    },

    createHeroSlide(item, isEager = false) {
        // 1. Determine Load Priority (Eager for first slide, Lazy for others)
        const loadAttr = isEager ? 'eager' : 'loading="lazy"';

        const bg = item.backdrop_path ? CONFIG.imgBlur + item.backdrop_path : '';
        const poster = item.poster_path ? CONFIG.imgHero + item.poster_path : '';
        
        const title = item.title || item.name;
        const itemStr = JSON.stringify(item).replace(/"/g, '&quot;');
        const year = (item.release_date || item.first_air_date || '').substr(0,4);
        
        const div = document.createElement('div');
        div.className = 'hero-slide';

        // 2. Added ${loadAttr} to images
        div.innerHTML = `
            <div class="hero-bg-wrapper">
                <img class="hero-img-blur" src="${bg}" ${loadAttr} alt="">
                <div class="hero-vignette"></div>
            </div>
            
            <div class="hero-ghost-title">${title}</div>

            <div class="hero-layout-grid suggestion-one">
                <div class="hero-poster-box" onclick="app.openModal(${itemStr})">
                    <img src="${poster}" ${loadAttr} alt="${title}" onerror="this.src='assets/placeholder.png'">
                </div>

                <div class="hero-info-stack">
                    <h1 class="hero-title-v2">${title}</h1>
                    
                    <div class="h-meta-row">
                        <span class="meta-badge">${year}</span>
                        <span class="meta-divider">|</span>
                        <span class="meta-badge">${item.runtime || '--'}</span>
                        <span class="meta-divider">|</span>
                        <span class="meta-badge">${item.genre_names?.[0] || 'Movie'}</span>
                    </div>

                    <p class="hero-desc-v2">${item.overview || 'No transmission available.'}</p>
                    
                    <button class="btn btn-primary" onclick="app.openModal(${itemStr})">More Info</button>
                </div>
            </div>
        `;

        // 3. REMOVED: The Mouse Tilt Event Listeners
        return div;
    },

    async transitionHero(newIndex, direction) {
        const container = document.getElementById('hero-container');
        if(!container) return;
        state.isHeroAnimating = true;
        const currentSlide = container.querySelector('.hero-slide.active');
        if(currentSlide) currentSlide.classList.add('prev-active');

        const nextItem = state.heroItems[newIndex];
        if(nextItem.backdrop_path) { try { await this.preloadImage(CONFIG.imgOriginal + nextItem.backdrop_path); } catch(e) {} }
        const type = nextItem.media_type || (nextItem.title ? 'movie' : 'tv');
// We fetch both together so the slide has all the data it needs
const [age, details] = await Promise.all([
    api.getAgeRating(type, nextItem.id),
    api.getDetails(type, nextItem.id)
]);

nextItem.ageRating = age;
if (details && details.runtime) {
    nextItem.runtime = `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`;
} else if (details && details.number_of_seasons) {
    nextItem.runtime = `${details.number_of_seasons} Season${details.number_of_seasons > 1 ? 's' : ''}`;
}
        
        const nextSlide = this.createHeroSlide(nextItem);
        if (direction === 'next') nextSlide.classList.add('enter-right'); else nextSlide.classList.add('enter-left');
        container.appendChild(nextSlide);
        void nextSlide.offsetWidth; 
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (currentSlide) {
                    currentSlide.classList.remove('active');
                    if (direction === 'next') currentSlide.classList.add('exit-left'); else currentSlide.classList.add('exit-right');
                }
                nextSlide.classList.remove('enter-right', 'enter-left');
                nextSlide.classList.add('active');
            });
        });
        
        setTimeout(() => {
            if(currentSlide) currentSlide.remove();
            state.heroIndex = newIndex; state.isHeroAnimating = false;
        }, 1000); 
    },

    /* =========================================
       5. RENDERING
       ========================================= */
    renderSkeletons(mode) {
        let html = '';
        let cardsHtml = '';
        const count = window.innerWidth <= 768 ? 6 : 9;
        for(let i = 0; i < count; i++) cardsHtml += '<div class="skeleton skeleton-card"></div>';

        if(mode === 'home') {
            html += `<div class="skeleton skeleton-hero"></div><div style="margin-top: 40px; padding-left:4%;"><div style="width: 150px; height: 20px; margin-bottom: 15px; border-radius: 4px;" class="skeleton"></div><div class="skeleton-row">${cardsHtml}</div></div>`;
        } else {
            html += '<div class="search-results-grid" style="animation:none; margin-top: 100px;">';
            for(let i = 0; i < 12; i++) html += '<div class="skeleton skeleton-card"></div>';
            html += '</div>';
        }
        elements.app.innerHTML = html;
    },

    setupObserver() {
        if(state.observer) state.observer.disconnect();
        state.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    const containerId = entry.target.dataset.target;
                    this.loadMoreStackItems(containerId, entry.target);
                }
            });
        }, { root: null, rootMargin: '400px', threshold: 0.1 });
    },

    loadMoreStackItems(containerId, sentinel) {
        const data = state.stackData[containerId];
        if(!data) return;
        const container = document.getElementById(containerId);
        if(!container) return;
        const currentCount = data.renderedCount;
        const nextBatch = data.items.slice(currentCount, currentCount + 20);
        if(nextBatch.length === 0) { if(sentinel) sentinel.remove(); return; }
        nextBatch.forEach(item => container.appendChild(this.createCard(item)));
        data.renderedCount += 20;
        if(sentinel) container.appendChild(sentinel);
    },

    async _loadHomeContent(fromHistory = false) {
        this.stopHeroTimer();
        state.currentView = 'home';
        this.updateNav('home'); 
        
        // Only show skeletons if this is a fresh load, not a back navigation
        if(!fromHistory) this.renderSkeletons('home');
        
        const [trending, topMovies, topAnime, topSeries] = await Promise.all([
            api.getTrendingAll(), api.getTopMovies(), api.getAnimeMixed(), api.getTopSeries()
        ]);

        if (!trending || !topMovies) { this.handleError(); return; }
        elements.app.innerHTML = '';

        let heroPool = [];
        if(trending && trending.results) heroPool = heroPool.concat(trending.results.filter(i => i.media_type !== 'person' && i.backdrop_path).slice(0, 5));
        if(topAnime && topAnime.results) heroPool = heroPool.concat(topAnime.results.filter(i => i.backdrop_path).slice(0, 5));
        heroPool.sort(() => Math.random() - 0.5);

        state.heroItems = heroPool;
        state.heroIndex = 0;
        
        const heroContainer = document.createElement('div');
        heroContainer.id = 'hero-container';
        
        if(state.heroItems.length > 0) {
            const firstItem = state.heroItems[0];
            const type = firstItem.media_type || (firstItem.title ? 'movie' : 'tv');
            
            Promise.all([api.getAgeRating(type, firstItem.id), api.getDetails(type, firstItem.id)]).then(([age, details]) => {
    firstItem.ageRating = age;
    firstItem.runtime = (details && details.runtime) ? `${Math.floor(details.runtime/60)}h ${details.runtime%60}m` : (details && details.number_of_seasons ? `${details.number_of_seasons} Seasons` : '');
    
    const activeSlide = document.querySelector('.hero-slide.active');
    // Only refresh if we are still on the first slide
            if(activeSlide && state.heroIndex === 0) {
                  const updatedSlide = this.createHeroSlide(firstItem, true); // <--- TRUE (Eager Update)
                  updatedSlide.classList.add('active');
                  activeSlide.replaceWith(updatedSlide); 
            }
        });
            
        const slide = this.createHeroSlide(firstItem, true); // <--- TRUE (Eager First Load)
            slide.classList.add('active');
            heroContainer.appendChild(slide);
            heroContainer.insertAdjacentHTML('beforeend', `<div class="hero-control prev-btn" onclick="app.manualHero('prev')">‹</div><div class="hero-control next-btn" onclick="app.manualHero('next')">›</div>`);
            elements.app.appendChild(heroContainer);
            this.startHeroTimer();
        } else { elements.app.appendChild(heroContainer); }

        this.renderRow("Trending Now", trending.results.filter(i => i.media_type !== 'person'), "row_trend");
        this.renderRow("Top Movies", topMovies.results, "row_top_movies");
        this.renderRow("Top Anime", topAnime.results, "row_top_anime");
        this.renderRow("Top Series", topSeries.results, "row_top_series");
    },

    scrollRow(rowId, direction) {
        const container = document.getElementById(rowId);
        if (!container) return;
        const scrollAmount = container.clientWidth * 0.75;
        container.scrollBy({ 
            left: direction === 'right' ? scrollAmount : -scrollAmount, 
            behavior: 'smooth' 
        });
    },

    renderRow(title, items, rowId) {
        if(!items || items.length === 0) return;
        state.rows[rowId] = items;
        
        elements.app.insertAdjacentHTML('beforeend', `
            <div class="category-row">
                <div class="row-header-wrapper">
                    <h3 class="row-header">${title}</h3>
                </div>
                <div class="row-wrapper-relative">
                    <div class="scroll-paddle left" onclick="app.scrollRow('${rowId}', 'left')">‹</div>
                    <div class="row-container" id="${rowId}"></div>
                    <div class="scroll-paddle right" onclick="app.scrollRow('${rowId}', 'right')">›</div>
                </div>
            </div>
        `);
        this.populateRow(rowId, items);
    },

    populateRow(rowId, items) {
        const container = document.getElementById(rowId);
        container.innerHTML = ''; 
        items.forEach((item) => container.appendChild(this.createCard(item)));
    },

    createCard(item) {
        const el = document.createElement('div');
        el.className = 'card';
        el.setAttribute('data-id', item.id);
        el.setAttribute('tabindex', '0'); 
        el.onkeydown = (e) => { if(e.key === 'Enter') this.openModal(item); };

        const title = item.title || item.name;
        const year = (item.release_date || item.first_air_date || '').substr(0,4);
        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
        const imgHtml = item.poster_path ? `<img src="${CONFIG.imgBase}${item.poster_path}" loading="lazy" alt="" onerror="this.style.display='none'">` : ''; 

        let iconHtml = '';
        let iconClass = '';
        let iconTitle = '';

        if (state.currentView === 'watchlist') {
            iconHtml = ICONS.watchlist; 
            iconClass = 'active-blue'; 
            iconTitle = "Remove from Watchlist";
        } else if (state.currentView === 'watched') {
            iconHtml = ICONS.watched;
            iconClass = 'active-green'; 
            iconTitle = "Remove from Watched";
        } else {
            const isFav = state.favorites.some(i => i.id === item.id);
            iconHtml = isFav ? ICONS.heartFilled : ICONS.heartOutline;
            iconClass = isFav ? 'active-red' : ''; 
            iconTitle = "Toggle Favorite";
        }

        el.innerHTML = `
            <div class="poster-placeholder">${title}</div>${imgHtml}
            <div class="card-rating-badge"><span class="star-icon">★</span> ${rating}</div>
            <div class="card-icon-container ${iconClass}" title="${iconTitle}">${iconHtml}</div>
            <div class="card-info-overlay">
                <div class="card-title-ov">${title}</div>
                <div class="card-meta-ov"><span>${year}</span><span class="age-badge-wrapper" style="display:none"><span class="age-badge"></span></span></div>
            </div>`;
        
        el.onmouseenter = () => {
            if (!item.ratingLoaded) {
                 api.getAgeRating(item.media_type || (item.title ? 'movie' : 'tv'), item.id).then(r => {
                     if(r) {
                         const badge = el.querySelector('.age-badge');
                         const wrapper = el.querySelector('.age-badge-wrapper');
                         if(badge && wrapper) { badge.innerText = r; badge.style.display = 'inline-flex'; wrapper.style.display = 'inline-flex'; }
                     }
                     item.ratingLoaded = true;
                 });
            }
        };

        el.onclick = (e) => {
            if(e.target.classList.contains('card-icon-container') || e.target.closest('.card-icon-container')) {
                e.stopPropagation();
                const btn = e.target.classList.contains('card-icon-container') ? e.target : e.target.closest('.card-icon-container');
                
                if (state.currentView === 'watchlist') {
                    this.quickToggleListAction('watchlist', item, el);
                } else if (state.currentView === 'watched') {
                    this.quickToggleListAction('watched', item, el);
                } else {
                    this.quickToggleFav(item, btn);
                }
            } else { state.lastFocus = el; this.openModal(item); }
        };
        return el;
    },

    shuffleWatchlist() {
        if (state.watchlist.length === 0) { this.showToast("Your Watchlist is empty!"); return; }
        this.showToast("Consulting the Archive...");
        const randomItem = state.watchlist[Math.floor(Math.random() * state.watchlist.length)];
        setTimeout(() => { this.openModal(randomItem); }, 800);
    },

    quickToggleListAction(listName, item, cardElement) {
        const idx = state[listName].findIndex(i => i.id === item.id);
        if(idx > -1) { 
            state[listName].splice(idx, 1); 
            const prettyName = listName.charAt(0).toUpperCase() + listName.slice(1);
            this.showToast(`Removed from ${prettyName}`);
            this.saveState();

            cardElement.style.transition = 'transform 0.3s, opacity 0.3s';
            cardElement.style.transform = 'scale(0.8)';
            cardElement.style.opacity = '0';
            
            setTimeout(() => {
                cardElement.remove();
                if(state[listName].length === 0) this.renderListSection(listName);
            }, 300);
        }
    },

    renderListSection(listName, fromHistory = false) {
        // --- MASTER CLEANUP: Close everything before navigating ---
        
        // 1. Close Search (FORCE CLOSE: Pass 'true' to prevent history.back())
        this.closeMobileSearch(true);
        
        // 2. Close Hub (FORCE CLOSE: Pass 'true')
        if (state.isHubOpen) this.toggleMobileHub(true);
        
        // 3. Clear any pending Search Timer (Prevent Ghost Redirects)
        clearTimeout(state.searchTimer);
        
        // 4. Close Director Mode / Settings
        if (document.body.classList.contains('director-mode-active')) {
            this.closeSettings(); 
        }
        elements.settingsModal.classList.remove('open');
        
        // 5. Close Stats / Legend
        this.closeStats();
        const ladder = document.getElementById('st-ladder');
        if (ladder) {
            ladder.classList.remove('open');
            document.body.style.overflow = '';
        }

        // 6. CRITICAL: Close Movie Modal
        if (elements.modal.classList.contains('open')) {
            elements.modal.classList.remove('open');
            document.body.classList.remove('modal-active');
            
            // Ensure dock comes back if we were deep in a movie
            if (window.innerWidth <= 768) this.setMobileDockVisibility(true);
        }
        
        // ---------------------------------------------------------

        // Only push a new history state if we are NOT coming from the back button
        if (!fromHistory) window.history.pushState({view: listName}, null, "");

        this.transitionView(listName, () => {
            this.stopHeroTimer();
            state.currentView = listName;
            this.updateNav(listName); 
            
            // Safe clear of search input
            if(elements.search) elements.search.value = '';
            
            // 1. Get List & Create Copy for Sorting
            let list = [...state[listName]]; 
            
            // 2. Define Sort Logic
            const sortMode = state.currentListSort || 'default';
            
            if (sortMode === 'a-z') {
                list.sort((a,b) => (a.title || a.name).localeCompare(b.title || b.name));
            } else if (sortMode === 'rating') {
                list.sort((a,b) => b.vote_average - a.vote_average);
            } else if (sortMode === 'newest') {
                list.sort((a,b) => new Date(b.release_date || b.first_air_date || 0) - new Date(a.release_date || a.first_air_date || 0));
            } else if (sortMode === 'oldest') {
                list.sort((a,b) => new Date(a.release_date || a.first_air_date || 0) - new Date(b.release_date || b.first_air_date || 0));
            }

            // 3. Build Action Buttons
            let actionHtml = '';
            if (listName === 'watchlist' && list.length > 0) {
                actionHtml += `<button class="shuffle-btn" onclick="app.shuffleWatchlist()" style="margin-right:10px;">Suggest</button>`;
            }

            const labels = { 'default': 'Default', 'a-z': 'A-Z', 'rating': 'Rating', 'newest': 'Newest', 'oldest': 'Oldest' };
            const currentLabel = labels[sortMode] || 'Default';

            actionHtml += `
                <div class="custom-dropdown" id="listSortDropdown">
                    <div class="dropdown-btn" onclick="app.toggleListDropdown()">
                        <span id="listSortLabel">Sort: ${currentLabel}</span>
                        <span>▼</span>
                    </div>
                    <div class="dropdown-menu">
                        <div class="dropdown-item" onclick="app.applyListSort('default')">Default</div>
                        <div class="dropdown-item" onclick="app.applyListSort('a-z')">A-Z</div>
                        <div class="dropdown-item" onclick="app.applyListSort('rating')">Rating (High)</div>
                        <div class="dropdown-item" onclick="app.applyListSort('newest')">Newest</div>
                        <div class="dropdown-item" onclick="app.applyListSort('oldest')">Oldest</div>
                    </div>
                </div>
            `;

            // 4. Render
            if(list.length === 0) {
                elements.app.innerHTML = `<div class="list-page-header empty-list"><h2 style="text-transform:capitalize;">${listName}</h2><p style="color:#666;">No items yet.</p></div>`;
                return;
            }

            this.setupObserver();
            const { anime, movies, series } = this.categorizeItems(list);
            
            elements.app.innerHTML = `
                <div class="list-page-header">
                    <h2 style="text-transform:capitalize;">${listName}</h2>
                    <div style="display:flex; align-items:center;">${actionHtml}</div>
                </div>
            `;
            
            this.renderCategoryStack("Movies", movies);
            this.renderCategoryStack("Series", series);
            this.renderCategoryStack("Anime", anime);
        });
    },

    toggleListDropdown() { 
        const d = document.getElementById('listSortDropdown');
        if(d) d.classList.toggle('active'); 
    },

    applyListSort(criteria) {
        // Save the sort preference temporarily
        state.currentListSort = criteria;
        
        // Close dropdown
        const d = document.getElementById('listSortDropdown');
        if(d) d.classList.remove('active');
        
        // Re-render the current view to apply sorting
        // We pass the current view name so it refreshes the correct list
        this.renderListSection(state.currentView);
    },

    categorizeItems(items) {
        const anime = [], movies = [], series = [];
        items.forEach(item => {
            const isAnime = (item.genre_ids && item.genre_ids.includes(16) && item.original_language === 'ja');
            if (isAnime) anime.push(item);
            else if (item.media_type === 'movie' || (!item.media_type && item.title)) movies.push(item);
            else series.push(item);
        });
        return { anime, movies, series };
    },

    renderCategoryStack(title, items) {
        if(items.length === 0) return;
        const containerId = `container-${title.toLowerCase()}`;
        const sectionId = `stack-${title.toLowerCase()}`;
        state.stackData[containerId] = { items: items, renderedCount: 0 };
        
        elements.app.insertAdjacentHTML('beforeend', `
            <div class="library-section" id="${sectionId}">
                <div class="category-row">
                    <div class="row-header-wrapper" style="justify-content: space-between; padding-right: 4%;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <h3 class="row-header">${title}</h3>
                            <span style="color:#666; font-size:0.9rem; font-weight:600;">(${items.length})</span>
                        </div>
                        <div class="library-toggle" id="btn-${containerId}" onclick="app.toggleStackView('${containerId}', '${title}')">Show All ▾</div>
                    </div>
                    
                    <div class="row-wrapper-relative" id="wrap-${containerId}">
                        <div class="scroll-paddle left" onclick="app.scrollRow('${containerId}', 'left')">‹</div>
                        <div class="library-container row-view" id="${containerId}"></div>
                        <div class="scroll-paddle right" onclick="app.scrollRow('${containerId}', 'right')">›</div>
                    </div>
                </div>
            </div>
        `);
        
        const container = document.getElementById(containerId);
        const sentinel = document.createElement('div');
        sentinel.className = 'skeleton-card'; sentinel.style.opacity = '0'; sentinel.dataset.target = containerId;
        container.appendChild(sentinel);
        state.observer.observe(sentinel);
    },

    toggleStackView(containerId, title) {
        const container = document.getElementById(containerId);
        const btn = document.getElementById(`btn-${containerId}`);
        const wrapper = document.getElementById(`wrap-${containerId}`); 
        
        if (container.classList.contains('row-view')) {
            container.classList.remove('row-view'); 
            container.classList.add('grid-view'); 
            btn.innerText = "Show Less ▴";
            if(wrapper) {
                wrapper.querySelectorAll('.scroll-paddle').forEach(p => p.style.display = 'none');
            }
        } else {
            container.classList.remove('grid-view'); 
            container.classList.add('row-view'); 
            btn.innerText = "Show All ▾";
            
            if(wrapper) {
                wrapper.querySelectorAll('.scroll-paddle').forEach(p => p.style.display = 'flex');
            }

            container.scrollLeft = 0;
            const section = document.getElementById(`stack-${title.toLowerCase()}`);
            if(section) {
                const yOffset = -150;
                const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({top: y, behavior: 'smooth'});
            }
        }
    },

    renderSearchResults(q) {
        this.transitionView('search', () => {
            state.currentView = 'search'; 
            this.updateNav(null); 
            this.renderSkeletons('search');
            
            api.search(q).then(async data => {
                if(!data || !data.results) { this.handleError(); return; }
                
                // 1. Setup the Header
                elements.app.innerHTML = `
                <div class="list-page-header search-header">
                    <h2>Results: "${q}"</h2>
                    <div class="custom-dropdown" id="searchSortDropdown">
                        <div class="dropdown-btn" onclick="app.toggleSearchDropdown()">
                            <span id="sortLabel">Sort: Default</span>
                            <span>▼</span>
                        </div>
                        <div class="dropdown-menu">
                            <div class="dropdown-item" onclick="app.applySort('default', 'Sort: Default')">Default</div>
                            <div class="dropdown-item" onclick="app.applySort('rating', 'Rating (High)')">Rating (High)</div>
                            <div class="dropdown-item" onclick="app.applySort('year', 'Newest')">Newest</div>
                            <div class="dropdown-item" onclick="app.applySort('oldest', 'Oldest')">Oldest</div>
                        </div>
                    </div>
                </div>`;
                
                const grid = document.createElement('div');
                grid.className = 'search-results-grid'; 
                grid.id = 'search-grid';
                elements.app.appendChild(grid);

                const topResult = data.results[0];
                
                // Get standard search results (Movies/TV) excluding the Person objects themselves
                let directMatches = data.results.filter(item => (item.media_type==='movie'||item.media_type==='tv'));

                if (topResult && topResult.media_type === 'person') {
                    const credits = await api.getPersonCredits(topResult.id);
                    if (credits) {
                        let works = (topResult.known_for_department === 'Directing') ? credits.crew.filter(w => w.job === 'Director') : credits.cast;
                        
                        // FIX: Combine Person's Works + Direct Search Matches
                        let combined = [...works, ...directMatches];

                        // Deduplicate (Remove items that appear in both lists)
                        combined = combined.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
                        
                        // Sort by Popularity (Ensures the main movie "PK" floats to the top if it's popular)
                        combined.sort((a,b) => b.popularity - a.popularity);

                        state.searchResultItems = combined;
                        state.searchRenderCount = 0;
                        this.renderSearchGridChunk(); 
                        return;
                    }
                }
                
                // Normal Behavior (No Person Found)
                state.searchResultItems = directMatches;
                state.searchRenderCount = 0;
                this.renderSearchGridChunk();
            });
        });
    },

    toggleSearchDropdown() { document.getElementById('searchSortDropdown').classList.toggle('active'); },
    applySort(criteria, label) {
        document.getElementById('sortLabel').innerText = label;
        document.getElementById('searchSortDropdown').classList.remove('active');
        this.sortSearch(criteria);
    },
    sortSearch(criteria) {
        const items = state.searchResultItems;
        if (criteria === 'rating') items.sort((a,b) => b.vote_average - a.vote_average);
        else if (criteria === 'year') items.sort((a,b) => new Date(b.release_date || b.first_air_date || 0) - new Date(a.release_date || a.first_air_date || 0));
        else if (criteria === 'oldest') items.sort((a,b) => new Date(a.release_date || a.first_air_date || 0) - new Date(b.release_date || b.first_air_date || 0));
        state.searchRenderCount = 0;
        document.getElementById('search-grid').innerHTML = '';
        this.renderSearchGridChunk();
    },
    renderSearchGridChunk() {
        const grid = document.getElementById('search-grid');
        const nextBatch = state.searchResultItems.slice(state.searchRenderCount, state.searchRenderCount + 20);
        nextBatch.forEach(item => grid.appendChild(this.createCard(item)));
        state.searchRenderCount += 20;
        const existingBtn = document.getElementById('load-more-btn');
        if(existingBtn) existingBtn.remove();
        if (state.searchRenderCount < state.searchResultItems.length) {
    // UPDATED: Using .crimson-glass-btn class
    elements.app.insertAdjacentHTML('beforeend', `<div class="load-more-container" id="load-more-btn"><button class="crimson-glass-btn" onclick="app.renderSearchGridChunk()">Load More</button></div>`);
}
    },

    /* =========================================
       6. MODAL SYSTEM
       ========================================= */
    async openModal(item) {
        const isOpen = elements.modal.classList.contains('open');
        const modalContent = elements.modal.querySelector('.modal-content');
        
        if (isOpen) {
            modalContent.classList.add('modal-switching');
            await new Promise(r => setTimeout(r, 350));
        }

        if (!isOpen) {
            window.history.pushState({modal: true}, null, "");
            document.body.classList.add('modal-active');
            if (window.innerWidth <= 768) this.setMobileDockVisibility(false);
            document.body.style.overflow = 'hidden'; 
            document.documentElement.style.overflow = 'hidden';
        }
        
        modalContent.scrollTop = 0;
        state.currentModalItem = item;

        // --- THE MISSING DEFINITIONS ---
        const title = item.title || item.name;
        const type = item.media_type || (item.title ? 'movie' : 'tv');
        // -------------------------------

        state.externalId = null; 
        state.youtubeId = null;

        ['m-age', 'm-runtime', 'imdb-badge', 'youtube-badge', 'm-seasons-section', 'm-season-content', 'm-collection-section'].forEach(id => {
            document.getElementById(id).style.display = 'none';
        });
        state.activeSeason = null;

        // QUALITY: Use 4K (Original) for the Modal Backdrop because 1080p wasn't enough
    const bg = item.backdrop_path ? CONFIG.imgOriginal + item.backdrop_path : '';
        const backdropImg = document.getElementById('m-backdrop');
        backdropImg.src = bg || ''; 
        backdropImg.style.opacity = bg ? '1' : '0';

        document.getElementById('m-title').innerText = title;
        document.getElementById('m-desc').innerText = item.overview || "No description.";
        document.getElementById('m-rating').innerText = `★ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}`;
        document.getElementById('m-date').innerText = (item.release_date || item.first_air_date || '').substr(0,4);
        document.getElementById('m-type').innerText = type.toUpperCase();

        this.updateModalButtons();

        if (isOpen) {
            setTimeout(() => {
                modalContent.classList.remove('modal-switching');
            }, 50);
        } else {
            elements.modal.classList.add('open');
        }

        const shareBtn = document.getElementById('btn-share');
        const newShareBtn = shareBtn.cloneNode(true); 
        delete newShareBtn.dataset.hoverBound; 
        shareBtn.parentNode.replaceChild(newShareBtn, shareBtn);
        newShareBtn.addEventListener('click', () => { this.shareItem(item); });
        this.addHoverEffect();

        Promise.all([api.getExtId(type, item.id), api.getAgeRating(type, item.id), api.getDetails(type, item.id), api.getVideos(type, item.id)])
        .then(([extIds, ageRating, details, videos]) => {
            if (extIds) { state.externalId = extIds; document.getElementById('imdb-badge').style.display = 'inline-flex'; }
            if (videos && videos.results) {
                const trailer = videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer') || videos.results.find(v => v.site === 'YouTube');
                if(trailer) { state.youtubeId = trailer.key; document.getElementById('youtube-badge').style.display = 'inline-flex'; }
            }
            if(ageRating) { const ageEl = document.getElementById('m-age'); ageEl.innerText = ageRating; ageEl.style.display = 'inline-flex'; }
            if (details) {
                if (type === 'movie' && details.runtime) {
                    const rtEl = document.getElementById('m-runtime'); rtEl.innerText = `${Math.floor(details.runtime/60)}h ${details.runtime%60}m`; rtEl.style.display = 'inline-flex';
                }
                if (type === 'movie' && details.belongs_to_collection) this.renderCollection(details.belongs_to_collection.id);
                if (type === 'tv' && details.seasons) this.renderSeasons(details.id, details.seasons);
            }
        });
    },

    async shareItem(item) {
        const btn = document.getElementById('btn-share');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<div class="spinner" style="width:14px; height:14px; border-width:2px; margin-right:8px;"></div>Generating...`;
        btn.style.pointerEvents = 'none';

        try {
            const container = document.getElementById('share-card-container');
            const title = item.title || item.name;
            const year = (item.release_date || item.first_air_date || '').substr(0,4);
            const type = item.media_type || (item.title ? 'movie' : 'tv');
            
            // 1. Get Details for Meta Tags
            const details = await api.getDetails(type, item.id);
            const ageRating = await api.getAgeRating(type, item.id);
            
            // Format Runtime
            let runtimeStr = '';
            if (type === 'movie' && details.runtime) {
                runtimeStr = `${Math.floor(details.runtime/60)}h ${details.runtime%60}m`;
            } else if (type === 'tv' && details.number_of_seasons) {
                runtimeStr = `${details.number_of_seasons} Season${details.number_of_seasons > 1 ? 's' : ''}`;
            }

            // Format Genres
            let genreStr = '';
            if (details.genres && details.genres.length > 0) {
                genreStr = details.genres.slice(0, 2).map(g => g.name).join(' • ');
            }

            // 2. High Res Poster URL
            const posterPath = item.poster_path ? (CONFIG.imgBase.replace('w500', 'original') + item.poster_path) : '';

            // 3. Populate DOM
            document.getElementById('sc-title-text').innerText = title;
            document.getElementById('sc-year-tag').innerText = year;
            
            const ageEl = document.getElementById('sc-age-tag');
            if (ageRating) { ageEl.innerText = ageRating; ageEl.style.display = 'inline-block'; } 
            else { ageEl.style.display = 'none'; }
            
            const runEl = document.getElementById('sc-runtime-tag');
            if (runtimeStr) { runEl.innerText = runtimeStr; runEl.style.display = 'inline-block'; } 
            else { runEl.style.display = 'none'; }
            
            document.getElementById('sc-genre-text').innerText = genreStr;

            // 4. Load Image SAFE (THE GRAY POSTER FIX)
            const imgEl = document.getElementById('sc-poster-img');
            
            // CRITICAL: Force anonymous mode for canvas capture
            imgEl.crossOrigin = "anonymous"; 
            
            await new Promise((resolve, reject) => {
                if(!posterPath) { resolve(); return; }
                
                imgEl.onload = resolve;
                imgEl.onerror = resolve;
                
                // TRICK: Add a random timestamp to the URL (?t=...)
                // This forces the browser to ignore the cache and fetch a fresh image
                // with the correct CORS headers allowed for screenshots.
                imgEl.src = posterPath + '?t=' + new Date().getTime(); 
            });

            // 5. Capture at 4K
            container.style.visibility = 'visible'; 
            await new Promise(r => setTimeout(r, 200)); 

            const canvas = await html2canvas(document.getElementById('share-card'), { 
                useCORS: true, 
                scale: 2, 
                backgroundColor: '#050505', 
                logging: false 
            });
            
            container.style.visibility = 'hidden'; 

            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error("Image generation failed");
                const filename = `KINO_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
                const file = new File([blob], filename, { type: 'image/png' });

                // --- NEW GOOGLE LINK GENERATION ---
                const googleLink = `https://www.google.com/search?q=${encodeURIComponent("Watch " + title + " " + year)}`;

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try { 
                        await navigator.share({ 
                            files: [file], 
                            title: title, 
                            text: `Check it out`, // The text you requested
                            url: googleLink       // The direct clickable link
                        }); 
                    } catch (e) {}
                } else {
                    // Desktop Fallback
                    const link = document.createElement('a'); 
                    link.download = filename; 
                    link.href = URL.createObjectURL(blob);
                    document.body.appendChild(link); link.click(); document.body.removeChild(link);
                    this.showToast("4K Image Downloaded!");
                }
            }, 'image/png', 1.0);

        } catch (err) { 
            console.error(err);
            this.showToast("Error generating image."); 
        } finally { 
            btn.innerHTML = originalText; 
            btn.style.pointerEvents = 'all'; 
        }
    },

    closeModal() { window.history.back(); },

    updateModalButtons() {
        const id = state.currentModalItem.id;
        const isMobile = window.innerWidth <= 768;

        const set = (btnId, list, iconType, label) => { 
            const el = document.getElementById(btnId); 
            if(!el) return;
            const isActive = state[list].some(i => i.id === id);
            
            if(isActive) el.classList.add('active'); 
            else el.classList.remove('active'); 

            // Restore original naming even on mobile
            if(isMobile) {
                el.innerHTML = ICONS[iconType] + `<span>${label}</span>`;
            }
        };

        const favBtn = document.getElementById('btn-fav');
        if(favBtn) {
            const isFav = state.favorites.some(i => i.id === id);
            favBtn.classList.toggle('active', isFav);
            const icon = isFav ? ICONS.heartFilled : ICONS.heartOutline;
            favBtn.innerHTML = icon + (isMobile ? "<span>Favorite</span>" : " Favorite");
        }

        set('btn-watch', 'watchlist', 'watchlist', 'Watchlist');
        set('btn-watched', 'watched', 'watched', 'Watched');
    },

    toggleList(listName) {
        if(!state.currentModalItem) return;
        const item = state.currentModalItem;
        const idx = state[listName].findIndex(i => i.id === item.id);
        const prettyName = listName.charAt(0).toUpperCase() + listName.slice(1);
        
        if(idx > -1) { 
            state[listName].splice(idx, 1); 
            this.showToast(`Removed from ${prettyName}`); 
        } else { 
            const exists = state[listName].some(i => i.id === item.id); 
            if(!exists) state[listName].push(item); 
            this.showToast(`Added to ${prettyName}`); 
        }
        
        this.saveState(); 
        this.updateModalButtons();
        
        if (state.currentView === 'favorites' || state.currentView === 'watchlist' || state.currentView === 'watched') { 
            this.renderListSection(state.currentView); 
        } else if (state.currentView === 'home' || state.currentView === 'search') {
            const cards = document.querySelectorAll(`.card[data-id="${item.id}"] .card-icon-container`);
            
            const isFav = state.favorites.some(i => i.id === item.id);
            cards.forEach(c => { 
                c.classList.remove('active', 'active-red', 'active-blue', 'active-green');
                if(isFav) { 
                    c.classList.add('active-red'); 
                    c.innerHTML = ICONS.heartFilled; 
                } else { 
                    c.innerHTML = ICONS.heartOutline; 
                } 
            });
        }
    },

    quickToggleFav(item, btn) {
        const idx = state.favorites.findIndex(i => i.id === item.id);
        if(idx > -1) { 
            state.favorites.splice(idx, 1); 
            btn.classList.remove('active-red'); 
            btn.classList.remove('active');     
            btn.innerHTML = ICONS.heartOutline; 
            this.showToast("Removed from Favorites"); 
        } else { 
            state.favorites.push(item); 
            btn.classList.add('active-red');    
            btn.innerHTML = ICONS.heartFilled; 
            this.showToast("Added to Favorites"); 
        }
        this.saveState(); 
        if (state.currentView === 'favorites') this.renderListSection('favorites');
    },

    openIMDB() { if(state.externalId) window.open(`https://www.imdb.com/title/${state.externalId}`, '_blank'); else this.showToast("IMDb link not available"); },
    openYouTube() { if(state.youtubeId) window.open(`https://www.youtube.com/watch?v=${state.youtubeId}`, '_blank'); else this.showToast("Trailer not available"); },

    renderSeasons(tvId, seasons) {
        const seasonList = document.getElementById('m-season-list');
        const contentArea = document.getElementById('m-season-content');
        seasonList.innerHTML = '';
        const validSeasons = seasons.filter(s => s.season_number > 0);
        if(validSeasons.length === 0) return;
        document.getElementById('m-seasons-section').style.display = 'block';
        let seasonToAutoOpen = validSeasons[0].season_number; 
        let foundIncomplete = false;

        validSeasons.forEach((season) => {
            const btn = document.createElement('div');
            btn.className = 'season-tab';
            btn.id = `tab-season-${season.season_number}`;
            let dotHtml = `<span class="status-dot"></span>`;
            btn.innerHTML = `Season ${season.season_number} ${dotHtml} <span class="season-chevron"></span>`;
            
            const isAiring = new Date(season.air_date) > new Date();
            const status = (state.tvProgress[tvId] && state.tvProgress[tvId][season.season_number]) || {};
            
            if(isAiring) btn.classList.add('future'); 
            else if (status.watchedEpisodes && status.totalEpisodes && status.watchedEpisodes.length >= status.totalEpisodes) btn.classList.add('completed');
            else if (status.watchedEpisodes && status.watchedEpisodes.length > 0) {
                btn.classList.add('incomplete');
                if (!foundIncomplete) { seasonToAutoOpen = season.season_number; foundIncomplete = true; }
            } else if (status.isWatchlist) btn.classList.add('watchlist');

            btn.onclick = () => {
                if (state.activeSeason === season.season_number) {
                    state.activeSeason = null; contentArea.style.display = 'none';
                    document.querySelectorAll('.season-tab').forEach(b => b.classList.remove('active'));
                } else {
                    document.querySelectorAll('.season-tab').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active'); state.activeSeason = season.season_number;
                    contentArea.style.display = 'block';
                    if(!state.tvProgress[tvId]) state.tvProgress[tvId] = {};
                    if(!state.tvProgress[tvId][season.season_number]) state.tvProgress[tvId][season.season_number] = { watchedEpisodes: [], isWatchlist: false };
                    state.tvProgress[tvId][season.season_number].totalEpisodes = season.episode_count;
                    this.loadEpisodes(tvId, season.season_number);
                    this.updateSeasonActionButtons(tvId, season.season_number);
                }
            };
            seasonList.appendChild(btn);
        });
    },

    async renderCollection(collectionId) {
        const list = document.getElementById('m-collection-list');
        list.innerHTML = '<div style="color:#888; font-size:0.9rem;">Loading collection...</div>';
        document.getElementById('m-collection-section').style.display = 'block';
        const data = await api.getCollection(collectionId);
        if(!data || !data.parts || data.parts.length === 0) { document.getElementById('m-collection-section').style.display = 'none'; return; }
        document.getElementById('m-collection-title').innerText = data.name;
        const parts = data.parts.filter(p => p.release_date).sort((a,b) => new Date(a.release_date) - new Date(b.release_date));
        list.innerHTML = '';
        parts.forEach(p => {
            const img = p.poster_path ? CONFIG.imgBase + p.poster_path : '';
            const div = document.createElement('div');
            div.className = 'collection-card';
            div.onclick = () => { api.getDetails('movie', p.id).then(fullItem => { app.openModal(fullItem || p); }); };
            // Added loading="lazy" for performance
div.innerHTML = `<img src="${img}" class="c-poster" loading="lazy" onerror="this.style.opacity='0.3'"><div class="c-info"><div class="c-title">${p.title}</div><div class="c-year">${p.release_date.substr(0,4)}</div></div>`;
            list.appendChild(div);
        });
    },

    loadEpisodes(tvId, seasonNum) {
        const epList = document.getElementById('m-episode-list');
        epList.className = 'episode-list';
        epList.innerHTML = '<div style="color:#888; padding:10px;">Loading episodes...</div>';
        api.getSeasonDetails(tvId, seasonNum).then(data => {
            if(!data || !data.episodes) { epList.innerHTML = '<div style="color:#888; padding:10px;">No episodes found.</div>'; return; }
            state.currentSeasonEpisodes = data.episodes;
            if(state.tvProgress[tvId] && state.tvProgress[tvId][seasonNum]) state.tvProgress[tvId][seasonNum].totalEpisodes = data.episodes.length;
            epList.innerHTML = '';
            data.episodes.forEach(ep => {
                const isWatched = state.tvProgress[tvId][seasonNum].watchedEpisodes.includes(ep.id);
                const div = document.createElement('div');
                div.className = 'episode-card';
                // OPTIMIZATION: Use w500 (Standard) for episode thumbnails
                const img = ep.still_path ? CONFIG.imgBase + ep.still_path : '';
                // Added loading="lazy" for performance
const imgHtml = img ? `<img src="${img}" class="ep-img" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">` : '';
                const placeholderHtml = `<div class="ep-img" style="${img ? 'display:none;' : 'display:flex;'} align-items:center; justify-content:center; color:#555; font-size:0.8rem; font-weight:700;">KINO</div>`;
                const runtime = ep.runtime ? `${ep.runtime}m` : '';
                div.onclick = function() { app.toggleEpisode(tvId, seasonNum, ep.id, this.querySelector('.ep-check')); };
                div.innerHTML = `<div class="ep-check ${isWatched ? 'watched' : ''}"></div><div style="position:relative;">${imgHtml}${placeholderHtml}</div><div class="ep-info"><div class="ep-title">${ep.episode_number}. ${ep.name}</div><div class="ep-meta">${runtime}</div><div style="font-size:0.8rem; color:#aaa; margin-top:4px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${ep.overview}</div></div>`;
                epList.appendChild(div);
            });
            epList.classList.add('visible');
            this.saveState();
        });
    },

    toggleEpisode(tvId, seasonNum, epId, btn) {
        const sState = state.tvProgress[tvId][seasonNum];
        const idx = sState.watchedEpisodes.indexOf(epId);
        if(idx > -1) { sState.watchedEpisodes.splice(idx, 1); btn.classList.remove('watched'); this.showToast("Episode unmarked"); } 
        else { 
            sState.watchedEpisodes.push(epId); btn.classList.add('watched'); 
            if(!state.watched.some(i => i.id === tvId)) { state.watched.push(state.currentModalItem); this.updateModalButtons(); }
            this.showToast("Episode marked as Watched"); 
        }
        this.saveState(); this.updateSeasonActionButtons(tvId, seasonNum); this.refreshSeasonTabs(tvId);
    },

    toggleSeasonStatus(type) {
        if(!state.currentModalItem) return;
        const tvId = state.currentModalItem.id;
        const seasonNum = state.activeSeason;
        const sState = state.tvProgress[tvId][seasonNum];
        if (type === 'watched') {
            const isAll = sState.watchedEpisodes.length >= sState.totalEpisodes;
            if(isAll) { sState.watchedEpisodes = []; this.showToast("Season unmarked"); } 
            else { 
                sState.watchedEpisodes = state.currentSeasonEpisodes.map(e => e.id); 
                if(!state.watched.some(i => i.id === tvId)) state.watched.push(state.currentModalItem);
                this.showToast("Season marked as Watched"); 
            }
            this.loadEpisodes(tvId, seasonNum);
        } else if (type === 'watchlist') {
            sState.isWatchlist = !sState.isWatchlist;
            if(sState.isWatchlist) { if(!state.watchlist.some(i => i.id === tvId)) state.watchlist.push(state.currentModalItem); this.showToast("Season added to Watchlist"); } 
            else { this.showToast("Season removed from Watchlist"); }
        }
        this.saveState(); this.updateSeasonActionButtons(tvId, seasonNum); this.updateModalButtons(); this.refreshSeasonTabs(tvId);
    },

    updateSeasonActionButtons(tvId, seasonNum) {
        const sState = state.tvProgress[tvId] && state.tvProgress[tvId][seasonNum];
        const btnWatched = document.getElementById('btn-season-watched');
        const btnWatchlist = document.getElementById('btn-season-watchlist');
        btnWatched.className = 'season-btn'; btnWatchlist.className = 'season-btn';
        const isAllWatched = sState && sState.totalEpisodes && sState.watchedEpisodes.length >= sState.totalEpisodes;
        const isWatchlist = sState && sState.isWatchlist;
        if (isAllWatched) { btnWatched.classList.add('active-watched'); btnWatched.innerText = 'Watched'; } else { btnWatched.innerText = 'Mark Watched'; }
        if (isWatchlist) { btnWatchlist.classList.add('active-watchlist'); btnWatchlist.innerText = 'In Watchlist'; } else { btnWatchlist.innerText = 'Add to Watchlist'; }
    },

    refreshSeasonTabs(tvId) {
        const tabs = document.querySelectorAll('.season-tab');
        const seasons = state.tvProgress[tvId];
        tabs.forEach(t => {
            const cleanText = t.innerText.trim(); const num = parseInt(cleanText.replace('Season ', ''));
            if(!isNaN(num) && seasons[num]) {
                t.classList.remove('completed', 'incomplete', 'watchlist');
                const s = seasons[num];
                if(s.totalEpisodes && s.watchedEpisodes.length >= s.totalEpisodes) t.classList.add('completed');
                else if(s.watchedEpisodes.length > 0) t.classList.add('incomplete');
                else if(s.isWatchlist) t.classList.add('watchlist');
            }
        });
    },

   resetScroll() {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        if (window.innerWidth <= 768) this.setMobileDockVisibility(true);
    },
  

/* =========================================
       PHASE 3: OBSIDIAN MOBILE METHODS
       ========================================= */

    // 1. The Vanishing Dock Logic
    setMobileDockVisibility(visible) {
        const dock = document.getElementById('mobile-dock');
        if (!dock) return;
        if (visible) {
            dock.classList.remove('m-dock-hidden');
        } else {
            dock.classList.add('m-dock-hidden');
        }
    },

    
    // 2. Double-Tap Home "Railgun" & Master Reset
    handleMobileHomeTap() {
        const now = Date.now();
        const DOUBLE_TAP_THRESHOLD = 250;

        if (now - state.lastHomeTap < DOUBLE_TAP_THRESHOLD) {
            // DOUBLE TAP: Trigger Railgun Search
            this.openMobileSearch();
        } else {
            // SINGLE TAP: THE MASTER RESET
            // 1. Close Search
            this.closeMobileSearch();
            
            // 2. Close Hub
            if (state.isHubOpen) this.toggleMobileHub();
            
            // 3. Close Director Mode / Settings
            if (document.body.classList.contains('director-mode-active')) {
                this.closeSettings(); 
            }
            elements.settingsModal.classList.remove('open');
            
            // 4. Close Stats / Legend
            this.closeStats();
            const ladder = document.getElementById('st-ladder');
            if (ladder) {
                ladder.classList.remove('open');
                document.body.style.overflow = '';
            }

            // 5. Close Movie Modal
            if (elements.modal.classList.contains('open')) {
                elements.modal.classList.remove('open');
                document.body.classList.remove('modal-active');
                if (window.innerWidth <= 768) this.setMobileDockVisibility(true);
            }

            // 6. Go Home
            if (state.currentView !== 'home') {
                this.goHome();
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        
            // Feedback Glow
            const circle = document.querySelector('.m-home-core svg'); // Targeted SVG for glow
            if (circle) {
                circle.style.filter = 'drop-shadow(0 0 5px var(--accent-color))';
                setTimeout(() => circle.style.filter = '', 300);
            }
        } 
        state.lastHomeTap = now;
    },

    /* --- The Morphing Hub Logic (State Aware) --- */
    toggleMobileHub(forceClose = false) {
        const dock = document.getElementById('mobile-dock');
        const hubStrip = document.getElementById('m-hub-strip');
        
        // CASE 1: FORCE CLOSE (Triggered by Back Button/Gesture)
        if (forceClose) {
            state.isHubOpen = false;
            dock.classList.remove('m-hub-active');
            
            // Clean up content after animation
            setTimeout(() => {
                if(hubStrip) hubStrip.classList.add('hidden');
                if (!document.body.classList.contains('m-search-active')) {
                    this.updateNav(state.currentView);
                }
            }, 400);
            return;
        }

        // CASE 2: USER INTERACTION (Clicking the Burger)
        if (state.isHubOpen) {
            // If it's open and you click toggle, we simulate a "Back" action
            // This triggers the 'popstate' listener above, which runs the closing animation.
            window.history.back();
        } else {
            // OPENING: Push a state so the Back Button has something to catch
            window.history.pushState({hub: true}, null, "");
            state.isHubOpen = true;
            
            // Trigger Expansion
            dock.classList.add('m-hub-active');
            if(hubStrip) hubStrip.classList.remove('hidden');
            
            // Global listener: Close if user clicks outside
            const closeOnOutside = (e) => {
                if (!dock.contains(e.target) && state.isHubOpen) {
                    // Clicked outside? Go Back.
                    window.history.back();
                    document.removeEventListener('mousedown', closeOnOutside);
                }
            };
            setTimeout(() => document.addEventListener('mousedown', closeOnOutside), 10);
        }
    },

    // HELPER: Closes the Hub first, then launches the full-screen layer
    morphAndOpen(action) {
        // 1. Collapse the dock
        this.toggleMobileHub();
        
        // 2. Open the layer after the dock starts shrinking
        setTimeout(() => {
            if (action === 'identity') app.openIdentity();
            else if (action === 'stats') app.openStats(); 
            else if (action === 'help') app.openHelp();
        }, 350); 
    },

    // 4. Mobile Search Layer
    openMobileSearch() {
        const container = document.getElementById('m-search-container');
        const input = document.getElementById('m-search-input');
        const results = document.getElementById('mobile-search-overlay');
        
        // 1. If already open, clicking again = Close (Go Back)
        if (container.classList.contains('m-search-open')) {
            window.history.back();
            return;
        }

        // 2. OPENING: Push State
        window.history.pushState({search: true}, null, "");

        container.classList.add('m-search-open');
        document.body.classList.add('m-search-active'); 
        results.classList.remove('m-layer-hidden');
        results.innerHTML = '<div id="m-search-results"></div>'; 
        
        setTimeout(() => input.focus(), 400);

        // Input Logic...
        input.oninput = (e) => {
            const q = e.target.value.trim();
            const resultArea = document.getElementById('m-search-results');
            
            if(q.length > 0) {
                api.search(q).then(async data => {
                    if(!data || !data.results) return;
                    resultArea.innerHTML = '';

                    const topResult = data.results[0];
                    let finalResults = data.results.filter(i => i.media_type === 'movie' || i.media_type === 'tv');

                    // --- SMART PERSON LOGIC (Ported from Desktop) ---
                    if (topResult && topResult.media_type === 'person') {
                        const credits = await api.getPersonCredits(topResult.id);
                        if (credits) {
                            let works = (topResult.known_for_department === 'Directing') ? credits.crew.filter(w => w.job === 'Director') : credits.cast;
                            
                            // Combine Person's Works + Normal Search Results
                            let combined = [...works, ...finalResults];
                            
                            // Remove Duplicates
                            combined = combined.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
                            
                            // Sort by Popularity
                            combined.sort((a,b) => b.popularity - a.popularity);
                            
                            finalResults = combined;
                        }
                    }
                    // -----------------------------------------------

                    finalResults.filter(i => i.poster_path).forEach(item => {
                        const card = this.createCard(item);
                        card.onclick = () => { 
                            this.closeMobileSearch(true); 
                            setTimeout(() => this.openModal(item), 50); 
                        };
                        resultArea.appendChild(card);
                    });
                });
            } else {
                resultArea.innerHTML = '';
            }
        };
    },

    closeMobileSearch(forceClose = false) {
        const container = document.getElementById('m-search-container');
        
        // If not open, do nothing (prevents accidental history manipulation)
        if (!container.classList.contains('m-search-open')) return;

        // If called by UI click (X button), use History Back to keep sync
        if (!forceClose) {
            window.history.back();
            return;
        }

        // The Actual Animation Logic
        const input = document.getElementById('m-search-input');
        const resultsLayer = document.getElementById('mobile-search-overlay');
        
        container.classList.remove('m-search-open');
        document.body.classList.remove('m-search-active');
        resultsLayer.classList.add('m-layer-hidden');
        input.value = '';
        input.blur();
    },
};

document.addEventListener('DOMContentLoaded', () => app.init());
