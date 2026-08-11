// ----------------------------- GLOBALS & CONFIG -------------------------
  const KEY = '6b4357c41d9c606e4d7ebe2f4a8850ea';
  const BASE = 'https://api.themoviedb.org/3';
  const POSTER = 'https://image.tmdb.org/t/p/w342';
  const BACKDROP = 'https://image.tmdb.org/t/p/w780';
  const CAST_IMG = 'https://image.tmdb.org/t/p/w185';
  const STILL_IMG = 'https://image.tmdb.org/t/p/w300';
  const FALLBACK_IMG = "https://sites.duke.edu/dek23/wp-content/themes/koji/assets/images/default-fallback-image.png";
  const FALLBACK_PROFILE = "https://i.pinimg.com/474x/13/74/20/137420f5b9c39bc911e472f5d20f053e.jpg";
  
  // --- PLAYER.JS GLOBAL EVENTS ---
  window.premiumPlayerDuration = 0;
  window.currentPremiumTime = 0;
  
  function PlayerjsEvents(event, id, info) {
      if (id === "premium-player-js") {
          if (event === "duration") {
              window.premiumPlayerDuration = info;
          }
          if (event === "time") {
              window.currentPremiumTime = info; 
              const duration = window.premiumPlayerDuration;
              const currentTime = info;
              const btn = document.getElementById('nextEpBtn');
              
              if (duration > 0 && btn && currentType === 'tv') {
                  const nextEpExists = window.episodesData && window.episodesData.some(e => e.episode_number == (currentE + 1));
                  const nextSeasonExists = document.querySelector(`.season-dropdown option[value="${currentS + 1}"]`);
                  
                  if (nextEpExists || nextSeasonExists) {
                      if (duration - currentTime <= 60) {
                          btn.classList.add('show');
                      } else {
                          btn.classList.remove('show');
                      }
                      
                      const bingeMode = localStorage.getItem('bingeMode') !== 'false';
                      if (duration - currentTime <= 1 && bingeMode) {
                          playNextEpisode();
                      }
                  }
              }
          }
      }
  }
  
  let currentType, currentId, currentS = 1, currentE = 1, trailerKey = null, searchTimer;
  window.premiumFetchController = null;
  let homePage = 1, searchPage = 1, currentSearchQuery = '', currentSearchFilter = 'movie', activeServerIndex = 0;
  let currentImdbId = null, currentPosterPath = null, currentTitle = '';
  
  let allChannels = [];
  
  const getStorage = (k) => JSON.parse(localStorage.getItem(k) || '[]');
  const setStorage = (k, d) => localStorage.setItem(k, JSON.stringify(d));
  const sanitize = (t) => {
    if (!t) return '';
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  };
  
  const setActiveUI = (selector, activeEl) => {
    document.querySelectorAll(selector).forEach(i => i.classList.remove('active'));
    if (activeEl) activeEl.classList.add('active');
  };
  
  const toggleLoader = (show) => {
    const loader = document.getElementById('pageLoader');
    if (show) {
      loader.style.display = 'flex';
      loader.style.opacity = '1';
      loader.style.visibility = 'visible';
    } else {
      loader.style.opacity = '0';
      setTimeout(() => {
        if (loader.style.opacity === '0') loader.style.display = 'none';
      }, 300);
    }
  };
  
  function handleCardClick(mediaType, id) {
    if (mediaType === 'person') {
      window.location.hash = `person/${id}`;
    } else {
      window.location.hash = `${mediaType}/${id}`;
    }
  }
  
  function createCard(m) {
    const mediaType = m.media_type || (m.title ? 'movie' : (m.name ? (m.first_air_date ? 'tv' : 'person') : 'movie'));
    const title = sanitize(m.title || m.name);
    const date = (m.release_date || m.first_air_date || '').split('-')[0];
    const rating = m.vote_average ? m.vote_average.toFixed(1) : 'N/A';
  
    if (mediaType === 'person' || (!m.title && !m.name && m.profile_path)) {
      const profileImg = m.profile_path ? (POSTER + m.profile_path) : FALLBACK_PROFILE;
      return `<div class="actor-card" onclick="handleCardClick('person', '${m.id}')">
                <img src="${profileImg}" class="actor-avatar" onerror="this.src='${FALLBACK_PROFILE}'; this.onerror=null;">
                <div class="actor-name">${title}</div>
                <span class="actor-badge"><i class="fa fa-user-circle me-1"></i>Actor</span>
              </div>`;
    }
  
    let img = m.poster_path ? (POSTER + m.poster_path) : FALLBACK_IMG;
    return `<div class="movie-card" onclick="handleCardClick('${mediaType}', '${m.id}')">
              <div class="poster-wrapper">
                <img src="${img}" class="poster-img" loading="lazy" onerror="this.src='${FALLBACK_IMG}'; this.onerror=null;">
              </div>
              <div class="card-body-content">
                <div class="card-title-text">${title}</div>
                <div class="card-meta-text">
                  <span>${date || 'N/A'}</span>
                  <span class="badge bg-light text-dark border px-2 py-1"><i class="fa fa-star text-warning me-1"></i>${rating}</span>
                </div>
              </div>
            </div>`;
  }
  
  window.addEventListener('hashchange', router);
  
  window.onload = () => {
  localStorage.setItem('playbackMode', 'with_ads');
  
  if (!localStorage.getItem('maintenance_servers_set')) {
      localStorage.setItem('defaultMovieServer', '1'); 
      localStorage.setItem('defaultTvServer', '0');    
      localStorage.setItem('maintenance_servers_set', 'true');
  }

  router();
  applySavedTheme();
};
  
  window.applyPerformanceMode = function() {
      const isLowEnd = localStorage.getItem('performanceMode') !== 'false';
      
      if (isLowEnd) {
          document.body.classList.add('performance-mode');
      } else {
          document.body.classList.remove('performance-mode');
      }
  };
  
  window.togglePerformanceMode = function(checkbox) {
      const isChecked = checkbox.checked;
      
      updatePref('performanceMode', isChecked);
      applyPerformanceMode();
  
      if (isChecked) {
          const previewToggle = document.getElementById('previewToggle');
          
          const isHoverOn = localStorage.getItem('hoverPreviews') !== 'false';
          
          if (isHoverOn) {
              localStorage.setItem('hoverPreviews', 'false');
              if (previewToggle) {
                  previewToggle.checked = false;
              }
              setTimeout(() => {
                  Swal.fire({
                      toast: true,
                      position: 'top-end',
                      icon: 'info',
                      title: 'Hover Previews Disabled for Performance',
                      showConfirmButton: false,
                      timer: 2000,
                      background: 'var(--surface)',
                      color: 'var(--text-main)'
                  });
              }, 1500); 
          }
      }
  };
  
  document.addEventListener('DOMContentLoaded', applyPerformanceMode);
  
  function goHome() {
    document.getElementById('searchInput').value = '';
    window.location.hash = '';
  }
  
  window.goBack = function() {
  if (window.history.length > 1) {
    window.history.back(); 
  } else {
    goHome(); 
  }
  };
  
  window.isPlayerActive = false;
  
  async function router() {
  if (window.premiumFetchController) {
      window.premiumFetchController.abort();
  }
  toggleLoader(true);
  const h = window.location.hash;
  
  const openModals = document.querySelectorAll('.modal.show');
  openModals.forEach(m => {
      const instance = bootstrap.Modal.getInstance(m);
      if (instance) instance.hide();
  });
  document.body.classList.remove('modal-open');
  document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
  
  document.querySelectorAll('.hero-video-container').forEach(c => c.innerHTML = '');
  if (typeof heroVideoTimer !== 'undefined') clearTimeout(heroVideoTimer);
  
  const isDetailsRoute = h.startsWith('#movie/') || h.startsWith('#tv/');
  
  if (!isDetailsRoute && window.isPlayerActive && h !== '#livetv') {
    document.getElementById('playerContainer').innerHTML = '';
    window.isPlayerActive = false;
  }
  
  const sections = [
    '#home-view', '#search-view', '#details-view', 
    '#person-view', '#list-view', '#settings-view', '#livetv-view', '#about-view', '#sports-view'
  ];
  sections.forEach(v => {
    document.querySelector(v).style.display = 'none';
  });
  
  const topNavbar = document.querySelector('.navbar-custom');
  const defaultNav = document.getElementById('defaultNavContent');
  const backNav = document.getElementById('backNavContent');
  const backTitle = document.getElementById('backNavTitle');
  
  if (h.startsWith('#search') || h === '#wishlist' || h === '#settings' || h === '#livetv') {
    if (topNavbar) topNavbar.classList.add('d-none');
  } else {
    if (topNavbar) topNavbar.classList.remove('d-none');
  
    if (h === '' || h === '#') {
      if (defaultNav) defaultNav.classList.remove('d-none');
      if (backNav) backNav.classList.add('d-none');
    } else {
      if (defaultNav) defaultNav.classList.add('d-none');
      if (backNav) backNav.classList.remove('d-none');
  
      let title = "AS CINEPLEX";
      if (h === '#history') title = "History";
      else if (h === '#livetv') title = "Live TV";
      else if (h === '#about') title = "Developer Profile";
      else if (h.startsWith('#movie/') || h.startsWith('#tv/') || h.startsWith('#person/')) title = "Loading...";
  
      if (backTitle) backTitle.innerText = title;
    }
  }
  
  document.querySelectorAll('.bottom-nav-item').forEach(btn => btn.classList.remove('active'));
  if (h === '' || h === '#') document.getElementById('nav-home')?.classList.add('active');
  else if (h.startsWith('#search')) document.getElementById('nav-search')?.classList.add('active');
  else if (h === '#livetv') document.getElementById('nav-livetv')?.classList.add('active');
  else if (h === '#wishlist') document.getElementById('nav-wishlist')?.classList.add('active');
  else if (h === '#settings') document.getElementById('nav-settings')?.classList.add('active');
  
  const dlContainer = document.getElementById('dlIframeContainer');
  const dlIframe = document.getElementById('dlIframe');
  if (dlContainer && !dlContainer.classList.contains('d-none')) {
    dlContainer.classList.add('d-none');
    if (dlIframe) dlIframe.src = ''; 
  }
  
  try {
    if (h === '#settings') {
      document.getElementById('settings-view').style.display = 'block';
      initSettingsUI();
    } 
    else if (h === '#wishlist' || h === '#history') {
      document.getElementById('list-view').style.display = 'block';
      renderListPage(h.slice(1));
    } 
    else if (h === '#livetv') {
      document.getElementById('livetv-view').style.display = 'block';
      await loadLiveTv();
    } 
    else if (h === '#sports') {
      document.getElementById('sports-view').style.display = 'block';
      await loadSports();
    }
    else if (h === '#about') {
      document.getElementById('about-view').style.display = 'block';
      await loadAboutPage();
    } 
    else if (isDetailsRoute) {
      const [t, i] = h.slice(1).split('/');
      if (currentType !== t || currentId !== i || !window.isPlayerActive) {
         currentType = t;
         currentId = i;
         document.getElementById('details-view').style.display = 'block';
         await loadDetails(t, i);
      } else {
         document.getElementById('details-view').style.display = 'block';
      }
    } 
    else if (h.startsWith('#person/')) {
      document.getElementById('person-view').style.display = 'block';
      await loadPerson(h.split('/')[1]);
    } 
    else if (h.startsWith('#search')) {
      document.getElementById('search-view').style.display = 'block';
      
      let query = "";
      if (h.startsWith('#search/')) {
          query = decodeURIComponent(h.split('/')[1]);
      }
      
      if (query) {
          // NAYA UPDATE: Router ko filter reset karne se roko agar pehle se set ho chuka hai (suggestions click ke dauran)
          if (query !== currentSearchQuery) {
              document.querySelectorAll('.filter-btn').forEach(b => {
                  b.classList.remove('active', 'btn-primary');
                  b.classList.add('btn-light');
              });
              const activeFilterBtn = document.getElementById(`filter-${currentSearchFilter}`);
              if (activeFilterBtn) {
                  activeFilterBtn.classList.add('active', 'btn-primary');
                  activeFilterBtn.classList.remove('btn-light');
              }
          }
          await performSearch(query);
      } else {
          currentSearchQuery = ''; 
          document.getElementById('searchGrid').innerHTML = `
            <div class="text-center text-muted" style="grid-column: 1 / -1; min-height: 50vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
              <div>
                <i class="fa fa-search mb-3" style="font-size: 3rem;"></i>
                <h5 class="fw-bold">Search</h5>
                <p class="small mb-0">Type something to find movies, series, or actors...</p>
              </div>
            </div>
          `;
          document.getElementById('searchLoadMore').classList.add('d-none');
          
          const searchBox = document.getElementById('searchInput');
          if (searchBox) {
            searchBox.value = '';
            setTimeout(() => searchBox.focus(), 100);
          }
      }
    } 
    else {
      document.getElementById('home-view').style.display = 'block';
      await loadHome();
    }
  } catch (e) {
    console.error("Routing error:", e);
  } finally {
    window.scrollTo(0, 0);
    toggleLoader(false);
  }
  }
  
  window.currentEpView = 'thumb'; 
  window.episodesData = []; 
  
  window.switchSeason = async function(s) {
  currentS = parseInt(s);
  currentE = 1; 
  await loadEpisodes(currentS);
  }
  
  window.renderEpisodes = function() {
    const s = currentS;
    const container = document.getElementById('episodeList');
    if(!container) return;
  
    if (currentEpView === 'list') {
        container.innerHTML = window.episodesData.map(e => `
            <div class="ep-item-list ${e.episode_number == currentE ? 'active' : ''}" onclick="changeEpisode(${s}, ${e.episode_number})">
                <div class="ep-num">${e.episode_number}.</div>
                <div class="ep-title text-truncate">${sanitize(e.name)}</div>
                <div class="ep-play-icon"><i class="fa fa-play"></i></div>
            </div>
        `).join('');
    } else {
        container.innerHTML = window.episodesData.map(e => `
            <div class="ep-item-thumb ${e.episode_number == currentE ? 'active' : ''}" onclick="changeEpisode(${s}, ${e.episode_number})">
                <div class="img-wrapper shadow-sm">
                    <img src="${e.still_path ? STILL_IMG + e.still_path : FALLBACK_IMG}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
                </div>
                <div class="ep-meta">
                    <div class="ep-title-top">Ep ${e.episode_number} ${e.episode_number == currentE ? '<i class="fa fa-play ms-2" style="font-size: 0.8rem;"></i>' : ''}</div>
                    <div class="ep-title-sub text-truncate">${sanitize(e.name)}</div>
                </div>
            </div>
        `).join('');
    }
  }
  
  window.toggleEpView = function(mode) {
    currentEpView = mode;
    const btns = document.querySelectorAll('.view-toggle-btn');
    if(btns.length > 1) {
       btns[0].classList.toggle('active', mode === 'list');
       btns[1].classList.toggle('active', mode === 'thumb');
    }
    renderEpisodes(); 
  }
  
  window.changeEpisode = function(s, e) {
  currentS = s;
  currentE = e;
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  renderEpisodes();
  
  const h = getStorage('watchHistory');
  const idx = h.findIndex(x => x.id == currentId);
  if (idx > -1) {
      h[idx].season = s;
      h[idx].episode = e;
      setStorage('watchHistory', h);
  }
  
  const dlContainer = document.getElementById('dlIframeContainer');
  if(dlContainer) dlContainer.classList.add('d-none');
  const dlIframe = document.getElementById('dlIframe');
  if(dlIframe) dlIframe.src = "";
  
  updateDownloadLabel();
  
  const playbackMode = localStorage.getItem('playbackMode') || 'without_ads';
  
  if (playbackMode === 'without_ads') {
      renderPremiumServers();
  } else {
      let srvIndex = activeServerIndex === -1 ? 0 : activeServerIndex;
      if (SERVERS[srvIndex]) {
          initPlayer(SERVERS[srvIndex].t);
      } else {
          buildServerButtons(true);
      }
  }
  };
  
  async function loadHome(append = false) {
  const container = document.getElementById('home-view');
  
  if (!append) {
    homePage = 1;
    
    if (typeof vibeContainer !== 'undefined' && vibeContainer) vibeContainer.remove();
    
    container.innerHTML = '';
    
    try {
       const trendRes = await fetch(`${BASE}/trending/all/day?api_key=${KEY}`);
       const trendData = await trendRes.json();
       const carouselItems = trendData.results.slice(0, 5); 
       renderHeroCarousel(carouselItems, container);
    } catch(e) { console.error("Carousel load failed", e); }
    
    const history = getStorage('watchHistory');
    if (history.length) {
      const historyHtml = history.map(item => `
  <div class="movie-card position-relative">
    <button class="position-absolute shadow-sm"
            style="top: 8px; right: 8px; z-index: 10; width: 28px; height: 28px; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.6); color: #fff; border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(4px); transition: all 0.2s ease; cursor: pointer;"
            onmouseover="this.style.background='rgba(239, 68, 68, 0.9)'; this.style.borderColor='transparent';"
            onmouseout="this.style.background='rgba(0, 0, 0, 0.6)'; this.style.borderColor='rgba(255,255,255,0.2)';"
            onclick="event.stopPropagation(); removeFromHistory('${item.id}', this)" title="Remove from history">
        <i class="fa fa-trash-can" style="font-size: 0.75rem;"></i>
    </button>
  
    <div class="poster-wrapper" onclick="directResume('${item.type}', '${item.id}', ${item.season || 1}, ${item.episode || 1})">
      <img src="${item.poster ? POSTER + item.poster : FALLBACK_IMG}" class="poster-img">
      
      <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
           style="background: rgba(0,0,0,0.5); opacity: 0; transition: 0.3s;" 
           onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">
          <i class="fa fa-play-circle text-white shadow-lg" style="font-size: 3.5rem;"></i>
      </div>
      
      <div class="position-absolute bottom-0 start-0 w-100 p-2" style="background:rgba(0,0,0,0.7)">
        <span class="badge bg-primary w-100">${item.type === 'tv' ? `S${item.season}:E${item.episode}` : 'Movie'}</span>
      </div>
    </div>
    
    <div class="card-body-content" onclick="handleCardClick('${item.type}', '${item.id}')">
        <div class="card-title-text text-truncate">${sanitize(item.title)}</div>
    </div>
  </div>`).join('');
  
      container.insertAdjacentHTML('beforeend', `
        <div class="mb-5 pt-2" id="continueWatchingSection">
          <h5 class="section-header mb-4">CONTINUE WATCHING</h5>
          <div class="horizontal-scroll">${historyHtml}</div>
        </div>`);
  
  window.directResume = function(type, id, season, episode) {
    window.autoResumeTrigger = { season, episode };
    window.location.hash = `${type}/${id}`;
  };
  
  window.removeFromHistory = function(id, btnElement) {
    let history = getStorage('watchHistory');
    history = history.filter(x => x.id != id);
    setStorage('watchHistory', history);
    
    if (btnElement) {
        const card = btnElement.closest('.movie-card');
        if (card) card.remove();
        
        if (history.length === 0) {
            const section = document.getElementById('continueWatchingSection');
            if (section) section.remove();
        }
    } else {
        loadHome(); 
    }
  
    Swal.fire({ 
      toast: true, 
      position: 'top-end', 
      icon: 'success', 
      title: 'Removed from history', 
      showConfirmButton: false, 
      timer: 1500,
      background: 'var(--surface)',
      color: 'var(--text-main)'
    });
  };
  
    }
  }
  
  const categories = [
    { label: 'Trending Now', url: `/trending/all/day?page=${homePage}` },
    { label: 'Popular Series', url: `/tv/popular?page=${homePage}` },
    { label: 'Action Hits', url: `/discover/movie?with_genres=28&page=${homePage}` }
  ];
  
  for (const cat of categories) {
    try {
      const response = await fetch(`${BASE}${cat.url}&api_key=${KEY}`);
      const data = await response.json();
      
      let section = document.getElementById(`section-${cat.label.replace(/\s/g, '')}`);
      if (!section) {
        section = document.createElement('div');
        section.id = `section-${cat.label.replace(/\s/g, '')}`;
        section.className = "mb-5";
        section.innerHTML = `<h5 class="section-header mb-4">${cat.label}</h5><div class="grid-container grid-target"></div>`;
        container.appendChild(section);
      }
      
      const cardsHtml = data.results.map(movie => createCard(movie)).join('');
      section.querySelector('.grid-target').insertAdjacentHTML('beforeend', cardsHtml);
    } catch (err) {
      console.error(`Failed to load ${cat.label}:`, err);
    }
  }
  
  if (!document.getElementById('homeLoadMore')) {
    container.insertAdjacentHTML('beforeend', `
      <div class="text-center my-5">
        <button id="homeLoadMore" class="btn btn-primary px-5 rounded-pill fw-bold" onclick="loadHome(true)">Load More</button>
      </div>`);
  }
  homePage++;
  attachPreviewListeners();
  }
  
  
  function updateDownloadLabel() {
    const label = document.getElementById('dlTargetLabel');
    if (label) {
      label.innerText = currentType === 'tv' ? `Target: S${currentS} E${currentE}` : `Target: Movie`;
    }
  }
  
  function renderMetadata(m, c) {
    const meta = document.getElementById('metaContent');
    const title = sanitize(m.title || m.name);
    const overview = sanitize(m.overview) || 'No description available.';
    const isLongDesc = overview.length > 150;
    
  let trailerSectionHtml = '';
  
  if (window.availableTrailers && window.availableTrailers.length > 0) {
      const listHtml = window.availableTrailers.map(vid => `
          <div class="d-flex justify-content-between align-items-center mb-2 rounded-3" 
               style="background: var(--bg-light); border: 1px solid var(--border); cursor: pointer; transition: all 0.2s ease; padding: 12px;"
               onmouseover="this.style.borderColor='var(--primary)'; this.style.transform='translateY(-2px)';"
               onmouseout="this.style.borderColor='var(--border)'; this.style.transform='none';"
               onclick="playInlineTrailer('${vid.key}', '${sanitize(vid.name).replace(/'/g, "\\'")}')">
              
              <span class="fw-bold" style="width: 85%; font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${sanitize(vid.name)}</span>
              
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-main);">
                 <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
          </div>
      `).join('');
  
      trailerSectionHtml = `
      <div class="card border-0 rounded-4 shadow-sm mb-4" style="background: var(--surface); border: 1px solid var(--border) !important;">
        <div class="card-body">
          <h5 class="fw-bold mb-4">Trailers</h5>
          
          <div id="inlineTrailerContainer" class="mb-4 d-none" style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2);"></div>
          
          ${listHtml}
        </div>
      </div>`;
  }
    
    meta.innerHTML = `
    <div class="action-bar-container shadow-sm">
      <div class="action-bar-top">
        <div class="action-bar-text">
          <div class="now-playing-label">Now Playing</div>
          <h2 class="action-bar-title" title="${title}">${title}</h2>
        </div>
        
        <div class="action-btn-group">
          <div id="watchlistBtnContainer"></div>
          <button class="action-icon-btn" onclick="shareMedia()" title="Share">
            <i class="fa fa-share-nodes"></i>
          </button>
          <button class="action-icon-btn" onclick="handleDownloadClick()" title="Download">
            <i class="fa fa-download"></i>
          </button>
        </div>
      </div>
      
      <div class="action-bar-bottom">
        <p id="movieDescription" class="action-bar-description">${overview}</p>
        ${isLongDesc ? `<button id="descToggleBtn" class="desc-toggle-btn" onclick="toggleOverview()">View More</button>` : ''}
      </div>
    </div>
  
    ${trailerSectionHtml}
  
    <div class="card border-0 rounded-4 shadow-sm mt-4" style="background: var(--surface); border: 1px solid var(--border) !important;">
      <div class="card-body">
        <h6 class="fw-bold mb-3 text-muted" style="letter-spacing: 0.5px; font-size: 0.95rem;"><i class="fa fa-users me-2"></i>TOP CAST</h6>
        <div class="d-flex overflow-auto gap-3 pb-2" style="scrollbar-width: none;">
          ${(c.cast || []).slice(0, 10).map(a => `
            <div onclick="handleCardClick('person', '${a.id}')" style="cursor:pointer; min-width:90px" class="text-center">
              <img src="${a.profile_path ? CAST_IMG + a.profile_path : FALLBACK_PROFILE}" 
                   class="cast-img-large shadow-sm mb-2" 
                   style="width:90px; height:90px; border: 2px solid white;" 
                   onerror="this.src='${FALLBACK_PROFILE}'">
              <div class="fw-bold small text-truncate" style="max-width:90px">${sanitize(a.name)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
    
    renderWatchlistBtn(m.id);
  }
  
  window.toggleOverview = function() {
  const desc = document.getElementById('movieDescription');
  const btn = document.getElementById('descToggleBtn');
  
  if (desc.classList.contains('expanded')) {
    desc.classList.remove('expanded');
    btn.innerText = 'View More';
  } else {
    desc.classList.add('expanded');
    btn.innerText = 'View Less';
  }
  };
  
  function renderWatchlistBtn(id) {
  const container = document.getElementById('watchlistBtnContainer');
  if (!container) return;
  
  const isAdded = getStorage('watchlist').some(x => x.id == id);
  
  container.innerHTML = `
    <button class="action-icon-btn ${isAdded ? 'active-wishlist' : ''}" 
            onclick="handleWatchlistToggle('${id}')" 
            title="${isAdded ? 'Remove from Wishlist' : 'Add to Wishlist'}">
      <i class="fa fa-${isAdded ? 'check' : 'plus'}"></i>
    </button>
  `;
  }
  
  function renderSideContent(m) {
  const status = m.status || 'N/A';
  const production = m.production_companies && m.production_companies.length > 0 
      ? m.production_companies[0].name 
      : 'N/A';
  const dateLabel = m.first_air_date ? 'Aired' : 'Released';
  const dateValue = m.release_date || m.first_air_date || 'N/A';
  const rating = m.vote_average ? m.vote_average.toFixed(1) : 'N/A';
  const posterSrc = m.poster_path ? (POSTER + m.poster_path) : FALLBACK_IMG;
  
  document.getElementById('sideContent').innerHTML = `
    <div class="card border-0 rounded-4 shadow-sm mt-4" style="background: var(--surface); border: 1px solid var(--border) !important;">
      <div class="d-flex flex-row p-3 gap-3 align-items-center">
        
        <div class="position-relative flex-shrink-0" style="width: 120px;">
          <img src="${posterSrc}" class="w-100 rounded-3 shadow-sm" style="object-fit: cover; aspect-ratio: 2/3;" onerror="this.src='${FALLBACK_IMG}'">
          
          <div class="position-absolute top-0 end-0 mt-2 me-2 badge text-white rounded-2 d-flex align-items-center gap-1 shadow-sm" 
               style="background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(4px); font-size: 0.75rem; padding: 4px 6px;">
            <i class="fa fa-star text-warning"></i> <span>${rating}</span>
          </div>
        </div>
        
        <div class="d-flex flex-column justify-content-center min-w-0 flex-grow-1 text-start py-2">
          
          <div class="mb-3">
            <div class="text-muted fw-bold mb-1" style="font-size: 0.8rem; letter-spacing: 0.5px;">Status</div>
            <div class="fw-bold text-truncate" style="font-size: 1.05rem;">${status}</div>
          </div>
          
          <div class="mb-3">
            <div class="text-muted fw-bold mb-1" style="font-size: 0.8rem; letter-spacing: 0.5px;">Production</div>
            <div class="fw-bold text-truncate" style="font-size: 1.05rem;" title="${production}">${production}</div>
          </div>
          
          <div class="mb-0">
            <div class="text-muted fw-bold mb-1" style="font-size: 0.8rem; letter-spacing: 0.5px;">${dateLabel}</div>
            <div class="fw-bold text-truncate" style="font-size: 1.05rem;">${dateValue}</div>
          </div>
          
        </div>
        
      </div>
    </div>
  `;
  }
  
  async function loadDetails(t, i) {
  try {
    const [m, c, v, ext] = await Promise.all([
      fetch(`${BASE}/${t}/${i}?api_key=${KEY}`).then(r => r.json()),
      fetch(`${BASE}/${t}/${i}/credits?api_key=${KEY}`).then(r => r.json()),
      fetch(`${BASE}/${t}/${i}/videos?api_key=${KEY}`).then(r => r.json()),
      fetch(`${BASE}/${t}/${i}/external_ids?api_key=${KEY}`).then(r => r.json())
    ]);
    
    currentImdbId = ext.imdb_id;
    currentPosterPath = m.poster_path;
    currentTitle = m.title || m.name;
    
    const backTitle = document.getElementById('backNavTitle');
    if (backTitle) backTitle.innerText = currentTitle;

  window.availableTrailers = v.results.filter(x => x.site === 'YouTube' && (x.type === 'Trailer' || x.type === 'Teaser'));
  
    const history = getStorage('watchHistory');
    const existing = history.find(x => x.id == i);
    currentS = existing?.season || 1;
    currentE = existing?.episode || 1;
    addToHistory(m.id, t, currentTitle, m.poster_path);

    if(window.autoResumeTrigger) { 
        resumePlayback(window.autoResumeTrigger.season, window.autoResumeTrigger.episode); 
        window.autoResumeTrigger = null; 
    }
  
    if(document.getElementById('upNextContainer')) {
       document.getElementById('upNextContainer').innerHTML = ''; 
    }
  
    if (t === 'tv') {
      document.getElementById('tvSelectors').classList.remove('d-none');
      document.getElementById('tvSelectors').innerHTML = `
        <div class="episodes-container shadow-sm">
            <div class="ep-controls-bar position-relative">
    <select class="season-dropdown shadow-sm rounded-pill" style="z-index: 2;" onchange="switchSeason(this.value)">
        ${m.seasons.filter(s => s.season_number > 0).map(s => `<option value="${s.season_number}" ${s.season_number == currentS ? 'selected' : ''}>Season ${s.season_number}</option>`).join('')}
    </select>
    
    <div class="position-absolute w-100 text-center" style="left: 0; top: 50%; transform: translateY(-50%); z-index: 1; pointer-events: none;">
        <span id="epCount" class="badge rounded-pill bg-light text-dark border px-3 py-2 shadow-sm" style="font-size: 0.85rem; font-weight: 700; letter-spacing: 0.5px; margin-left: 25px;"></span>
    </div>
    
    <div class="d-flex gap-2" style="z-index: 2;">
        <button class="view-toggle-btn shadow-sm ${currentEpView === 'list' ? 'active' : ''}" onclick="toggleEpView('list')" title="List View">
            <i class="fa fa-list"></i>
        </button>
        <button class="view-toggle-btn shadow-sm ${currentEpView === 'thumb' ? 'active' : ''}" onclick="toggleEpView('thumb')" title="Thumbnail View">
            <i class="fa fa-border-all"></i>
        </button>
    </div>
  </div>
            <div id="episodeList" style="max-height: 500px; overflow-y: auto; padding-right: 5px; scrollbar-width: thin;"></div>
        </div>
      `;
      await loadEpisodes(currentS);
    } else {
      document.getElementById('tvSelectors').classList.add('d-none');
      document.getElementById('tvSelectors').innerHTML = '';
    }
    
    buildServerButtons(true);
    renderMetadata(m, c);

  const ambientGlow = document.getElementById('ambient-glow');
  if (ambientGlow) {
    if (m.backdrop_path) {
        ambientGlow.style.backgroundImage = `url('${BACKDROP + m.backdrop_path}')`;
        ambientGlow.style.opacity = '1';
    } else {
        ambientGlow.style.opacity = '0';
    }
  }
    renderSideContent(m);
    
    await loadExtraDetails(t, i);
    updateDownloadLabel();
  } catch (e) {
    document.getElementById('metaContent').innerHTML = `<div class="alert alert-danger rounded-4">Failed to load details</div>`;
    console.error(e);
    toggleLoader(false);
  }
  }
  
  async function loadEpisodes(s) {
  try {
    const r = await fetch(`${BASE}/tv/${currentId}/season/${s}?api_key=${KEY}`);
    const data = await r.json();
    if (!data.episodes?.length) throw new Error();
    
    window.episodesData = data.episodes;
    renderEpisodes(); 
    
    const countBadge = document.getElementById('epCount');
    if(countBadge) {
        countBadge.innerText = `${data.episodes.length} Episodes`;
    }
  
  } catch (e) {
    document.getElementById('episodeList').innerHTML = '<div class="col-12 text-center text-danger">Failed to load episodes</div>';
  }
  }
  
  async function loadExtraDetails(t, i) {
    try {
        const [img, rec] = await Promise.all([
            fetch(`${BASE}/${t}/${i}/images?api_key=${KEY}`).then(r => r.json()),
            fetch(`${BASE}/${t}/${i}/recommendations?api_key=${KEY}`).then(r => r.json())
        ]);
        
        const meta = document.getElementById('metaContent');
        const container = document.createElement('div');
        container.className = "mt-4";
        
        const galleryImages = (img.backdrops || []).slice(0, 8);
        window.currentGalleryImages = galleryImages.map(b => BACKDROP + b.file_path);
        
        container.innerHTML = `
      <div class="card border-0 rounded-4 shadow-sm mb-4" style="background: var(--surface); border: 1px solid var(--border) !important;">
        <div class="card-body">
          <h6 class="fw-bold mb-3 text-muted" style="letter-spacing: 0.5px; font-size: 0.95rem;"><i class="fa fa-music me-2"></i>SOUNDTRACKS & MUSIC</h6>
          <div class="song-list-container" id="soundtrackList">
            </div>
        </div>
      </div>
  
      <div class="card border-0 rounded-4 shadow-sm mb-4" style="background: var(--surface); border: 1px solid var(--border) !important;">
        <div class="card-body p-4">
          <h6 class="fw-bold mb-3 text-muted" style="letter-spacing: 0.5px; font-size: 0.95rem;"><i class="fa fa-image me-2"></i>GALLERY</h6>
          <div class="gallery-scroll">
            ${galleryImages.map((b, index) => `
              <div class="gallery-item">
                <img src="${window.currentGalleryImages[index]}" 
                     class="gallery-img" 
                     loading="lazy" 
                     style="cursor: zoom-in;" 
                     onclick="openLightbox(${index})" 
                     onerror="this.src='${FALLBACK_IMG}'">
              </div>
            `).join('') || '<p class="text-muted mb-0">No images available</p>'}
          </div>
        </div>
      </div>
      
      <h5 class="section-header mb-4 mt-5">MORE LIKE THIS</h5>
      <div class="grid-container">
        ${(rec.results || []).slice(0, 12).map(m => createCard(m)).join('') || '<p class="text-muted">No recommendations found</p>'}
      </div>
    `;
        
        meta.appendChild(container);
        
        if (typeof currentTitle !== 'undefined' && currentTitle) {
            renderSoundtracks(currentTitle);
        }
        
        attachPreviewListeners();
    } catch (e) {
        console.error("Error loading extra details:", e);
    }
  }
  
  // ---------- PERSON PAGE ----------
  async function loadPerson(id) {
    toggleLoader(true);
    try {
    const [p, c] = await Promise.all([
      fetch(`${BASE}/person/${id}?api_key=${KEY}`).then(r => r.json()),
      fetch(`${BASE}/person/${id}/combined_credits?api_key=${KEY}`).then(r => r.json())
    ]);
    
    const backTitle = document.getElementById('backNavTitle');
    if (backTitle) backTitle.innerText = p.name;
    
      const movies = (c.cast || []).filter(x => x.media_type === 'movie').sort((a, b) => b.popularity - a.popularity);
      const tvShows = (c.cast || []).filter(x => x.media_type === 'tv').sort((a, b) => b.popularity - a.popularity);
      const bio = p.biography || 'No biography available.';
      const shortBio = bio.length > 450 ? bio.substring(0, 450) + '...' : bio;
      document.getElementById('person-view').innerHTML = `
        <div class="row mb-5 align-items-start">
          <div class="col-md-3 text-center"><img src="${p.profile_path ? POSTER + p.profile_path : FALLBACK_PROFILE}" class="person-circle-img mb-3 shadow" onerror="this.src='${FALLBACK_PROFILE}'"></div>
          <div class="col-md-9">
            <h1 class="fw-bold">${sanitize(p.name)}</h1>
            <div id="bio-container"><p class="text-muted mb-1" style="white-space: pre-line;" id="bio-text">${sanitize(shortBio)}</p>${bio.length > 450 ? `<a href="javascript:void(0)" class="text-primary fw-bold small text-decoration-none" id="btn-bio" onclick="toggleBio('${encodeURIComponent(bio)}', '${encodeURIComponent(shortBio)}')">View More</a>` : ''}</div>
          </div>
        </div>
        ${movies.length ? `<div class="mb-5"><h5 class="section-header mb-4">MOVIES</h5><div class="grid-container">${movies.slice(0, 18).map(x => createCard(x)).join('')}</div></div>` : ''}
        ${tvShows.length ? `<div class="mb-5"><h5 class="section-header mb-4">TV SHOWS</h5><div class="grid-container">${tvShows.slice(0, 18).map(x => createCard(x)).join('')}</div></div>` : ''}`;
    } catch (e) {
      console.error(e);
    } finally {
      toggleLoader(false);
    }
  }
  
  window.toggleBio = function (full, short) {
    const textEl = document.getElementById('bio-text');
    const btn = document.getElementById('btn-bio');
    if (btn.innerText === 'View Less') {
      textEl.innerText = sanitize(decodeURIComponent(short));
      btn.innerText = 'View More';
    } else {
      textEl.innerText = sanitize(decodeURIComponent(full));
      btn.innerText = 'View Less';
    }
  };
  
  // ---------- STREAM SERVERS ----------
  const SERVERS = [
    { n: "Server 1", m: "https://primeflix.ru/player/movie/", t: "https://primeflix.ru/player/tv/" },
    { n: "Server 2", m: "https://gemma416okl.com/play/", t: "https://watch-v2.autoembed.app/api/hdmovies/embed?type=tv&id=", useImdb: true },
    { n: "Server 3", m: "https://streams.iqsmartgames.com/embed/movie/", t: "https://streams.iqsmartgames.com/embed/tv/", key: "?key=e11a7debaaa4f5d25b671706ffe4d2acb56efbd4" },
    { n: "Server 4", m: "https://flicky.host/embed/movie/?id=", t: "https://flicky.host/embed/tv/?id=" },
    { n: "Server 5", m: "https://zxcstream.xyz/player/movie/", t: "https://zxcstream.xyz/player/tv/" },
    { n: "Server 6", m: "https://www.viduki.net/1/movie/", t: "https://www.viduki.net/1/tv/" },
    { n: "Server 7", m: "https://111movies.net/movie/", t: "https://111movies.net/tv/" },
    { n: "Server 8", m: "https://vidnest.fun/movie/", t: "https://vidnest.fun/tv/" },
    { n: "Server 9", m: "https://screenscape.me/embed?type=movie&tmdb=", t: "https://screenscape.me/embed?type=tv&tmdb=" },
    { n: "Server 10", m: "https://www.vidking.net/embed/movie/", t: "https://www.vidking.net/embed/tv/" },
    { n: "Server 11", m: "https://www.viduki.net/2/movie/", t: "https://www.viduki.net/2/tv/" },
    { n: "Server 12", m: "https://www.viduki.net/3/movie/", t: "https://www.viduki.net/3/tv/" }
  ];
  
  function buildServerButtons(init = false) {
  const playbackMode = localStorage.getItem('playbackMode') || 'without_ads';
    const qualityGrid = document.getElementById('qualityGrid');
    
    if (playbackMode === 'without_ads') {
        renderPremiumServers();
    } else {
        if (qualityGrid) qualityGrid.classList.add('d-none');
        
        const g = document.getElementById('serverGrid');
        g.innerHTML = '';
        
        SERVERS.forEach((s, i) => {
            const b = document.createElement('button');
            b.className = 'server-btn';
            b.innerText = s.n;
            b.onclick = () => {
                activeServerIndex = i;
                setActiveUI('.server-btn', b); 
                initPlayer(currentType === 'movie' ? s.m : s.t);
            };
            g.appendChild(b);
        });
        
        if (init) {
            const savedDefault = currentType === 'movie' ?
                localStorage.getItem('defaultMovieServer') :
                localStorage.getItem('defaultTvServer');
            
            let idx = parseInt(savedDefault);
            if (isNaN(idx) || idx === -1) idx = 0;
            
            const btns = g.querySelectorAll('.server-btn');
            if (btns[idx]) btns[idx].click();
        }
    }
  }
  
  function showNoTrailerMessage() {
    const container = document.getElementById('playerContainer');
    container.innerHTML = `<div class="d-flex align-items-center justify-content-center h-100 w-100 bg-dark text-white flex-column"><i class="fa fa-video-slash fs-1 mb-3 text-muted"></i><h5 class="fw-normal">No Trailer Available</h5><p class="text-muted small">This title does not have a trailer right now.</p></div>`;
  }
  
  function loadTrailer() {
    if (!trailerKey) return showNoTrailerMessage();
    window.isPlayerActive = true;
    
    if (window.mainTrailerPlayer) {
        window.mainTrailerPlayer.api("stop");
    }
    
    document.getElementById('playerContainer').innerHTML = `
      <div id="trailerPlayer" style="width: 100%; height: 100%; border-radius: 16px; overflow: hidden; background: #000;"></div>
    `;
    
    window.mainTrailerPlayer = new Playerjs({
        id: "trailerPlayer",
        file: `https://www.youtube.com/watch?v=${trailerKey}`,
        autoplay: true
    });
  }
  
  function initPlayer(baseUrl) {
  window.isPlayerActive = true;
  const server = SERVERS[activeServerIndex];
  const key = server.key || "";
  const idToUse = (server.useImdb && currentImdbId) ? currentImdbId : currentId;
  const url = currentType === 'movie' ? `${baseUrl}${idToUse}${key}` : `${baseUrl}${idToUse}/${currentS}/${currentE}${key}`;
  
  document.getElementById('playerContainer').innerHTML = `
    <div class="player-wrapper" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
      <div id="iframeLoading" class="iframe-loader">
        <div class="spinner-border text-primary"></div>
        <span>Connecting...</span>
      </div>
      <iframe id="streamIframe" src="${url}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen allow="autoplay; encrypted-media"></iframe>
    </div>
  `;
  
  const iframe = document.getElementById('streamIframe');
  iframe.onload = () => {
    const loader = document.getElementById('iframeLoading');
    if (loader) loader.style.display = 'none';
    iframe.classList.add('loaded');
  };
  iframe.onerror = () => { 
    const loader = document.getElementById('iframeLoading'); 
    if (loader) loader.innerHTML = '<span class="text-danger">⚠️ Failed to load stream. Try another server.</span>'; 
    showToast('Stream failed to load. Please try changing the server.', 'error'); 
  };
  }
  
  function addToHistory(id, t, title, poster) {
    const trackingEnabled = localStorage.getItem('historyEnabled') !== 'false';
    if (!trackingEnabled) return;
    
    let h = getStorage('watchHistory');
    h = h.filter(x => x.id != id);
    h.unshift({ 
      id, 
      type: t, 
      title, 
      poster, 
      season: currentS, 
      episode: currentE,
      timestamp: Date.now() 
    });
    setStorage('watchHistory', h.slice(0, 50));
  }
  
  window.resumePlayback = async function (s, e) {
    const seasonTab = Array.from(document.querySelectorAll('.season-tab')).find(tab => tab.innerText.includes(`Season ${s}`));
    if (seasonTab) seasonTab.click();
    const waitForEp = setInterval(() => {
      const epCard = Array.from(document.querySelectorAll('.ep-card')).find(card => card.innerText.includes(`EP ${e}`) || card.innerText.includes(`EP0${e}`));
      if (epCard) {
        clearInterval(waitForEp);
        epCard.click();
      }
    }, 300);
    setTimeout(() => clearInterval(waitForEp), 10000);
  };
  
  // ---------- WATCHLIST ----------
  function handleWatchlistToggle(id) {
    let l = getStorage('watchlist');
    const idx = l.findIndex(x => x.id == id);
    let added = false;
    if (idx > -1) {
      l.splice(idx, 1);
    } else {
      l.push({ id, type: currentType, title: currentTitle, poster: currentPosterPath });
      added = true;
    }
    setStorage('watchlist', l);
    renderWatchlistBtn(id);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: added ? 'Added to Wishlist' : 'Removed from Wishlist', showConfirmButton: false, timer: 1500 });
  }
  
  function renderListPage(mode) {
    const key = mode === 'wishlist' ? 'watchlist' : 'watchHistory';
    const data = getStorage(key);
    
    document.getElementById('listTitle').innerText = mode.toUpperCase() + ` (${data.length})`;
    document.getElementById('listActionBtn').innerHTML = `<i class="fa fa-trash-can me-2"></i>Clear All`;
    
    document.getElementById('listActionBtn').onclick = () => {
      if (data.length === 0) return;
      Swal.fire({ title: `Clear ${mode}?`, text: "You won't be able to revert this!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#4f46e5', cancelButtonColor: '#ef4444', confirmButtonText: 'Yes, clear it!' }).then((result) => {
        if (result.isConfirmed) {
          localStorage.removeItem(key);
          renderListPage(mode);
          Swal.fire('Deleted!', `Your ${mode} has been cleared.`, 'success');
        }
      });
    };
  
    if (data.length === 0) {
      document.getElementById('listGrid').innerHTML = `<div class="col-12 text-center py-5 text-muted"><i class="fa fa-folder-open fs-1 mb-3"></i><br>Empty list.</div>`;
      return;
    }
  
    const cardsHtml = data.map(item => {
      const title = sanitize(item.title || item.name);
      const img = item.poster ? (POSTER + item.poster) : FALLBACK_IMG;
      
      const typeBadge = item.type === 'tv' 
                        ? (item.season ? `S${item.season}:E${item.episode}` : 'Series') 
                        : 'Movie';
  
      return `
        <div class="movie-card position-relative" onclick="handleCardClick('${item.type}', '${item.id}')">
          <button class="position-absolute shadow-sm"
                  style="top: 8px; right: 8px; z-index: 10; width: 28px; height: 28px; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.6); color: #fff; border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(4px); transition: all 0.2s ease; cursor: pointer;"
                  onmouseover="this.style.background='rgba(239, 68, 68, 0.9)'; this.style.borderColor='transparent';"
                  onmouseout="this.style.background='rgba(0, 0, 0, 0.6)'; this.style.borderColor='rgba(255,255,255,0.2)';"
                  onclick="event.stopPropagation(); removeFromList('${key}', '${item.id}', '${mode}')" title="Remove from ${mode}">
              <i class="fa fa-trash-can" style="font-size: 0.75rem;"></i>
          </button>
          
          <div class="poster-wrapper">
            <img src="${img}" class="poster-img" loading="lazy" onerror="this.src='${FALLBACK_IMG}'; this.onerror=null;">
          </div>
          
          <div class="card-body-content">
            <div class="card-title-text">${title}</div>
            <div class="card-meta-text mt-1">
              <span class="badge bg-primary text-white w-100">${typeBadge}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  
    document.getElementById('listGrid').innerHTML = cardsHtml;
  }
  
  window.removeFromList = function(key, id, mode) {
    let list = getStorage(key);
    list = list.filter(x => x.id != id);
    setStorage(key, list);
    
    renderListPage(mode);
    
    Swal.fire({ 
      toast: true, 
      position: 'top-end', 
      icon: 'success', 
      title: 'Item Removed', 
      showConfirmButton: false, 
      timer: 1500,
      background: 'var(--surface)',
      color: 'var(--text-main)'
    });
  };
  
  // ---------- SEARCH ----------
  async function filterSearch(type, btn) {
    currentSearchFilter = type;
    document.querySelectorAll('.filter-btn').forEach(b => { b.classList.remove('active', 'btn-primary'); b.classList.add('btn-light'); });
    btn.classList.add('active', 'btn-primary');
    btn.classList.remove('btn-light');
    await performSearch(currentSearchQuery);
  }
  
  async function performSearch(q, append = false) {
    if (!append) {
      searchPage = 1;
      currentSearchQuery = q;
      document.getElementById('searchGrid').innerHTML = '';
    }
    toggleLoader(true);
    try {
      const endpoint = currentSearchFilter === 'multi' ? 'multi' : currentSearchFilter;
      const isSafe = localStorage.getItem('safeSearch') !== 'false';
      const adultParam = isSafe ? '&include_adult=false' : '&include_adult=true';
      const r = await fetch(`${BASE}/search/${endpoint}?api_key=${KEY}&query=${encodeURIComponent(q)}&page=${searchPage}${adultParam}`);
      if (!r.ok) throw new Error();
      const data = await r.json();
      
      const loadMoreBtn = document.getElementById('searchLoadMore');
      
      if (data.results && data.results.length > 0) {
        document.getElementById('searchGrid').insertAdjacentHTML('beforeend', data.results.map(i => createCard(i)).join('')); 
        attachPreviewListeners();
        
        if (data.page < data.total_pages) {
            loadMoreBtn.classList.remove('d-none'); 
        } else {
            loadMoreBtn.classList.add('d-none'); 
        }
      } 
      else if (searchPage === 1) {
        document.getElementById('searchGrid').innerHTML = `
          <div class="text-center text-muted" style="grid-column: 1 / -1; min-height: 50vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <div>
              <i class="fa fa-ghost mb-3" style="font-size: 3rem;"></i>
              <h5 class="fw-bold">No results found</h5>
              <p class="small mb-0">We couldn't find anything for "${sanitize(q)}".<br>Try a different keyword.</p>
            </div>
          </div>
        `;
        loadMoreBtn.classList.add('d-none');
      }
    } catch (e) {
      document.getElementById('searchGrid').innerHTML = '<div class="error-msg">Search failed. Try again.</div>';
      showToast('Search failed. Please try again.', 'error'); 
    } finally {
      toggleLoader(false);
    }
  }
  
  function loadMoreSearch() {
    searchPage++;
    performSearch(currentSearchQuery, true);
  }
  
  // ---------- SEARCH SUGGESTIONS ----------
  // NAYA: Updated selectSuggestion for direct search page navigation
  window.selectSuggestion = (mediaType, title) => {
      document.getElementById('searchSuggestions').classList.add('d-none');
      
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
          searchInput.value = title;
          searchInput.blur(); 
      }
      
      currentSearchFilter = mediaType === 'tv' ? 'tv' : (mediaType === 'person' ? 'person' : 'movie');
      document.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.remove('active', 'btn-primary');
          b.classList.add('btn-light');
      });
      const activeBtn = document.getElementById(`filter-${currentSearchFilter}`);
      if(activeBtn) {
          activeBtn.classList.add('active', 'btn-primary');
          activeBtn.classList.remove('btn-light');
      }
      
      window.location.hash = `search/${encodeURIComponent(title)}`;
  };

  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    const q = e.target.value.trim();
    
    if (q.length < 2) {
      document.getElementById('searchSuggestions').classList.add('d-none');
      return;
    }
    
    searchTimer = setTimeout(async () => { 
      try {
        const r = await fetch(`${BASE}/search/multi?api_key=${KEY}&query=${encodeURIComponent(q)}`);
        const data = await r.json();
        
        if (data.results && data.results.length) {
          document.getElementById('searchSuggestions').innerHTML = data.results.slice(0, 6).map(i => {
            const title = sanitize(i.title || i.name);
            const mediaType = i.media_type || 'movie'; 
            
            let iconClass = 'fa-search';
            let badgeHtml = '';
            
            if (mediaType === 'movie') {
                iconClass = 'fa-film';
                badgeHtml = '<span class="badge bg-secondary ms-auto" style="font-size:0.65rem;">Movie</span>';
            } else if (mediaType === 'tv') {
                iconClass = 'fa-tv';
                badgeHtml = '<span class="badge bg-success ms-auto" style="font-size:0.65rem;">Series</span>';
            } else if (mediaType === 'person') {
                iconClass = 'fa-user';
                badgeHtml = '<span class="badge bg-primary ms-auto" style="font-size:0.65rem;">Actor</span>';
            }

            // NAYA: ID ki jagah title pass karna aur single quotes fix karna
            const safeTitle = title.replace(/'/g, "\\'"); 

            return `<button class="list-group-item list-group-item-action border-0 d-flex align-items-center gap-2 py-2" onclick="selectSuggestion('${mediaType}', '${safeTitle}')">
              <i class="fa ${iconClass} text-muted small"></i>
              <span class="small fw-bold text-truncate" style="max-width: 70%;">${title}</span>
              ${badgeHtml}
            </button>`;
          }).join('');
          document.getElementById('searchSuggestions').classList.remove('d-none');
        } else {
            document.getElementById('searchSuggestions').classList.add('d-none');
        }
      } catch (err) { console.error(err); }
    }, 400); 
  });

  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim();
      if (q) {
        clearTimeout(searchTimer); 
        document.getElementById('searchSuggestions').classList.add('d-none');
        
        // NAYA UPDATE: Manual search par hamesha movie filter lagana
        currentSearchFilter = 'movie';

        const newHash = `search/${encodeURIComponent(q)}`;
        if (window.location.hash === '#' + newHash) {
            performSearch(q);
        } else {
            window.location.hash = newHash;
        }
        e.target.blur();
      }
    }
  });

  document.addEventListener('click', e => { 
      if (!e.target.closest('.search-container')) {
          document.getElementById('searchSuggestions')?.classList.add('d-none'); 
      }
  });
  
  // ---------- SHARE ----------
  async function shareMedia(title = currentTitle) {
    const shareData = {
      title: title,
      text: `Stream "${title}" on AS CINEPLEX!`,
      url: window.location.href
    };
  
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard!');
      }
    } catch (err) {
      console.warn("Share failed or cancelled:", err);
      if (err.name !== 'AbortError') {
        showToast('Failed to share media', 'error');
      }
    }
  }
  
  // ---------- DOWNLOAD SERVERS ----------
  const DL_SERVERS = { 1: "https://bunnyddl.termsandconditionshere.workers.dev/", 2: "https://vidvault.ru/" };
  
  function initDownload(serverIndex) {
    const container = document.getElementById('dlIframeContainer');
    const iframe = document.getElementById('dlIframe');
    const baseUrl = DL_SERVERS[serverIndex];
    const typePath = currentType === 'movie' ? 'movie/' : 'tv/';
    let finalUrl = currentType === 'movie' ? `${baseUrl}${typePath}${currentId}` : `${baseUrl}${typePath}${currentId}/${currentS}/${currentE}`;
    
    container.classList.remove('d-none');
    iframe.src = finalUrl;
    Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: currentType === 'tv' ? `Fetching S${currentS}:E${currentE}...` : 'Fetching Movie...', showConfirmButton: false, timer: 2000 });
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  
  // ---------- PREVIEW HOVER LOGIC ----------
  let previewTimer;
  
  function attachPreviewListeners() {
    const cards = document.querySelectorAll('.movie-card');
    
    cards.forEach(card => {
        if (card.dataset.previewAttached) return;
        card.dataset.previewAttached = "true";
  
        const onclickData = card.getAttribute('onclick');
        if (!onclickData) return;
        const match = onclickData.match(/'([^']+)', '([^']+)'/);
        if (!match || match[1] === 'person') return;
  
        const mediaType = match[1];
        const mediaId = match[2];
  
        card.addEventListener('mouseenter', () => {
            clearTimeout(previewTimer);
            previewTimer = setTimeout(() => startPreview(card, mediaType, mediaId), 500);
        });
  
        card.addEventListener('mouseleave', () => {
            clearTimeout(previewTimer);
            stopAllPreviews();
        });
  
        card.addEventListener('touchstart', (e) => {
            clearTimeout(previewTimer);
            previewTimer = setTimeout(() => {
                if (navigator.vibrate) navigator.vibrate(40);
                startPreview(card, mediaType, mediaId);
            }, 700);
        }, { passive: true });
    });
  }
  
  function stopAllPreviews() {
    document.querySelectorAll('.preview-overlay, .preview-loader-container').forEach(el => el.remove());
  }
  
  async function startPreview(card, type, id) {
    if (localStorage.getItem('hoverPreviews') === 'false') return;
  
    stopAllPreviews();
    const wrapper = card.querySelector('.poster-wrapper');
    
    const loader = document.createElement('div');
    loader.className = 'preview-loader-container';
    loader.innerHTML = `
        <div class="spinner-border text-primary" role="status" style="width: 1.5rem; height: 1.5rem;">
            <span class="visually-hidden">Loading...</span>
        </div>`;
    wrapper.appendChild(loader);
  
    try {
        const res = await fetch(`${BASE}/${type}/${id}/videos?api_key=${KEY}`);
        const data = await res.json();
        const video = data.results.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
  
        if (!card.matches(':hover') && !window.matchMedia("(max-width: 768px)").matches) {
            stopAllPreviews();
            return;
        }
  
        if (video) {
            const overlay = document.createElement('div');
            overlay.className = 'preview-overlay';
            overlay.innerHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${video.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${video.key}&modestbranding=1&playsinline=1&rel=0" 
                    frameborder="0" 
                    allow="autoplay; encrypted-media">
                </iframe>`;
            
            wrapper.appendChild(overlay);
        }
    } catch (err) {
        console.error("Preview error:", err);
    } finally {
        loader.remove();
    }
  }
  
  document.addEventListener('touchstart', (e) => {
    if (!e.target.closest('.movie-card')) stopAllPreviews();
  });
   
  let currentChannelGroup = 'All';
  
  function parseM3U(data) {
  const lines = data.split('\n');
  const channels = [];
  let currentChannel = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.split(',').pop();
      currentChannel.name = nameMatch ? nameMatch.trim() : 'Unknown Channel';
  
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      currentChannel.logo = logoMatch ? logoMatch[1] : FALLBACK_IMG;
  
      const groupMatch = line.match(/group-title="([^"]+)"/);
      currentChannel.group = groupMatch ? groupMatch[1] : 'Others';
      
    } else if (line !== '' && !line.startsWith('#')) {
      currentChannel.url = line;
      channels.push(currentChannel);
      currentChannel = {}; 
    }
  }
  return channels;
  }
  
  const DEFAULT_PLAYLISTS = [
    { name: "🇦🇫 Afghanistan", url: "https://iptv-org.github.io/iptv/countries/af.m3u" },
    { name: "🇮🇳 India", url: "https://iptv-org.github.io/iptv/countries/in.m3u" },
    { name: "🇺🇸 United States", url: "https://iptv-org.github.io/iptv/countries/us.m3u" },
    { name: "🇬🇧 United Kingdom", url: "https://iptv-org.github.io/iptv/countries/uk.m3u" }
  ];
  
  async function loadLiveTv() {
    showPlaylistsView();
    renderPlaylists();
  }
  
  function filterPlaylists(query) {
    renderPlaylists(query.toLowerCase());
  }
  
  function renderPlaylists(query = '') {
    const container = document.getElementById('playlistsContainer');
    const customPlaylists = JSON.parse(localStorage.getItem('customM3U') || '[]');
    
    const filteredCustom = customPlaylists.filter(p => p.name.toLowerCase().includes(query));
    const filteredDefault = DEFAULT_PLAYLISTS.filter(p => p.name.toLowerCase().includes(query));
    
    let html = '';
    
  if (filteredCustom.length > 0) {
    html += `<div class="list-group-item small fw-bold text-uppercase" style="background: var(--bg-light); color: var(--text-muted); border-color: var(--border); border-top-left-radius: 16px; border-top-right-radius: 16px;">Your Custom Playlists</div>`;
    
    filteredCustom.forEach((p) => {
        const originalIndex = customPlaylists.findIndex(orig => orig.url === p.url && orig.name === p.name);
        
        html += `
            <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" style="background: var(--surface); color: var(--text-main); border-color: var(--border);">
              <div onclick="fetchAndShowChannels('${p.url}', '${sanitize(p.name)}')" class="flex-grow-1 py-2 text-truncate me-3" style="cursor: pointer; min-width: 0;">
                  <i class="fa fa-list me-3 text-primary"></i> <span class="fw-bold">${sanitize(p.name)}</span>
              </div>
              <button class="btn btn-sm btn-outline-danger rounded-circle flex-shrink-0" style="width:32px; height:32px; padding:0;" onclick="deleteCustomPlaylist(${originalIndex})"><i class="fa fa-trash"></i></button>
            </div>`;
    });
  }
  
  if (filteredDefault.length > 0) {
    const roundedClass = (filteredCustom.length === 0) ? 'border-top-left-radius: 16px; border-top-right-radius: 16px;' : '';
    
    html += `<div class="list-group-item small fw-bold text-uppercase" style="background: var(--bg-light); color: var(--text-muted); border-color: var(--border); ${roundedClass}">Default GitHub Playlists (iptv-org)</div>`;
    
    filteredDefault.forEach(p => {
        html += `
            <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" style="cursor: pointer; background: var(--surface); color: var(--text-main); border-color: var(--border);" onclick="fetchAndShowChannels('${p.url}', '${p.name}')">
              <div class="py-2 text-truncate" style="min-width: 0; width: 100%;">
                  <i class="fa fa-globe me-3 text-success"></i> <span class="fw-bold">${p.name}</span>
              </div>
            </div>`;
    });
  }
    
    if (filteredCustom.length === 0 && filteredDefault.length === 0) {
        html = `
        <div class="list-group-item text-center py-5" style="background: var(--surface); border-color: var(--border); border-radius: 16px;">
          <i class="fa fa-ghost text-muted mb-3" style="font-size: 3rem;"></i>
          <h6 class="fw-bold text-main">No playlists found</h6>
          <p class="small text-muted mb-0">We couldn't find any country or playlist matching "${sanitize(query)}"</p>
        </div>`;
    }
    
    container.innerHTML = html;
  }
  
  function saveCustomPlaylist() {
    const nameInput = document.getElementById('m3uName');
    const urlInput = document.getElementById('m3uUrl');
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    
    if (!name || !url) {
        showToast("Please enter both Name and URL", "error");
        return;
    }
    
    const customPlaylists = JSON.parse(localStorage.getItem('customM3U') || '[]');
    customPlaylists.push({ name, url });
    localStorage.setItem('customM3U', JSON.stringify(customPlaylists));
    
    nameInput.value = '';
    urlInput.value = '';
    showToast("Playlist added successfully!");
    renderPlaylists();
  }
  
  function deleteCustomPlaylist(index) {
    const customPlaylists = JSON.parse(localStorage.getItem('customM3U') || '[]');
    customPlaylists.splice(index, 1);
    localStorage.setItem('customM3U', JSON.stringify(customPlaylists));
    showToast("Playlist removed");
    renderPlaylists();
  }
  
  function showPlaylistsView() {
    document.getElementById('playlistSelectionView').style.display = 'block';
    document.getElementById('channelsView').style.display = 'none';
    document.getElementById('channelSearch').value = ''; 
  }
  
  async function fetchAndShowChannels(url, name) {
    toggleLoader(true);
    document.getElementById('playlistSelectionView').style.display = 'none';
    document.getElementById('channelsView').style.display = 'block';
    document.getElementById('currentPlaylistName').innerText = name.toUpperCase();
    
    const grid = document.getElementById('livetvGrid');
    grid.innerHTML = '';
    document.getElementById('channelCategories').innerHTML = ''; 
    
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch playlist");
        const text = await res.text();
        
        allChannels = parseM3U(text);
        
        renderChannelCategories();
        renderChannels(allChannels.slice(0, 100)); 
    } catch (e) {
        grid.innerHTML = '<div class="col-12 text-center text-danger mt-5"><i class="fa fa-warning fs-1 mb-3"></i><br>Failed to load playlist. Ensure the URL is correct and allows CORS.</div>';
        console.error("IPTV Fetch Error:", e);
        Swal.fire({
            icon: 'error',
            title: 'Live TV Error',
            text: 'Failed to load the Live TV playlist. The URL might be broken or blocked by browser CORS security.',
            confirmButtonColor: '#4f46e5',
            background: 'var(--surface)',
            color: 'var(--text-main)'
        });
        showPlaylistsView(); 
    } finally {
        toggleLoader(false);
    }
  }
  
  window.allSportsMatches = [];
  
  async function loadSports() {
    toggleLoader(true);
    const container = document.getElementById('sportsGrid');
    container.innerHTML = '';
    
    try {
      const targetApi = 'https://streamed.pk/api/matches/all';
      
      const proxies = [
          `https://api.allorigins.win/raw?url=${encodeURIComponent(targetApi)}`,
          `https://corsproxy.io/?${encodeURIComponent(targetApi)}`
      ];
      
      let data = null;
      let fetchSuccess = false;
  
      for (let proxy of proxies) {
          try {
              const res = await fetch(proxy);
              if (res.ok) {
                  data = await res.json();
                  fetchSuccess = true;
                  break; 
              }
          } catch (e) {
              console.log("Proxy attempt failed, trying next...");
          }
      }
      
      if (!fetchSuccess || !data) throw new Error("CORS blocked all requests or data is empty");
      
      window.allSportsMatches = Array.isArray(data) ? data : (data.data || []);
      
      populateSportsDropdown();
      renderSports('all'); 
      
    } catch (e) {
      console.warn("Fetch Error:", e.message);
      container.innerHTML = '<div class="col-12 text-center py-5 text-danger"><i class="fa fa-triangle-exclamation fs-1 mb-3"></i><br>Failed to load sports matches.</div>';
    } finally {
      toggleLoader(false);
    }
  }
  
  window.filterSports = function(category) {
      renderSports(category);
  };
  
  function renderSports(filter) {
      const container = document.getElementById('sportsGrid');
      let filteredMatches = window.allSportsMatches;
  
      if (filter === 'live') {
          filteredMatches = window.allSportsMatches.filter(m => 
              m.live === true || m.live === 1 || (typeof m.status === 'string' && m.status.toLowerCase() === 'live')
          );
      } else if (filter !== 'all') {
          filteredMatches = window.allSportsMatches.filter(m => (m.category || m.sport) === filter);
      }
  
      if (filteredMatches.length === 0) {
          container.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="fa fa-trophy fs-1 mb-3"></i><br>No matches available for this category.</div>';
          return;
      }
  
      let html = '';
      
      const fixImage = (imgUrl) => {
          if (!imgUrl || typeof imgUrl !== 'string' || imgUrl.trim() === '') return FALLBACK_IMG;
          if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://') || imgUrl.startsWith('data:')) return imgUrl; 
          return 'https://streamed.pk/api/images/badge/' + imgUrl + '.webp';
      };
  
      filteredMatches.forEach(m => {
          const category = m.category || m.sport || m.tournament || 'Live Event';
          const title = m.title || m.name || m.event || 'Live Match';
          
          let formattedTime = 'Scheduled';
          const rawTime = m.time || m.date;
          if (rawTime) {
              if (!isNaN(rawTime) && rawTime.toString().length >= 10) {
                  const timestamp = rawTime.toString().length === 10 ? rawTime * 1000 : parseInt(rawTime);
                  const dateObj = new Date(timestamp);
                  
                  formattedTime = dateObj.toLocaleString('en-US', {
                      day: '2-digit', 
                      month: 'short', 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      hour12: true
                  });
              } else {
                  formattedTime = rawTime; 
              }
          }
  
          const isLive = m.live === true || m.live === 1 || (typeof m.status === 'string' && m.status.toLowerCase() === 'live');
          const matchId = m.id || m.slug || m.url || '#';
  
          let t1 = m.teams?.home || m.home || {};
          let t2 = m.teams?.away || m.away || {};
          if (typeof t1 === 'string') t1 = { name: t1 };
          if (typeof t2 === 'string') t2 = { name: t2 };
  
          const homeName = t1.name || t1.title || m.home_team || 'Team 1';
          const awayName = t2.name || t2.title || m.away_team || 'Team 2';
          
          const homeLogo = fixImage(t1.badge || m.home_badge || t1.logo || m.home_logo);
          const awayLogo = fixImage(t2.badge || m.away_badge || t2.logo || m.away_logo);
          
          const liveBadgeHtml = isLive ? `<div class="live-badge shadow-sm" style="top:-8px; right:-8px;">LIVE</div>` : '';
  
          html += `
          <div class="col-12 col-md-6 col-lg-4">
            <div class="sports-card position-relative" onclick="handleSportsClick('${encodeURIComponent(matchId)}')">
               ${liveBadgeHtml}
               <div class="sports-badge">${sanitize(category)}</div>
               <div class="sports-teams-row">
                   <div class="team-col">
                       <img src="${homeLogo}" class="team-logo" onerror="this.src='${FALLBACK_IMG}'">
                       <div class="team-name">${sanitize(homeName)}</div>
                   </div>
                   <div class="vs-col">
                       <div class="vs-text">VS</div>
                       <div class="match-time" style="font-size:0.65rem;">${isLive ? '<span class="text-danger fw-bold">Live Now</span>' : sanitize(formattedTime)}</div>
                   </div>
                   <div class="team-col">
                       <img src="${awayLogo}" class="team-logo" onerror="this.src='${FALLBACK_IMG}'">
                       <div class="team-name">${sanitize(awayName)}</div>
                   </div>
               </div>
               <div class="match-title" title="${sanitize(title)}">${sanitize(title)}</div>
            </div>
          </div>
          `;
      });
      
      container.innerHTML = html;
  }
  
  function populateSportsDropdown() {
      const select = document.getElementById('sportsCategorySelect');
      select.innerHTML = `<option value="all">All Sports</option>`;
      
      const categories = new Set();
      window.allSportsMatches.forEach(m => {
          const cat = m.category || m.sport || 'Other';
          categories.add(cat);
      });
  
      categories.forEach(cat => {
          if (cat && cat !== 'Other') {
              const option = document.createElement('option');
              option.value = cat;
              option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1); 
              select.appendChild(option);
          }
      });
  }
  
  window.handleSportsClick = function(encodedMatchId) {
      const matchId = decodeURIComponent(encodedMatchId);
      const match = window.allSportsMatches.find(m => m.id === matchId || m.slug === matchId);
  
      if (!match || !match.sources || match.sources.length === 0) {
          showToast("No streaming servers available for this match.", "error");
          return;
      }
  
      document.getElementById('sportsModalTitle').innerText = match.title || match.name || 'Live Match';
  
      document.getElementById('sportsIframeContainer').innerHTML = `
        <div id="streamPlaceholder" class="d-flex flex-column justify-content-center align-items-center position-absolute w-100 h-100 px-3 text-center" style="z-index: 3; background: #0b0f19;">
            <i class="fa fa-play-circle text-primary mb-2" style="font-size: 2.5rem; opacity: 0.8;"></i>
            <span class="fw-semibold small text-secondary">Select a server below to start streaming</span>
        </div>
      `;
  
      const sourceContainer = document.getElementById('sportsSources');
      sourceContainer.innerHTML = '';
      
      match.sources.forEach((src, index) => {
          const btn = document.createElement('button');
          btn.className = 'sports-server-btn';
          btn.id = `srv-btn-${index}`;
          btn.innerHTML = `<i class="fa fa-server" style="font-size: 0.7rem;"></i> Server ${index + 1}`;
          
          btn.onclick = () => {
              document.querySelectorAll('.sports-server-btn').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              loadSportsStream(src.source, src.id);
          };
          
          sourceContainer.appendChild(btn);
      });
  
      const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('sportsModal'));
      modal.show();
  };
  
  window.loadSportsStream = function(sourceName, sourceId) {
      const container = document.getElementById('sportsIframeContainer');
      const streamUrl = `https://embedsports.top/embed/${sourceName}/${sourceId}/1`;
      
      container.innerHTML = `
        <div class="d-flex justify-content-center align-items-center position-absolute w-100 h-100 bg-black" style="z-index: 1;">
            <div class="spinner-border spinner-border-sm text-primary"></div>
        </div>
        <iframe src="${streamUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; z-index: 2;" allowfullscreen allow="autoplay; encrypted-media" onload="this.previousElementSibling.remove()"></iframe>
      `;
  };
  
  const sportsModalEl = document.getElementById('sportsModal');
  if (sportsModalEl) {
      sportsModalEl.addEventListener('hidden.bs.modal', () => {
          document.getElementById('sportsIframeContainer').innerHTML = '';
      });
  }
  
  function renderChannelCategories() {
  const catContainer = document.getElementById('channelCategories');
  const groups = ['All', ...new Set(allChannels.map(c => c.group).filter(g => g && g !== 'Others'))];
  
  let html = `<button class="btn ${currentChannelGroup === 'Favorites' ? 'btn-primary' : 'btn-light'} rounded-pill px-3 py-1 fw-bold cat-btn border shadow-sm me-1" style="white-space: nowrap; font-size: 0.85rem;" onclick="filterChannelGroup('Favorites', this)">
      <i class="fa fa-star text-warning me-1"></i>Favorites
    </button>`;
  
  html += groups.slice(0, 15).map(g => `
    <button class="btn ${g === 'All' && currentChannelGroup !== 'Favorites' ? 'btn-primary' : 'btn-light'} rounded-pill px-3 py-1 fw-bold cat-btn border shadow-sm" style="white-space: nowrap; font-size: 0.85rem;" onclick="filterChannelGroup('${sanitize(g)}', this)">
      ${sanitize(g)}
    </button>
  `).join('');
  
  catContainer.innerHTML = html;
  }
  
  window.filterChannelGroup = function(group, btn) {
  document.querySelectorAll('.cat-btn').forEach(b => {
    b.classList.remove('btn-primary');
    b.classList.add('btn-light');
  });
  btn.classList.remove('btn-light');
  btn.classList.add('btn-primary');
  
  currentChannelGroup = group;
  document.getElementById('channelSearch').value = ''; 
  
  let filtered = allChannels;
  if (group === 'Favorites') {
    const favs = JSON.parse(localStorage.getItem('favChannels') || '[]');
    filtered = allChannels.filter(c => favs.includes(c.url));
  } else if (group !== 'All') {
    filtered = allChannels.filter(c => c.group === group);
  }
  renderChannels(filtered.slice(0, 100));
  };
  
  function filterChannels(q) {
  const lowerQ = q ? q.toLowerCase() : '';
  let filtered = allChannels;
  
  if (currentChannelGroup !== 'All') {
    filtered = filtered.filter(c => c.group === currentChannelGroup);
  }
  
  if (lowerQ) {
    filtered = filtered.filter(c => c.name.toLowerCase().includes(lowerQ));
  }
  
  renderChannels(filtered.slice(0, 100));
  }
  
  function renderChannels(channels) {
  const grid = document.getElementById('livetvGrid');
  if (!channels.length) {
      grid.innerHTML = '<div class="col-12 text-center py-5 text-muted">No channels found.</div>';
      return;
  }
  
  const favs = JSON.parse(localStorage.getItem('favChannels') || '[]');
  
  grid.innerHTML = channels.map(c => {
    const isFav = favs.includes(c.url);
    return `
    <div class="channel-card position-relative">
      <button class="btn position-absolute shadow-sm"
              style="top: 8px; left: 8px; z-index: 10; background: ${isFav ? 'var(--primary)' : 'rgba(0,0,0,0.4)'}; color: ${isFav ? 'white' : '#ccc'}; border-radius: 50%; width: 28px; height: 28px; padding: 0;"
              onclick="event.stopPropagation(); toggleFavChannel('${c.url}')" title="Add to Favorites">
          <i class="fa fa-star" style="font-size: 0.8rem;"></i>
      </button>
  
      <div onclick="playLiveTv('${c.url}', '${sanitize(c.name).replace(/'/g, "\\'")}')">
        <div class="channel-logo-wrapper">
          <span class="live-badge">LIVE</span>
          <img src="${c.logo}" loading="lazy" style="height: 100px; width: 100px; object-fit:contain;" onerror="this.src='${FALLBACK_IMG}'">
        </div>
        <div class="card-body-content text-center py-2 bg-transparent">
          <div class="card-title-text small fw-bold text-truncate">${sanitize(c.name)}</div>
          <div class="text-muted text-truncate mt-1" style="font-size: 0.65rem; text-transform: uppercase;">${sanitize(c.group)}</div>
        </div>
      </div>
    </div>
  `}).join('');
  }
  
  window.playLiveTv = function(url, name) {
    currentType = 'livetv';
    document.getElementById('livetvTitle').innerText = name || 'Live Channel';
    document.getElementById('liveTvError').classList.add('d-none');
    
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('livetvModal'));
    modal.show();
    
    const container = document.getElementById('liveTvPlayerContainer');
    const autoPlayTV = localStorage.getItem('liveTvAutoplay') !== 'false';
    
    container.innerHTML = `<div id="live-player-js" style="width: 100%; height: 100%;"></div>`;
    
    window.liveTvPlayer = new Playerjs({
        id: "live-player-js",
        file: url,
        autoplay: autoPlayTV
    });
  };
  
  window.stopLiveTv = async function() {
    if (window.liveTvPlayer) {
        window.liveTvPlayer.api("stop");
        window.liveTvPlayer = null;
    }
    const container = document.getElementById('liveTvPlayerContainer');
    if (container) container.innerHTML = ''; 
  };
  
  const liveTvModalEl = document.getElementById('livetvModal');
  if (liveTvModalEl) {
    liveTvModalEl.addEventListener('hidden.bs.modal', stopLiveTv);
  }
  
  function initSettingsUI() {
    const movieSelect = document.getElementById('defaultMovieServer');
    const tvSelect = document.getElementById('defaultTvServer');
    const playbackSelect = document.getElementById('playbackModeSelect');
    
    const themeSelect = document.getElementById('themeSelect');
    const previewToggle = document.getElementById('previewToggle');
    const historyToggle = document.getElementById('historyToggle');
    const historyCountEl = document.getElementById('historyCount');
    const safeSearchToggle = document.getElementById('safeSearchToggle');
    const regionSelect = document.getElementById('regionSelect');
    const liveTvAutoplayToggle = document.getElementById('liveTvAutoplayToggle');
    
    const bingeModeToggle = document.getElementById('bingeModeToggle');
    const performanceToggle = document.getElementById('performanceToggle');
    const languageSelect = document.getElementById('languageSelect');
  
    const serverOptions = SERVERS.map((s, i) => `<option value="${i}">${s.n}</option>`).join('');
    
    if (movieSelect) {
      movieSelect.innerHTML = `<option value="-1">🎬 Trailer (Auto-load)</option>` + serverOptions;
      movieSelect.value = localStorage.getItem('defaultMovieServer') || "-1";
    }
    
    if (tvSelect) {
      tvSelect.innerHTML = serverOptions;
      tvSelect.value = localStorage.getItem('defaultTvServer') || "0";
    }
  
    if (playbackSelect) playbackSelect.value = localStorage.getItem('playbackMode') || 'without_ads';
    if (themeSelect) themeSelect.value = localStorage.getItem('appTheme') || 'system';
    if (regionSelect) regionSelect.value = localStorage.getItem('region') || 'IN';
    if (languageSelect) languageSelect.value = localStorage.getItem('contentLanguage') || 'en-US';
  
    if (previewToggle) previewToggle.checked = localStorage.getItem('hoverPreviews') !== 'false';
    if (historyToggle) historyToggle.checked = localStorage.getItem('historyEnabled') !== 'false';
    if (safeSearchToggle) safeSearchToggle.checked = localStorage.getItem('safeSearch') !== 'false';
    if (liveTvAutoplayToggle) liveTvAutoplayToggle.checked = localStorage.getItem('liveTvAutoplay') !== 'false';
    if (bingeModeToggle) bingeModeToggle.checked = localStorage.getItem('bingeMode') !== 'false';
    if (performanceToggle) performanceToggle.checked = localStorage.getItem('performanceMode') !== 'false';
  
    if (historyCountEl) {
      const history = JSON.parse(localStorage.getItem('watchHistory') || '[]');
      const count = history.length;
      historyCountEl.innerText = `${count} title${count === 1 ? '' : 's'} recorded`;
    }
  }
  
  window.clearLocalData = function(key) {
    let displayName = "Data";
    if (key === 'watchlist') displayName = "Wishlist";
    if (key === 'watchHistory') displayName = "History";
    if (key === 'customM3U') displayName = "Custom IPTV Playlists";
    
    Swal.fire({
      title: 'Are you sure?',
      text: `Your ${displayName} will be permanently deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, clear it'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem(key);
        
        if (key === 'watchlist' || key === 'watchHistory') {
            const h = window.location.hash;
            if (h === '#wishlist' || h === '#history') {
                renderListPage(h.slice(1));
            }
            if (key === 'watchHistory' && document.getElementById('historyCount')) {
                document.getElementById('historyCount').innerText = '0 titles recorded';
            }
        } 
        else if (key === 'customM3U') {
            if (typeof renderPlaylists === 'function') {
                renderPlaylists();
            }
        }
        
        Swal.fire('Cleared!', `${displayName} has been cleared.`, 'success');
      }
    });
  };
  
  function updateDefaultServer(type, index) {
    localStorage.setItem(type === 'movie' ? 'defaultMovieServer' : 'defaultTvServer', index);
    showToast('Preference Saved');
  }
  
function handlePlaybackModeChange(selectElement) {
    if (selectElement.value === 'without_ads') {
        Swal.fire({
            icon: 'info',
            title: 'Under Maintenance 🛠️',
            text: 'Without Ads (Premium) servers are currently under maintenance. Please use "With Ads" servers for now.',
            background: 'var(--surface)',
            color: 'var(--text-main)',
            confirmButtonColor: '#4f46e5'
        });
        
        selectElement.value = 'with_ads';
        localStorage.setItem('playbackMode', 'with_ads');
    } else {
        updatePref('playbackMode', selectElement.value);
    }
}
  
  function updatePref(key, val) {
    localStorage.setItem(key, val);
    
    const friendlyNames = {
      'hoverPreviews': 'Hover Previews',
      'historyEnabled': 'History Tracking',
      'safeSearch': 'Safe Search (Family Mode)',
      'liveTvAutoplay': 'Live TV Autoplay',
      'region': 'Discover Region'
    };
    
    const settingName = friendlyNames[key] || 'Setting';
    
    let statusMessage = '';
    if (val === true || val === 'true') {
      statusMessage = 'Enabled';
    } else if (val === false || val === 'false') {
      statusMessage = 'Disabled';
    } else {
      statusMessage = 'Updated';
    }
    
    showToast(`${settingName} ${statusMessage}`, 'success');
  }
  
  function showToast(msg, iconType = 'success') {
  Swal.fire({ 
    toast: true, 
    position: 'top-end', 
    icon: iconType, 
    title: msg, 
    showConfirmButton: false, 
    timer: 2000,
    background: 'var(--surface)',
    color: 'var(--text-main)'
  });
  }
  
  // ---------- THEME HANDLING ----------
  function changeTheme(theme) {
    let isDark = false;
    
    if (theme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = theme === 'dark';
    }
    
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('appTheme', theme);
    
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) themeSelect.value = theme;
    
    const displayMsg = theme === 'system' ? 'System theme' : `${theme.charAt(0).toUpperCase() + theme.slice(1)} mode`;
    showToast(`${displayMsg} active`);
  }
  
  function applySavedTheme() {
    const savedTheme = localStorage.getItem('appTheme') || 'system'; 
    let isDark = false;
    
    if (savedTheme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = savedTheme === 'dark';
    }
  
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const currentThemePref = localStorage.getItem('appTheme') || 'system';
    if (currentThemePref === 'system') {
      document.body.classList.toggle('dark-mode', e.matches);
    }
  });
  
  async function renderSoundtracks(movieTitle) {
  const container = document.getElementById('soundtrackList');
  if (!container) return;
  
  container.innerHTML = `<div class="p-4 text-center text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div> Fetching official album...</div>`;
  
  try {
    const searchUrl = `https://jiosavan-ytify.vercel.app/api/search/albums?query=${encodeURIComponent(movieTitle)}`;
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) throw new Error("Album search failed");
    
    const searchData = await searchResponse.json();
    const albums = searchData.data?.results || searchData.results || [];
  
    if (albums.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-muted">No official album found for this title.</div>`;
      return;
    }
  
    const albumId = albums[0].id;
    let mainAlbumImg = FALLBACK_IMG;
    const albImgs = albums[0].image;
    if (Array.isArray(albImgs) && albImgs.length > 0) {
        mainAlbumImg = albImgs[albImgs.length - 1].link || albImgs[albImgs.length - 1].url || FALLBACK_IMG;
    }
  
    const albumUrl = `https://jiosavan-ytify.vercel.app/api/albums?id=${albumId}`;
    const albumResponse = await fetch(albumUrl);
    if (!albumResponse.ok) throw new Error("Album details fetch failed");
    
    const albumData = await albumResponse.json();
    const songs = albumData.data?.songs || albumData.songs || [];
  
    if (songs.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-muted">No songs found in this album.</div>`;
      return;
    }
  
    container.innerHTML = songs.map((song, index) => {
      const songTitle = sanitize(song.name || song.title);
      
      let artist = "Unknown Artist";
      if (song.primaryArtists) {
        artist = sanitize(song.primaryArtists);
      } else if (song.artists && song.artists.primary) {
        artist = sanitize(song.artists.primary.map(a => a.name).join(', '));
      }
  
      let thumb = mainAlbumImg;
      if (song.image && Array.isArray(song.image) && song.image.length > 0) {
        thumb = song.image[song.image.length - 1].link || song.image[song.image.length - 1].url || mainAlbumImg;
      } else if (typeof song.image === 'string' && song.image.trim() !== '') {
        thumb = song.image;
      }
  
      const songId = song.id; 
  
      return `
        <div class="song-item">
          <div class="song-details">
            <div class="rounded-3 overflow-hidden d-flex align-items-center justify-content-center shadow-sm" style="min-width: 45px; width: 45px; height: 45px; background: #000;">
              <img src="${thumb}" style="width:100%; height:100%; object-fit:cover;" alt="album art" onerror="this.src='${FALLBACK_IMG}'">
            </div>
            <div class="song-text-wrapper">
              <div class="song-title" title="${songTitle}">${songTitle}</div>
              <div class="song-artist" title="${artist}">${artist}</div>
            </div>
          </div>
          
          <div class="song-actions d-flex align-items-center">
            <button class="btn-icon" style="background: rgba(79, 70, 229, 0.1); color: var(--primary); min-width: 32px;" title="Play on AS Music" onclick="window.open('https://asbros.github.io/streamify#play?id=${songId}', '_blank')">
              <i class="fa fa-play ms-1"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  
  } catch (error) {
    console.error("Album Fetch Error:", error);
    container.innerHTML = `<div class="p-4 text-center text-danger small">Failed to load the album. API might be down or no exact match was found.</div>`;
  }
  }
  
  // --- HERO CAROUSEL ENGINE ---
  let heroVideoTimer;
  
  function renderHeroCarousel(items, container) {
  const carouselHtml = `
    <div id="heroCarousel" class="carousel slide hero-carousel" data-bs-ride="carousel" data-bs-interval="8000">
      <div class="carousel-indicators">
        ${items.map((_, i) => `<button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="${i}" class="${i===0?'active':''}"></button>`).join('')}
      </div>
      <div class="carousel-inner">
        ${items.map((m, i) => `
          <div class="carousel-item ${i === 0 ? 'active' : ''}" data-type="${m.media_type || 'movie'}" data-id="${m.id}">
            <div class="hero-slide-bg" style="background-image: url('${BACKDROP + m.backdrop_path}');"></div>
            <div class="hero-video-container" id="hero-vid-${m.id}"></div>
            <div class="hero-overlay"></div>
            <div class="hero-content">
              <div class="badge bg-primary mb-3 px-3 py-1 rounded-pill fw-bold letter-spacing-1">#${i+1} Trending</div>
              <h1 class="hero-title mb-4">${sanitize(m.title || m.name)}</h1>
              
              <div class="d-flex gap-3">
                <button class="btn btn-light rounded-pill px-4 py-2 fw-bold shadow text-dark" onclick="handleCardClick('${m.media_type || 'movie'}', '${m.id}')">
                  <i class="fa fa-play me-2"></i> Play
                </button>
                <button class="btn btn-outline-light border-2 rounded-pill px-4 py-2 fw-bold text-white" onclick="handleCardClick('${m.media_type || 'movie'}', '${m.id}')">
                  <i class="fa fa-circle-info me-2"></i> More Info
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <button class="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev" style="z-index: 5; width: 5%;">
        <span class="carousel-control-prev-icon"></span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next" style="z-index: 5; width: 5%;">
        <span class="carousel-control-next-icon"></span>
      </button>
    </div>
  `;
  
  container.insertAdjacentHTML('afterbegin', carouselHtml);
  
  const myCarousel = document.getElementById('heroCarousel');
  const firstItem = myCarousel.querySelector('.carousel-item.active');
  triggerHeroVideo(firstItem);
  
  myCarousel.addEventListener('slide.bs.carousel', function () {
      clearTimeout(heroVideoTimer);
      document.querySelectorAll('.hero-video-container').forEach(c => {
          c.innerHTML = '';
          c.style.opacity = '0';
      });
  });
  
  myCarousel.addEventListener('slid.bs.carousel', function (e) {
      triggerHeroVideo(e.relatedTarget);
  });
  }
  
  function triggerHeroVideo(slideEl) {
  clearTimeout(heroVideoTimer);
  
  heroVideoTimer = setTimeout(async () => {
      const type = slideEl.getAttribute('data-type');
      const id = slideEl.getAttribute('data-id');
      const vidContainer = slideEl.querySelector('.hero-video-container');
      
      try {
          const r = await fetch(`${BASE}/${type}/${id}/videos?api_key=${KEY}`);
          const data = await r.json();
          const video = data.results.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
          
          if (video) {
              vidContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${video.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${video.key}&modestbranding=1&playsinline=1&rel=0&showinfo=0" allow="autoplay; encrypted-media"></iframe>`;
              
              setTimeout(() => {
                 if(slideEl.classList.contains('active')) {
                     vidContainer.style.opacity = '1';
                 }
              }, 1200);
          }
      } catch(e) { console.error("Hero video failed", e); }
  }, 2000); 
  }
  
  window.toggleFavChannel = function(url) {
    let favs = JSON.parse(localStorage.getItem('favChannels') || '[]');
    if(favs.includes(url)) {
        favs = favs.filter(x => x !== url); 
    } else {
        favs.push(url); 
    }
    localStorage.setItem('favChannels', JSON.stringify(favs));
    
    if(currentChannelGroup === 'Favorites') {
        filterChannelGroup('Favorites', document.querySelector('.cat-btn.btn-primary'));
    } else {
        filterChannels(document.getElementById('channelSearch').value);
    }
  };
  
  // ---------- EASTER EGG LOGIC ----------
  const secretWord = ['a', 's', 'b', 'r', 'o', 's'];
  let secretPosition = 0;
  const easterEggSound = new Audio('https://www.myinstants.com/media/sounds/unlock-sound-effect.mp3'); 
  
  document.addEventListener('keydown', function(e) {
    const activeElement = document.activeElement.tagName.toLowerCase();
    if (activeElement === 'input' || activeElement === 'textarea') {
        secretPosition = 0;
        return;
    }
  
    if (e.key.toLowerCase() === secretWord[secretPosition]) {
        secretPosition++;
        if (secretPosition === secretWord.length) {
            easterEggSound.play().catch(err => console.log("Audio block hui", err));
            showToast('Developer Mode Unlocked! 🚀', 'success');
            
            window.location.hash = 'about';
            
            secretPosition = 0; 
        }
    } else {
        secretPosition = 0; 
    }
  });
  
  // ---------- ABOUT / DEVELOPER PAGE ----------
  async function loadAboutPage() {
    const container = document.getElementById('about-view');
    container.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div><div class="mt-2 text-muted fw-bold">Fetching Developer Profile...</div></div>`;
  
    try {
        const [ghRes, projRes] = await Promise.all([
            fetch('https://api.github.com/users/asbros'),
            fetch('https://raw.githubusercontent.com/asbros/asbros.github.io/refs/heads/main/index.json')
        ]);
  
        const ghData = await ghRes.json();
        const projData = await projRes.json();
  
        let html = `
            <div class="row justify-content-center mb-5 mt-2">
                <div class="col-md-8 text-center">
                    <div class="position-relative d-inline-block">
                        <img src="${ghData.avatar_url}" class="rounded-circle shadow-lg mb-3" style="width: 140px; height: 140px; object-fit: cover; border: 4px solid var(--primary);">
                        <span class="position-absolute bottom-0 end-0 p-2 bg-success border border-light rounded-circle" style="margin-bottom: 25px; margin-right: 10px;" title="Online"></span>
                    </div>
                    <h2 class="fw-bold mb-1">${ghData.name || ghData.login}</h2>
                    <p class="text-muted mb-3">${ghData.bio || 'Full Stack Developer & Creator of AS CINEPLEX'}</p>
                    
                    <div class="d-flex justify-content-center gap-3 mt-2">
                        <a href="${ghData.html_url}" target="_blank" class="btn btn-dark rounded-pill px-4 fw-bold shadow-sm">
                            <i class="fa-brands fa-github me-2"></i>Follow on GitHub
                        </a>
                        <div class="badge bg-light text-dark border d-flex align-items-center px-3 py-2 rounded-pill shadow-sm">
                            <i class="fa fa-users me-2 text-primary"></i> ${ghData.followers} Followers
                        </div>
                    </div>
                </div>
            </div>
            
            <h5 class="section-header mb-4">MY PROJECTS</h5>
            <div class="row justify-content-center mb-5">
        `;
  
        const projects = Array.isArray(projData) ? projData : (projData.projects || projData.items || []);
  
        if (projects.length === 0) {
            html += `<div class="col-12 text-center text-muted">No projects found in the repository.</div>`;
        } else {
            projects.forEach(p => {
                const title = p.name || p.title || 'Untitled Project';
                const desc = p.description || p.desc || 'No description provided for this project.';
                const link = p.url || p.link || p.homepage || '#';
                const img = p.image || p.img || p.thumbnail || FALLBACK_IMG;
  
                html += `
                    <div class="col-12 col-md-10 col-lg-8 mb-3">
                        <div class="card border-1 shadow-sm rounded-4 overflow-hidden" style="background: var(--surface); border-color: var(--border) !important; transition: all 0.3s ease;">
                            <div class="d-flex p-3 gap-3 align-items-center">
                                
                                <div class="flex-shrink-0">
                                    <img src="${img}" alt="${title}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 12px;" onerror="this.src='${FALLBACK_IMG}'">
                                </div>
                                
                                <div class="d-flex flex-column flex-grow-1 text-start" style="min-width: 0;">
                                    <h5 class="fw-bold mb-1 text-truncate" style="font-size: 1.1rem;">${title}</h5>
                                    <p class="text-muted small mb-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;">${desc}</p>
                                    
                                    <div class="mt-auto">
                                        <a href="${link}" target="_blank" class="btn btn-sm btn-outline-primary rounded-pill fw-bold px-4 py-1">
                                            View Project <i class="fa fa-arrow-up-right-from-square ms-1" style="font-size: 0.8rem;"></i>
                                        </a>
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                `;
            });
        }
  
        html += `</div>`;
        container.innerHTML = html;
  
    } catch (err) {
        console.error("About page error:", err);
        container.innerHTML = `
            <div class="text-center text-danger py-5">
                <i class="fa fa-triangle-exclamation fs-1 mb-3"></i><br>
                <h5 class="fw-bold">Failed to load Developer Profile</h5>
                <p class="small text-muted">Please check your internet connection or the JSON link.</p>
            </div>`;
    }
  }
  
  const CINEPRO_BASE = 'https://cinepro-s59x.onrender.com';
  const LUZA_BASE = 'https://luza-api.antig9469.workers.dev';
  const PREMIUM_SOURCES = [1, 2, 3, 4, 6, 7, 8, 9, 10, 11];
  
  window.adFreeSources = [];
  window.currentAdFreeIndex = 0;
  
  async function loadCineProStream(btnElement) {
  if (window.premiumFetchController) {
      window.premiumFetchController.abort();
  }
  window.premiumFetchController = new AbortController();
  const signal = window.premiumFetchController.signal;
  
  setActiveUI('#serverGrid .server-btn', btnElement);
  
  const qualityGrid = document.getElementById('qualityGrid');
  if (qualityGrid) {
      qualityGrid.innerHTML = '<div class="spinner-border text-primary spinner-border-sm me-2"></div> <span class="small fw-bold text-muted">Scraping best streams...</span>';
  }
  
  document.getElementById('playerContainer').innerHTML = `
      <div class="iframe-loader d-flex justify-content-center align-items-center position-absolute w-100 h-100 bg-dark" style="z-index: 1;">
          <div class="spinner-border text-warning"></div>
          <div class="mt-2 text-white small ms-2 fw-bold">Extracting streams via CinePro...</div>
      </div>
  `;
  
  try {
      let apiUrl = currentType === 'movie' ?
    `${CINEPRO_BASE}/v1/movies/${currentId}` :
    `${CINEPRO_BASE}/v1/tv/${currentId}/seasons/${currentS}/episodes/${currentE}`;
      
      const response = await fetch(apiUrl, { signal });
      if (!response.ok) throw new Error("CinePro API returned an error");
      
      const data = await response.json();
      
  let streams = data.sources || data.stream || data.streams || [];
  
  if (streams.length > 0) {
    window.adFreeSources = streams.map((s, index) => {
        let finalUrl = s.url;
        if (finalUrl) {
            finalUrl = finalUrl.replace(/http:\/\/(localhost|127\.0\.0\.1):\d+/g, CINEPRO_BASE);
        }
        
        return {
            quality: s.quality || `Server ${index + 1}`,
            url: finalUrl,
            lang: 'EN'
        };
    }).filter(s => s.url); 
    
    if (window.adFreeSources.length > 0) {
        renderQualities();
        return;
    }
  }
      
      throw new Error("No playable streams found.");
      
  } catch (error) {
    if (error.name === 'AbortError') {
        console.log('CinePro fetch aborted by user navigation.');
        return;
    }
    
    console.warn(`CinePro extraction failed:`, error);
    
    const fallbackBtn = document.getElementById('premium-btn-1'); 
    
    if (fallbackBtn) {
        showToast(`CinePro failed. Auto-switching to Premium 1...`, 'info');
        
        setTimeout(() => {
            fallbackBtn.click(); 
        }, 800);
        
    } else {
        if (qualityGrid) {
            qualityGrid.innerHTML = `<span class="text-danger small fw-bold"><i class="fa fa-triangle-exclamation me-1"></i> Extraction failed.</span>`;
        }
        
        document.getElementById('playerContainer').innerHTML = `
              <div class="d-flex align-items-center justify-content-center h-100 w-100 bg-dark text-white flex-column">
                  <i class="fa fa-video-slash fs-1 text-danger mb-3"></i>
                  <p class="text-danger fw-bold">CinePro couldn't find a raw stream.</p>
                  <p class="text-muted small">Please switch back to normal servers.</p>
                  
                  <button class="btn btn-outline-light mt-3 px-4 rounded-pill fw-bold" 
                      onclick="document.getElementById('playbackModeSelect').value = 'with_ads'; updatePref('playbackMode', 'with_ads'); buildServerButtons(true);">
                      Switch to Normal Servers
                  </button>
              </div>`;
    }
  }
  }
  
  async function loadPremiumServer(srcId, btnElement) {
  if (window.premiumFetchController) {
      window.premiumFetchController.abort();
  }
  window.premiumFetchController = new AbortController();
  const signal = window.premiumFetchController.signal;
  
  setActiveUI('#serverGrid .server-btn', btnElement);
  
  const qualityGrid = document.getElementById('qualityGrid');
  if (qualityGrid) {
      qualityGrid.innerHTML = '<div class="spinner-border text-primary spinner-border-sm me-2"></div> <span class="small fw-bold text-muted">Fetching qualities...</span>';
  }
  
  document.getElementById('playerContainer').innerHTML = `
      <div class="iframe-loader d-flex justify-content-center align-items-center position-absolute w-100 h-100 bg-dark" style="z-index: 1;">
          <div class="spinner-border text-primary"></div>
          <div class="mt-2 text-white small ms-2 fw-bold">Connecting to Premium ${srcId}...</div>
      </div>
  `;
  
  try {
      let proxyUrl = currentType === 'movie' ?
          `${LUZA_BASE}/proxy/movie/${srcId}?id=${currentId}` :
          `${LUZA_BASE}/proxy/tv/${srcId}?id=${currentId}&season=${currentS}&episode=${currentE}`;
      
      const encRes = await fetch(proxyUrl, { signal });
      const encData = await encRes.json();
      
      if (!encData.ok || !encData.payload) {
          throw new Error("No payload returned from API.");
      }
      
      const decUrl = `${LUZA_BASE}/decrypt?data=${encodeURIComponent(encData.payload.data)}&iv=${encodeURIComponent(encData.payload.iv)}`;
      const decRes = await fetch(decUrl, { signal });
      const decData = await decRes.json();
      
      if (decData && decData.result) {
          let streams = Array.isArray(decData.result) ?
              decData.result :
              (decData.result.streams || decData.result.data || [decData.result]);
          
          if (streams.length > 0) {
              window.adFreeSources = streams;
              renderQualities();
              return; 
          }
      }
      throw new Error("Decryption successful, but no streams found.");
      
  } catch (error) {
      if (error.name === 'AbortError') {
          console.log('Luza fetch aborted.');
          return;
      }
  
      console.warn(`Premium Source ${srcId} failed:`, error);
      
      const currentIndex = PREMIUM_SOURCES.indexOf(srcId);
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < PREMIUM_SOURCES.length) {
          const nextSrcId = PREMIUM_SOURCES[nextIndex];
          const nextBtn = document.getElementById(`premium-btn-${nextSrcId}`);
          
          showToast(`Premium ${srcId} failed. Auto-switching to Premium ${nextSrcId}...`, 'info');
          
          setTimeout(() => {
              if (nextBtn) {
                  nextBtn.click();
              }
          }, 800);
          
      } else {
          if (qualityGrid) {
              qualityGrid.innerHTML = `<span class="text-danger small fw-bold"><i class="fa fa-triangle-exclamation me-1"></i> All Premium servers are unreachable right now.</span>`;
          }
          
          document.getElementById('playerContainer').innerHTML = `
              <div class="d-flex align-items-center justify-content-center h-100 w-100 bg-dark text-white flex-column">
                  <i class="fa fa-video-slash fs-1 text-danger mb-3"></i>
                  <p class="text-danger fw-bold">All premium servers failed to load.</p>
                  <p class="text-muted small">Please switch back to normal servers.</p>
              </div>`;
      }
  }
  }
  
  function renderPremiumServers() {
  const serverGrid = document.getElementById('serverGrid');
  serverGrid.innerHTML = '';
  
  let qualityGrid = document.getElementById('qualityGrid');
  if (!qualityGrid) {
      qualityGrid = document.createElement('div');
      qualityGrid.id = 'qualityGrid';
      qualityGrid.className = 'd-flex flex-wrap gap-2 mt-3 w-100';
      serverGrid.parentNode.insertBefore(qualityGrid, serverGrid.nextSibling);
  } else {
      qualityGrid.innerHTML = '';
      qualityGrid.classList.remove('d-none');
  }
  
  const cineBtn = document.createElement('button');
  cineBtn.className = 'server-btn active';
  cineBtn.id = 'premium-cinepro-btn';
  cineBtn.innerHTML = '<i class="fa fa-bolt text-warning me-1"></i> Auto Premium (CinePro)';
  
  cineBtn.onclick = () => {
      document.querySelectorAll('#serverGrid .server-btn').forEach(b => b.classList.remove('active'));
      cineBtn.classList.add('active');
      if (qualityGrid) qualityGrid.classList.remove('d-none');
      loadCineProStream(cineBtn); 
  };
  serverGrid.appendChild(cineBtn);
  
  PREMIUM_SOURCES.forEach((srcId) => {
      const btn = document.createElement('button');
      btn.className = 'server-btn';
      btn.id = `premium-btn-${srcId}`;
      btn.innerText = `Premium ${srcId}`;
      
      btn.onclick = () => {
          document.querySelectorAll('#serverGrid .server-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (qualityGrid) qualityGrid.classList.remove('d-none');
          loadPremiumServer(srcId, btn); 
      };
      serverGrid.appendChild(btn);
  });
  
  cineBtn.click();
  }
   
  function renderQualities() {
    const qualityGrid = document.getElementById('qualityGrid');
    qualityGrid.innerHTML = '<div class="w-100 mb-2 mt-2"><span class="fw-bold text-muted small d-block" style="border-top: 1px solid var(--border); padding-top: 10px;">AVAILABLE QUALITIES</span></div>';
  
    window.adFreeSources.forEach((stream, index) => {
        const btn = document.createElement('button');
        btn.className = 'server-btn quality-btn'; 
        
        const btnLabel = stream.quality || stream.metadata || stream.name || `Link ${index + 1}`;
        const langLabel = stream.lang ? ` (${stream.lang})` : '';
        
        btn.innerText = `${btnLabel}${langLabel}`;
        
        btn.onclick = () => {
            document.querySelectorAll('#qualityGrid .quality-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            window.currentAdFreeIndex = index;
            initJwPlayer(index);
        };
        qualityGrid.appendChild(btn);
    });
  
    const firstQualityBtn = qualityGrid.querySelector('.quality-btn');
    if (firstQualityBtn) firstQualityBtn.click();
  }
   
  function initJwPlayer(index) {
    window.isPlayerActive = true;
    const stream = window.adFreeSources[index];
    if (!stream) return;
    
    const proxyBase = "https://movieboxproxy.veltrix620.workers.dev/";
    const encodedUrl = encodeURIComponent(stream.url);
    const encodedOrigin = encodeURIComponent(stream.origin || "");
    const encodedReferer = encodeURIComponent(stream.referer || "");
    const finalProxyUrl = `${proxyBase}?url=${encodedUrl}&origin=${encodedOrigin}&referer=${encodedReferer}`;
    
    if (window.premiumPlayer) {
        window.premiumPlayer.api("stop");
        window.premiumPlayer = null;
    }
  
    const container = document.getElementById('playerContainer');
    container.innerHTML = `
        <div id="premium-player-js" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;"></div>
    `;
    
    window.premiumPlayer = new Playerjs({
        id: "premium-player-js",
        file: finalProxyUrl,
        autoplay: true
    });
  
    if (currentType === 'tv') {
      let nextBtn = document.createElement('div');
      nextBtn.id = 'nextEpBtn';
      nextBtn.className = 'next-ep-overlay';
      nextBtn.onclick = playNextEpisode;
      nextBtn.style.zIndex = "999"; 
      nextBtn.innerHTML = `
            <div class="next-text">
                <span class="next-label">Up Next</span>
                <span class="next-title">Next Episode</span>
            </div>
            <i class="fa fa-step-forward" style="font-size: 1.5rem;"></i>
        `;
      container.appendChild(nextBtn);
    }
  }
  
  window.playInlineTrailer = function(key, name) {
    const container = document.getElementById('inlineTrailerContainer');
    
    container.classList.remove('d-none');
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    container.innerHTML = `
      <iframe 
        width="100%" 
        height="100%" 
        src="https://www.youtube.com/embed/${key}?autoplay=1&rel=0&modestbranding=1" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen
        style="border-radius: 12px; background: #000;">
      </iframe>
    `;
};
  
  window.handleDownloadClick = function() {
    const playbackMode = localStorage.getItem('playbackMode') || 'without_ads';
    
    if (playbackMode === 'without_ads') {
        if (!window.adFreeSources || window.adFreeSources.length === 0) {
            showToast('No premium source available to download.', 'error');
            return;
        }
        
        const currentStream = window.adFreeSources[window.currentAdFreeIndex];
        if (!currentStream || !currentStream.url) {
            showToast('Invalid stream URL.', 'error');
            return;
        }
        
        const proxyBase = "https://movieboxproxy.veltrix620.workers.dev/";
        const encodedUrl = encodeURIComponent(currentStream.url);
        const encodedOrigin = encodeURIComponent(currentStream.origin || "");
        const encodedReferer = encodeURIComponent(currentStream.referer || "");
        
        const finalProxyUrl = `${proxyBase}?url=${encodedUrl}&origin=${encodedOrigin}&referer=${encodedReferer}`;
        
        Swal.fire({
            title: 'Download Premium Source?',
            text: `The currently playing video (${currentStream.quality || 'Premium'}) will be opened in a new tab for download.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Yes, Proceed!',
            background: 'var(--surface)',
            color: 'var(--text-main)'
        }).then((result) => {
            if (result.isConfirmed) {
                showToast('Opening stream in new tab...', 'success');
                
                const a = document.createElement('a');
                a.href = finalProxyUrl;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
        
    } else {
        const dlModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('downloadModal'));
        dlModal.show();
    }
  };
  
  window.playNextEpisode = function() {
      if (currentType !== 'tv' || !window.episodesData) return;
      
      const nextEpExists = window.episodesData.some(e => e.episode_number == (currentE + 1));
      
      if (nextEpExists) {
          showToast(`Playing Season ${currentS} Episode ${currentE + 1}...`, 'success');
          changeEpisode(currentS, currentE + 1);
      } else {
          const nextSeasonStr = (currentS + 1).toString();
          const seasonDropdown = document.querySelector('.season-dropdown');
          
          if (seasonDropdown && seasonDropdown.querySelector(`option[value="${nextSeasonStr}"]`)) {
              showToast(`Starting Season ${nextSeasonStr}...`, 'success');
              seasonDropdown.value = nextSeasonStr;
              switchSeason(nextSeasonStr);
          } else {
              showToast('You have finished this series!', 'info');
          }
      }
  };
  
  // --- LIGHTBOX VARIABLES & FUNCTIONS ---
  window.currentGalleryImages = [];
  window.currentLightboxIndex = 0;
  
  window.openLightbox = function(index) {
    window.currentLightboxIndex = index;
    const lightbox = document.getElementById('imageLightbox');
    const img = document.getElementById('lightboxImage');
    
    img.src = window.currentGalleryImages[index];
    lightbox.classList.add('active');
    
    document.addEventListener('keydown', lightboxKeyHandler);
  };
  
  window.closeLightbox = function() {
    const lightbox = document.getElementById('imageLightbox');
    lightbox.classList.remove('active');
    
    document.removeEventListener('keydown', lightboxKeyHandler);
    
    setTimeout(() => {
        document.getElementById('lightboxImage').src = "";
    }, 300);
  };
  
  window.changeLightboxImage = function(direction) {
    window.currentLightboxIndex += direction;
    
    if (window.currentLightboxIndex < 0) {
        window.currentLightboxIndex = window.currentGalleryImages.length - 1;
    } else if (window.currentLightboxIndex >= window.currentGalleryImages.length) {
        window.currentLightboxIndex = 0;
    }
    
    document.getElementById('lightboxImage').src = window.currentGalleryImages[window.currentLightboxIndex];
  };
  
  function lightboxKeyHandler(e) {
    if (e.key === 'ArrowRight') {
        changeLightboxImage(1);
    } else if (e.key === 'ArrowLeft') {
        changeLightboxImage(-1);
    } else if (e.key === 'Escape') {
        closeLightbox();
    }
  }
