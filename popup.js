// Popup script for GestureGuru extension
console.log("GestureGuru popup loaded");

let currentSettings = {
  autoMode: true,
  videoListen: true,
  speedSync: true,
  windowOpen: false,
};

// DOM elements
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const videoInfo = document.getElementById("videoInfo");
const openWindowBtn = document.getElementById("openWindowBtn");
const closeWindowBtn = document.getElementById("closeWindowBtn");
const testAnimationBtn = document.getElementById("testAnimationBtn");
const autoModeToggle = document.getElementById("autoModeToggle");
const videoListenToggle = document.getElementById("videoListenToggle");
const speedSyncToggle = document.getElementById("speedSyncToggle");

// Initialize popup
document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  setupEventListeners();
  updateStatus();
  checkWindowStatus();
});

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(["gestureGuruSettings"]);
    if (result.gestureGuruSettings) {
      currentSettings = { ...currentSettings, ...result.gestureGuruSettings };
    }
    updateUI();
  } catch (error) {
    console.error("Error loading settings:", error);
  }
}

// Save settings to storage
async function saveSettings() {
  try {
    await chrome.storage.sync.set({ gestureGuruSettings: currentSettings });
    // Notify content scripts about settings change
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      chrome.tabs
        .sendMessage(tabs[0].id, {
          action: "settingsUpdated",
          settings: currentSettings,
        })
        .catch(() => {
          // Content script might not be loaded
        });
    }
  } catch (error) {
    console.error("Error saving settings:", error);
  }
}

// Update UI based on current settings
function updateUI() {
  autoModeToggle.classList.toggle("active", currentSettings.autoMode);
  videoListenToggle.classList.toggle("active", currentSettings.videoListen);
  speedSyncToggle.classList.toggle("active", currentSettings.speedSync);

  if (currentSettings.windowOpen) {
    openWindowBtn.style.display = "none";
    closeWindowBtn.style.display = "block";
  } else {
    openWindowBtn.style.display = "block";
    closeWindowBtn.style.display = "none";
  }
}

// Setup event listeners
function setupEventListeners() {
  // Window controls
  openWindowBtn.addEventListener("click", async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "openGestureWindow",
      });
      if (response.success) {
        currentSettings.windowOpen = true;
        updateUI();
        await saveSettings();
      }
    } catch (error) {
      console.error("Error opening window:", error);
    }
  });

  closeWindowBtn.addEventListener("click", async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "closeGestureWindow",
      });
      if (response.success) {
        currentSettings.windowOpen = false;
        updateUI();
        await saveSettings();
      }
    } catch (error) {
      console.error("Error closing window:", error);
    }
  });

  // Test Animation button
  testAnimationBtn.addEventListener("click", async () => {
    try {
      testAnimationBtn.disabled = true;
      testAnimationBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Starting Demo...';

      // First, ensure gesture window is open
      console.log("🎭 Opening gesture window for demo...");
      const windowResponse = await chrome.runtime.sendMessage({
        action: "openGestureWindow",
      });

      if (!windowResponse || !windowResponse.success) {
        throw new Error("Failed to open gesture window");
      }

      // Update settings to reflect window is open
      currentSettings.windowOpen = true;
      updateUI();
      await saveSettings();

      // Wait for gesture window to load
      await new Promise((resolve) => setTimeout(resolve, 2000));

      testAnimationBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Running Demo...';

      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tabs[0]) {
        throw new Error("No active tab found");
      }

      const tab = tabs[0];

      // Check if we can inject content script on this page
      if (
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://") ||
        tab.url.startsWith("edge://") ||
        tab.url.startsWith("about:") ||
        tab.url.startsWith("moz-extension://")
      ) {
        throw new Error(
          "Extension cannot run on this page. Please navigate to a website first."
        );
      }

      // Ensure content script is loaded
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
        console.log("Content script injected");
      } catch (injectError) {
        console.log(
          "Content script injection failed or already loaded:",
          injectError.message
        );
      }

      // Wait a moment for script to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Send message to content script to run demo animation
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "runDemoAnimation",
      });

      if (response && response.success) {
        testAnimationBtn.innerHTML =
          '<i class="fas fa-check"></i> Demo Started!';
        testAnimationBtn.style.background =
          "linear-gradient(135deg, #4CAF50, #45a049)";

        // Show success message
        setTimeout(() => {
          testAnimationBtn.innerHTML =
            '<i class="fas fa-play"></i> Test Animation';
          testAnimationBtn.style.background =
            "linear-gradient(135deg, #9c27b0, #7b1fa2)";
        }, 3000);
      } else {
        throw new Error(response?.error || "Demo failed to start");
      }
    } catch (error) {
      console.error("Error running test animation:", error);
      testAnimationBtn.innerHTML =
        '<i class="fas fa-exclamation-triangle"></i> Demo Failed';
      testAnimationBtn.style.background =
        "linear-gradient(135deg, #f44336, #d32f2f)";

      // Show error details in console
      if (error.message.includes("Extension cannot run")) {
        console.log("Please navigate to a website (like YouTube) first");
      }

      setTimeout(() => {
        testAnimationBtn.innerHTML =
          '<i class="fas fa-play"></i> Test Animation';
        testAnimationBtn.style.background =
          "linear-gradient(135deg, #9c27b0, #7b1fa2)";
      }, 3000);
    } finally {
      setTimeout(() => {
        testAnimationBtn.disabled = false;
      }, 1000);
    }
  });

  // Setting toggles
  autoModeToggle.addEventListener("click", async () => {
    currentSettings.autoMode = !currentSettings.autoMode;
    updateUI();
    await saveSettings();

    // Send message to background script
    chrome.runtime.sendMessage({
      action: "updateSettings",
      settings: currentSettings,
    });
  });

  videoListenToggle.addEventListener("click", async () => {
    currentSettings.videoListen = !currentSettings.videoListen;
    updateUI();
    await saveSettings();

    chrome.runtime.sendMessage({
      action: "updateSettings",
      settings: currentSettings,
    });
  });

  speedSyncToggle.addEventListener("click", async () => {
    currentSettings.speedSync = !currentSettings.speedSync;
    updateUI();
    await saveSettings();

    chrome.runtime.sendMessage({
      action: "updateSettings",
      settings: currentSettings,
    });
  });
}

