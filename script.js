
const searchBox = document.getElementById("searchBox");
const pasteBtn = document.getElementById("pasteBtn");
const popupOverlay = document.getElementById("popupOverlay");
const popupClose = document.getElementById("popupClose");
const modeButtons = document.querySelectorAll('.mode-btn');
const currentModeText = document.getElementById('currentModeText');

let lastValue = "";
let isRedirecting = false;
let currentMode = "hour";
let inputTimeout = null;


const originalPasteBtnHTML = pasteBtn.innerHTML;

const modeFilters = {
  hour: "EgIIAQ%3D%3D",
  today: "EgIIAg%3D%3D",
  normal: ""
};

const modeTexts = {
  hour: "Last Hour Videos",
  today: "Today's Videos",
  normal: "All Videos"
};


const canPaste = () => navigator.clipboard && typeof navigator.clipboard.readText === "function";


function setActiveMode(mode) {
  modeButtons.forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  
  currentMode = mode;
  currentModeText.textContent = `Searching: ${modeTexts[mode]}`;
  localStorage.setItem('preferredMode', mode);
}


function resetToInitialState() {
  searchBox.value = "";
  pasteBtn.innerHTML = originalPasteBtnHTML;
  pasteBtn.style.opacity = '1';
  pasteBtn.disabled = false;
  isRedirecting = false;
  lastValue = "";
  searchBox.focus();
}

function isYouTubeUrl(text) {
  const youtubePatterns = [
    /youtu\.be\/[a-zA-Z0-9_-]+/i,
    /youtube\.com\/watch\?v=[a-zA-Z0-9_-]+/i,
    /youtube\.com\/embed\/[a-zA-Z0-9_-]+/i,
    /youtube\.com\/shorts\/[a-zA-Z0-9_-]+/i
  ];
  
  return youtubePatterns.some(pattern => pattern.test(text));
}

function extractVideoId(url) {
  
  const youtuBeMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (youtuBeMatch) return youtuBeMatch[1];
  
  
  const youtubeMatch = url.match(/(?:v=|embed\/|shorts\/)([a-zA-Z0-9_-]+)/);
  if (youtubeMatch) return youtubeMatch[1];
  
  return null;
}

function doSearch() {
  const value = searchBox.value.trim();
  if (!value || isRedirecting) return;

  
  const currentValue = value;
  
  
  if (value === lastValue && !searchBox.dataset.allowResearch) {
    return;
  }

  isRedirecting = true;
  lastValue = currentValue;

  
  pasteBtn.innerHTML = '<i class="bi bi-search"></i> Searching...';
  pasteBtn.style.opacity = '0.9';
  pasteBtn.disabled = true;

  
  let url;
  if (isYouTubeUrl(currentValue)) {
    // It's a YouTube URL - redirect directly to mobile version
    const videoId = extractVideoId(currentValue);
    if (videoId) {
     
      url = `https://m.youtube.com/watch?v=${videoId}`;
    } else {
      
      const query = encodeURIComponent(currentValue);
      const filter = modeFilters[currentMode];
      url = `https://m.youtube.com/results?search_query=${query}${filter ? `&sp=${filter}` : ''}`;
    }
  } else {
    
    const query = encodeURIComponent(currentValue);
    const filter = modeFilters[currentMode];
    url = `https://m.youtube.com/results?search_query=${query}${filter ? `&sp=${filter}` : ''}`;
  }

  
  localStorage.setItem('lastSearch', currentValue);
  localStorage.setItem('lastMode', currentMode);

  
  searchBox.value = "";
  
 
  searchBox.dataset.allowResearch = 'true';

  
  setTimeout(() => {
   
    try {
      window.location.href = url;
    } catch (error) {
      console.error("Redirect error:", error);
      
      window.open(url, '_blank');
      resetToInitialState();
    }
  }, 100);
}

function handleInput() {
 
  if (searchBox.dataset.allowResearch) {
    delete searchBox.dataset.allowResearch;
  }
  
  if (inputTimeout) clearTimeout(inputTimeout);
  
  inputTimeout = setTimeout(() => {
    if (searchBox.value.trim().length >= 1) {
      doSearch();
    }
  }, 400);
}


searchBox.addEventListener("input", handleInput);

searchBox.addEventListener("keypress", (e) => {
  if (e.key === 'Enter') {
    doSearch();
  }
});


searchBox.addEventListener("focus", () => {
  pasteBtn.innerHTML = originalPasteBtnHTML;
  pasteBtn.style.opacity = '1';
  pasteBtn.disabled = false;
});

pasteBtn.addEventListener("click", async () => {
  
  pasteBtn.style.transform = "scale(0.98)";
  setTimeout(() => pasteBtn.style.transform = "", 100);

  if (!canPaste()) {
    popupOverlay.style.display = "flex";
    return;
  }

  try {
    const text = await navigator.clipboard.readText();
    if (text && text.trim()) {
      // Set value in input box
      searchBox.value = text.trim();
      
      
      setTimeout(() => doSearch(), 50);
    }
  } catch (err) {
    popupOverlay.style.display = "flex";
  }
});

modeButtons.forEach(button => {
  button.addEventListener('click', function() {
    const mode = this.getAttribute('data-mode');
    setActiveMode(mode);
    if (searchBox.value.trim().length >= 1) {
      
      setTimeout(() => doSearch(), 50);
    }
  });
});

popupClose.addEventListener("click", () => {
  popupOverlay.style.display = "none";
});

popupOverlay.addEventListener("click", (e) => {
  if (e.target === popupOverlay) popupOverlay.style.display = "none";
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const savedMode = localStorage.getItem('preferredMode');
  if (savedMode && modeFilters[savedMode]) {
    setActiveMode(savedMode);
  }
  
  
  localStorage.removeItem('lastSearch');
  localStorage.removeItem('lastMode');
  
  
  resetToInitialState();
  
  
  setTimeout(() => {
    searchBox.focus();
  }, 100);
});


document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Page is visible again (user returned)
    resetToInitialState();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(console.error);
  });
}


document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'v' && document.activeElement !== searchBox) {
    e.preventDefault();
    pasteBtn.click();
  }
  
  if (!isRedirecting) {
    if (e.key === '1') setActiveMode('hour');
    else if (e.key === '2') setActiveMode('today');
    else if (e.key === '3') setActiveMode('normal');
  }
});


function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

if (isMobileDevice()) {
  console.log("Mobile device detected - optimized for m.youtube.com");
}