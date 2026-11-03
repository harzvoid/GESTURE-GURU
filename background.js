// 🚀 GestureGuru Real-time Subtitle Sync background script
console.log("🚀 Background script loaded");

let floatingWindowId = null;

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ gestureGuruSettings: {
    autoMode: true,
    videoListen: true,
    speedSync: true,
  }});
});

// Helper: Find Gesture Window
async function getGestureTab() {
  const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL("gesture-window.html") });
  return tabs.length > 0 ? tabs[0] : null;
}

// Window Management Functions
async function createGestureWindow() {
  const existingTab = await getGestureTab();
  if (existingTab) {
    await chrome.windows.update(existingTab.windowId, { focused: true });
    return { success: true };
  }

  const window = await chrome.windows.create({
    url: chrome.runtime.getURL("gesture-window.html"),
    type: "popup",
    width: 400,
    height: 500,
    left: 100,
    top: 100,
    focused: true,
  });

  floatingWindowId = window.id;
  return { success: true };
}

async function closeGestureWindow() {
  const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL("gesture-window.html") });
  for (const tab of tabs) {
    try { await chrome.windows.remove(tab.windowId); } catch (e) {}
  }
  floatingWindowId = null;
  return { success: true };
}

// SINGLE CONSOLIDATED MESSAGE LISTENER
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const senderType = sender.tab ? "YouTube" : "Popup";
  console.log(`📥 Incoming from ${senderType}: ${request.action}`);

  // 1. Window Controls
  if (request.action === "openGestureWindow") {
    createGestureWindow()
      .then(windowObj => sendResponse({ success: true, id: windowObj?.id }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; 
  }

  if (request.action === "closeGestureWindow") {
    closeGestureWindow().then(sendResponse);
    return true;
  }

  if (request.action === "getWindowStatus") {
    getGestureTab().then(tab => sendResponse({ isOpen: !!tab }));
    return true;
  }

  // 2. Silent Registration (Prevents Double-Window Loop)
  if (request.action === "registerGestureWindow") {
    floatingWindowId = sender.tab.windowId;
    sendResponse({ success: true });
    return true;
  }

  // 3. Data Forwarding (YouTube -> Gesture Window)
  if (actionsToForward.includes(request.action)) {
    getGestureTab().then(tab => {
      if (tab) {
        // Forward the message to the Gesture Window
        chrome.tabs.sendMessage(tab.id, request).catch((err) => {
          console.warn("Could not reach Gesture Window tab:", err.message);
        });
        sendResponse({ success: true, forwarded: true });
      } else {
        // No window found, but still respond to YouTube to close the channel
        sendResponse({ success: true, forwarded: false });
      }
    });
    return true; // Keep channel open for the getGestureTab promise
  }

  // If we reach here, we didn't return true, but it's good practice 
  // to respond if the action wasn't recognized.
  if (!actionsToForward.includes(request.action)) {
     sendResponse({ error: "Unknown action" });
  }
  // Do NOT return true here.
});

// Handle manual 'X' click on window
chrome.windows.onRemoved.addListener(async (windowId) => {
  const tab = await getGestureTab();
  if (!tab) {
    floatingWindowId = null;
    chrome.runtime.sendMessage({ action: "windowClosedExternally" }).catch(() => {});
  }
});

// // Background script for GestureGuru extension - Real-time Subtitle Sync
// console.log("🚀 GestureGuru Real-time Subtitle Sync background script loaded");

// // Keep the Service worker alive
// const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20000);
// chrome.runtime.onStartup.addListener(keepAlive);
// keepAlive();


// let floatingWindowId = null;
// let isCapturingAudio = false;
// let currentSettings = {
//   autoMode: true,
//   videoListen: true,
//   speedSync: true,
// };

// // Store subtitle data for current video
// let currentSubtitleData = [];
// let currentVideoInfo = null;

// // Handle extension installation
// chrome.runtime.onInstalled.addListener(() => {
//   console.log("GestureGuru extension installed");
//   // Initialize default settings
//   chrome.storage.sync.set({ gestureGuruSettings: currentSettings });
// });

// // Handle extension icon click - now opens popup automatically
// // No click handler needed as popup is set in manifest

// // Create floating gesture window
// async function createGestureWindow() {
//   if (floatingWindowId) {
//     // If window exists, focus it
//     try {
//       await chrome.windows.update(floatingWindowId, { focused: true });
//       return { success: true, windowId: floatingWindowId };
//     } catch (error) {
//       // Window doesn't exist anymore, create new one
//       floatingWindowId = null;
//     }
//   }

//   try {
//     // Create floating window with only the 3D model
//     const window = await chrome.windows.create({
//       url: chrome.runtime.getURL("gesture-window.html"),
//       type: "popup",
//       width: 400,
//       height: 500,
//       left: 100,
//       top: 100,
//       focused: true,
//     });

//     floatingWindowId = window.id;
//     return { success: true, windowId: floatingWindowId };
//   } catch (error) {
//     console.error("Error creating gesture window:", error);
//     return { success: false, error: error.message };
//   }
// }