// Update status information
async function updateStatus() {
  try {
    // Get current tab info
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      const tab = tabs[0];

      // Check if we can inject content script on this page
      if (
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://") ||
        tab.url.startsWith("edge://") ||
        tab.url.startsWith("about:") ||
        tab.url.startsWith("moz-extension://")
      ) {
        statusText.textContent = "Extension pages not supported";
        statusDot.classList.add("inactive");
        videoInfo.textContent = "Navigate to a website with videos";
        return;
      }

      // Try to inject content script if not already present
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // Simple function to check if content script is loaded
            return window.gestureGuruContentLoaded || false;
          },
        });
      } catch (error) {
        // Inject content script if it's not loaded
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"],
          });
          console.log("Content script injected");
        } catch (injectError) {
          console.log("Cannot inject content script:", injectError);
          statusText.textContent = "Cannot access this page";
          statusDot.classList.add("inactive");
          videoInfo.textContent = "Extension cannot run on this page";
          return;
        }
      }

      // Now try to get video status
      chrome.tabs
        .sendMessage(tab.id, { action: "getVideoStatus" })
        .then((response) => {
          if (response) {
            updateVideoStatus(response);
          }
        })
        .catch(() => {
          // Content script still might not be loaded
          statusText.textContent = "Checking for videos...";
          statusDot.classList.add("inactive");
          videoInfo.textContent = "Loading...";
        });
    }
  } catch (error) {
    console.error("Error updating status:", error);
    statusText.textContent = "Error";
    statusDot.classList.add("inactive");
    videoInfo.textContent = "Failed to check video status";
  }
}

// Update video status display
function updateVideoStatus(status) {
  if (status.playingVideos > 0) {
    statusText.textContent = `Listening (${status.playingVideos} video${
      status.playingVideos > 1 ? "s" : ""
    })`;
    statusDot.classList.remove("inactive");
    videoInfo.textContent = `${status.totalVideos} video${
      status.totalVideos !== 1 ? "s" : ""
    } detected, ${status.playingVideos} playing`;
  } else if (status.totalVideos > 0) {
    statusText.textContent = "Videos detected, not playing";
    statusDot.classList.add("inactive");
    videoInfo.textContent = `${status.totalVideos} video${
      status.totalVideos !== 1 ? "s" : ""
    } detected`;
  } else {
    statusText.textContent = "No videos found";
    statusDot.classList.add("inactive");
    videoInfo.textContent = "Navigate to a page with videos";
  }
}

// Check if gesture window is open
async function checkWindowStatus() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "getWindowStatus",
    });
    if (response) {
      currentSettings.windowOpen = response.isOpen;
      updateUI();
    }
  } catch (error) {
    console.error("Error checking window status:", error);
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "statusUpdate") {
    updateVideoStatus(request.status);
  } else if (request.action === "windowClosed") {
    currentSettings.windowOpen = false;
    updateUI();
    saveSettings();
  }
});

// Update status periodically
setInterval(updateStatus, 3000);
