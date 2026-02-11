
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

 
  const query = encodeURIComponent(currentValue);
  const filter = modeFilters[currentMode];
  const url = filter 
    ? `https://www.youtube.com/results?search_query=${query}&sp=${filter}`
    : `https://www.youtube.com/results?search_query=${query}`;

  
  localStorage.setItem('lastSearch', currentValue);
  localStorage.setItem('lastMode', currentMode);

  
  searchBox.value = "";
  
  
  searchBox.dataset.allowResearch = 'true';

  setTimeout(() => {
    window.location.href = url;
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