// // Close gesture window
// // Inside background.js
// async function closeGestureWindow() {
//   // Query for any tab running the gesture window
//   const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL("gesture-window.html") });
  
//   if (tabs.length > 0) {
//     for (const tab of tabs) {
//       await chrome.windows.remove(tab.windowId);
//     }
//     return { success: true };
//   }
//   return { success: false };
// }


// // Handle window removal
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
//     if (request.action === "closeGestureWindow") {
//         // Handle the async function here
//         closeGestureWindow().then((response) => {
//             sendResponse(response);
//         });
        
//         // This MUST be exactly here, inside the listener, 
//         // to tell Chrome we will call sendResponse later.
//         return true; 
//     }
// });

// // Function to start audio capture
// async function startAudioCapture(tabId) {
//   try {
//     const stream = await chrome.tabCapture.capture({
//       audio: true,
//       video: false,
//     });
//     isCapturingAudio = true;
//     return stream;
//   } catch (error) {
//     console.error("Error capturing audio:", error);
//     return null;
//   }
// }

// // Function to stop audio capture
// function stopAudioCapture() {
//   isCapturingAudio = false;
//   // Additional cleanup can be added here
// }

// // Helper function to forward messages to gesture window with error handling
// // 1. IMPROVED: Helper function that finds the tab by URL instead of just ID
// function forwardToGestureWindow(messageData, retries = 5) {
//   // Use extension-wide query to find the specific page
//   chrome.tabs.query({ url: chrome.runtime.getURL("gesture-window.html") }, (tabs) => {
//     if (tabs.length > 0) {
//       const targetTab = tabs[0];
//       chrome.tabs.sendMessage(targetTab.id, messageData, (response) => {
//         if (chrome.runtime.lastError) {
//           if (retries > 0) {
//             console.log(`🔄 Retrying... ${chrome.runtime.lastError.message}`);
//             setTimeout(() => forwardToGestureWindow(messageData, retries - 1), 1000);
//           }
//         } else {
//           console.log("✅ DELIVERED:", messageData.action);
//         }
//       });
//     } else {
//       console.log("⚠️ Gesture Window not found in tab list.");
//     }
//   });
// }

// // 2. UPDATED: Message Handler
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   // Use a different log to distinguish between incoming and outgoing
//   console.log("📥 Incoming from " + (sender.tab ? "YouTube" : "Popup") + ":", request.action);

//   if (request.action === "openGestureWindow") {
//     createGestureWindow().then(sendResponse);
//     return true;
//   } 
  
//   if (request.action === "getWindowStatus") {
//     // Dynamically check if the tab exists rather than just checking a variable
//     chrome.tabs.query({}, (tabs) => {
//       const exists = tabs.some(t => t.url && t.url.includes("gesture-window.html"));
//       sendResponse({ isOpen: exists });
//     });
//     return true;
//   }

//   // 3. Forwarding logic
//   const actionsToForward = [
//     "subtitleData", 
//     "videoPlayback", 
//     "videoSpeedChange", 
//     "speechTranscript", 
//     "speechStatus",
//     "gestureText",
//     "animateText"
//   ];

//   if (actionsToForward.includes(request.action)) {
//     forwardToGestureWindow(request);
//     sendResponse({ success: true });
//   }

//   return true; 
// });

// // Handle messages from content scripts or popup
// // Streamlined Message Handler
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log("Message received:", request.action);

//   // 1. Internal Extension Controls (Window Management)
//   if (request.action === "registerGestureWindow") {
//     // sender.tab.id is the actual ID of the popup window
//     floatingWindowId = sender.tab.windowId; 
//     console.log("📍 Gesture Window Auto-Registered. ID:", floatingWindowId);
//     return true;
//   }

//   if (request.action === "openGestureWindow") {
//     createGestureWindow().then(sendResponse);
//     return true;
//   } 
  
//   if (request.action === "getWindowStatus") {
//     sendResponse({ isOpen: floatingWindowId !== null });
//     return true;
//   }

//   // 2. Data Forwarding (From YouTube to Gesture Window)
//   // We use the helper function forwardToGestureWindow to avoid code repetition
//   const actionsToForward = [
//     "subtitleData", 
//     "videoPlayback", 
//     "videoSpeedChange", 
//     "speechTranscript", 
//     "speechStatus",
//     "gestureText",
//     "animateText"
//   ];

//   if (actionsToForward.includes(request.action)) {
//     forwardToGestureWindow(request); // Forward the exact object received
//     sendResponse({ success: true });
//   }

//   return true; 
// });

// chrome.runtime.onConnect.addListener((port) => {
//   if (port.name === "gestureGuru") {
//     port.onMessage.addListener((request) => {
//       if (request.action === "gestureText") {
//         // Use the improved forwarder instead of a direct send
//         forwardToGestureWindow({
//           action: "gestureText",
//           data: request.data,
//           timestamp: request.timestamp,
//         });
//       }
//     });
//   }
// });