// Mark that content script is loaded
window.gestureGuruContentLoaded = true;

let videoElements = [];
let isListening = false;
let recognitionInstance = null;

// Real-time subtitle synchronization variables
let subtitleData = [];
let currentVideo = null;
let timestampMonitor = null;
let lastProcessedTime = -1;
let isYouTubeVideo = false;

// Extension context management
let extensionContextValid = true;
let gestureWindow = null;
let lastGestureData = null;

// Check if extension context is valid
function checkExtensionContext() {
  try {
    if (chrome.runtime && chrome.runtime.id) {
      extensionContextValid = true;
      return true;
    }
  } catch (error) {
    extensionContextValid = false;
    console.log("⚠️ Extension context invalid, switching to direct communication");
    return false;
  }
  extensionContextValid = false;
  return false;
}

function getGestureWindow() {
  if (!gestureWindow || gestureWindow.closed) {
    const windows = window.open("", "gestureWindow");
    if (windows && !windows.closed) {
      gestureWindow = windows;
    }
  }
  return gestureWindow;
}

function isYouTube() {
  return window.location.hostname.includes("youtube.com") || window.location.hostname.includes("youtu.be");
}

function getYouTubeVideoId() {
  const url = window.location.href;
  const patterns = [/[?&]v=([^&]+)/, /youtu\.be\/([^?&]+)/, /embed\/([^?&]+)/];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

function getDemoSubtitles() {
  console.log("🎭 Using realistic demo subtitles for testing");
  return [
    { start: 0, end: 2.5, text: "HELLO" },
    { start: 2.5, end: 5.0, text: "WORLD" },
    { start: 5.0, end: 9.0, text: "WHAZZUP" }, 
    { start: 9.0, end: 13.0, text: "HOW ARE YOU" },
    { start: 13.0, end: 17.0, text: "GOOD MORNING" },
    { start: 17.0, end: 20.0, text: "THANK YOU" },
    { start: 20.0, end: 23.5, text: "GOODBYE" },
    { start: 23.5, end: 27.0, text: "HAVE A NICE DAY" },
    { start: 27.0, end: 30.5, text: "SEE YOU LATER" },
    { start: 30.5, end: 33.0, text: "TAKE CARE" },
    { start: 33.0, end: 36.0, text: "WELCOME" },
    { start: 36.0, end: 38.5, text: "PLEASE" },
    { start: 38.5, end: 41.0, text: "SORRY" },
    { start: 41.0, end: 44.5, text: "EXCUSE ME" },
    { start: 44.5, end: 46.0, text: "YES" },
    { start: 46.0, end: 47.5, text: "NO" },
    { start: 47.5, end: 50.0, text: "MAYBE" },
    { start: 50.0, end: 52.5, text: "HELP" },
    { start: 52.5, end: 54.0, text: "STOP" },
    { start: 54.0, end: 56.0, text: "GO" },
    { start: 56.0, end: 59.0, text: "COME HERE" },
    { start: 59.0, end: 62.0, text: "LISTEN" },
    { start: 62.0, end: 65.5, text: "UNDERSTAND" },
    { start: 65.5, end: 68.0, text: "BEAUTIFUL" },
    { start: 68.0, end: 71.0, text: "AMAZING" },
    { start: 71.0, end: 74.5, text: "WONDERFUL" },
    { start: 74.5, end: 77.0, text: "FANTASTIC" },
    { start: 77.0, end: 80.0, text: "PERFECT" },
  ];
}

function runDemoAnimation() {
  console.log("🚀 Starting demo animation test...");
  subtitleData = getDemoSubtitles();
  console.log("📝 Loaded", subtitleData.length, "demo subtitle entries");

  let currentDemoTime = 0;
  const demoInterval = setInterval(() => {
    const subtitle = findSubtitleAtTime(currentDemoTime);

    if (subtitle) {
      const demoGestureData = {
        text: subtitle.text,
        duration: subtitle.end - currentDemoTime,
        totalDuration: subtitle.end - subtitle.start,
        startTime: subtitle.start,
        endTime: subtitle.end,
        currentTime: currentDemoTime,
        progressInSubtitle: currentDemoTime - subtitle.start,
        progressPercentage: ((currentDemoTime - subtitle.start) / (subtitle.end - subtitle.start)) * 100,
        playbackRate: 1.0,
        timestamp: Date.now(),
        videoId: "demo",
        urgent: false,
        isDemo: true,
      };
      safeNotifyGestureText(demoGestureData);
    }
    currentDemoTime += 0.5; 
    if (currentDemoTime > 85) {
      console.log("🏁 Demo animation completed");
      clearInterval(demoInterval);
    }
  }, 500); 

  return demoInterval;
}

async function fetchYouTubeSubtitles(videoId) {
  try {
    console.log("📥 Fetching subtitles for video:", videoId);

    const realSubtitles = await extractYouTubeSubtitles(videoId);
    if (realSubtitles && realSubtitles.length > 0) {
      console.log("✅ Found real YouTube subtitles:", realSubtitles.length, "entries");
      return realSubtitles;
    }

    console.log("⚠️ Using demo subtitles as fallback");
    const currentTime = currentVideo ? currentVideo.currentTime : 0;
    return getDemoSubtitles().map(sub => ({
      ...sub,
      start: sub.start + currentTime,
      end: sub.end + currentTime
    }));

  } catch (error) {
    console.error("❌ Error fetching subtitles:", error);
    const currentTime = currentVideo ? currentVideo.currentTime : 0;
    return getDemoSubtitles().map(sub => ({
      ...sub,
      start: sub.start + currentTime,
      end: sub.end + currentTime
    }));
  }
}

async function extractYouTubeSubtitles(videoId) {
  try {
    const captionTracks = await findYouTubeCaptionTracks();
    if (captionTracks && captionTracks.length > 0) {
      return await parseYouTubeCaptions(captionTracks[0]);
    }
    return null;
  } catch (error) {
    console.log("📝 Could not extract real subtitles:", error.message);
    return null;
  }
}

// FIXED: Robust method to find the caption track URLs
// async function findYouTubeCaptionTracks() {
//   try {
//     // Method 1: The cleanest way - check the global YouTube player object
//     if (window.ytInitialPlayerResponse && 
//         window.ytInitialPlayerResponse.captions && 
//         window.ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer &&
//         window.ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks) {
//         console.log("🎯 Found caption tracks via ytInitialPlayerResponse");
//         return window.ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
//     }

//     // Method 2: Extract from page scripts (Fallback)
//     const scripts = document.querySelectorAll("script");
//     for (const script of scripts) {
//       const content = script.textContent;
//       if (!content.includes("captionTracks")) continue;

//       const startIndex = content.indexOf('"captionTracks":');
//       if (startIndex === -1) continue;

//       const arrayStart = content.indexOf("[", startIndex);
//       if (arrayStart === -1) continue;

//       let depth = 0;
//       let arrayEnd = -1;

//       for (let i = arrayStart; i < content.length; i++) {
//         if (content[i] === "[" || content[i] === "{") depth++;
//         else if (content[i] === "]" || content[i] === "}") {
//           depth--;
//           if (depth === 0) {
//             arrayEnd = i;
//             break;
//           }
//         }
//       }

//       if (arrayEnd === -1) continue;

//       try {
//         const jsonString = content.substring(arrayStart, arrayEnd + 1);
//         const tracks = JSON.parse(jsonString);

//         if (Array.isArray(tracks) && tracks.length > 0) {
//           console.log("🎯 Found caption tracks in script:", tracks.length);
//           return tracks;
//         }
//       } catch (parseError) {
//         continue; 
//       }
//     }
//     return null;
//   } catch (error) {
//     console.log("⚠️ Could not find caption tracks:", error.message);
//     return null;
//   }
// }

async function findYouTubeCaptionTracks() {
  try {
    console.log("🔍 Extracting caption data from page source...");
    
    // 1. Fetch the page HTML. This bypasses Chrome's "Isolated World" restriction 
    // and guarantees we get the raw YouTube data object.
    const response = await fetch(window.location.href);
    const html = await response.text();

    const searchKey = '"captionTracks":';
    if (!html.includes(searchKey)) {
      console.log("⚠️ No caption tracks found on this video.");
      return null;
    }

    const startIndex = html.indexOf(searchKey);
    const arrayStart = html.indexOf('[', startIndex);

    // 2. Safely parse the JSON array by tracking brackets and strings
    let depth = 0;
    let arrayEnd = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = arrayStart; i < html.length; i++) {
      const char = html[i];
      if (escapeNext) { escapeNext = false; continue; }
      if (char === '\\') { escapeNext = true; continue; }
      if (char === '"') { inString = !inString; continue; }

      if (!inString) {
        if (char === '[') depth++;
        else if (char === ']') {
          depth--;
          if (depth === 0) {
            arrayEnd = i;
            break;
          }
        }
      }
    }

    if (arrayEnd !== -1) {
      const jsonStr = html.substring(arrayStart, arrayEnd + 1);
      const tracks = JSON.parse(jsonStr);
      if (Array.isArray(tracks) && tracks.length > 0) {
        console.log("🎯 Successfully extracted real caption tracks!");
        return tracks;
      }
    }
    return null;
  } catch (error) {
    console.log("⚠️ Error extracting caption tracks:", error.message);
    return null;
  }
}

// FIXED: Clean the URL and handle empty responses gracefully
async function parseYouTubeCaptions(captionTrack) {
  try {
    if (!captionTrack || !captionTrack.baseUrl) return null;

    // 1. Clean the URL (Crucial for avoiding empty responses)
    let url = captionTrack.baseUrl;
    
    // Unescape characters like \u0026
    if (url.includes('\\u0026')) {
        url = url.replace(/\\u0026/g, '&');
    }

    const urlObj = new URL(url.startsWith('http') ? url : 'https://www.youtube.com' + url);
    
    // 2. Force the modern JSON format
    urlObj.searchParams.set('fmt', 'json3');
    // Remove 'kind' if it's not ASR to avoid conflicts
    if (urlObj.searchParams.get('kind') !== 'asr') {
        urlObj.searchParams.delete('kind');
    }

    console.log("📥 Fetching cleaned URL:", urlObj.toString());

    const response = await fetch(urlObj.toString());

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json = await response.json();
    
    if (!json.events) {
        console.warn("⚠️ No events found in subtitle JSON");
        return null;
    }

    // 3. Parse events into our format
    return json.events
      .filter(event => event.segs && event.tStartMs !== undefined)
      .map(event => {
        const text = event.segs.map(s => s.utf8).join('').trim().toUpperCase();
        const start = event.tStartMs / 1000;
        return {
          start: start,
          end: start + ((event.dDurationMs || 2000) / 1000),
          text: text
        };
      })
      .filter(sub => sub.text.length > 0);

  } catch (error) {
    console.error("❌ Caption Parse Error:", error);
    return null;
  }
}

function detectVideos() {
  try {
    const videos = document.querySelectorAll("video");
    videoElements = Array.from(videos);
    console.log(`🎥 Found ${videoElements.length} video elements`);

    isYouTubeVideo = isYouTube();

    videoElements.forEach((video, index) => {
      if (!video.dataset.gestureGuruListener) {
        video.dataset.gestureGuruListener = "true";

        if (video.duration > 0 || video.readyState > 0) {
          currentVideo = video;
          if (isYouTubeVideo) {
            initializeSubtitleSync();
          }
        }

        video.addEventListener("play", async () => {
          currentVideo = video;
          safeNotifyVideoPlayback(true, video);

          if (subtitleData.length === 0 && isYouTubeVideo) {
            await initializeSubtitleSync();
          }
          startTimestampMonitoring(video);
        });

        video.addEventListener("pause", () => {
          safeNotifyVideoPlayback(false, video);
          stopTimestampMonitoring();
        });

        video.addEventListener("ended", () => {
          safeNotifyVideoPlayback(false, video);
          stopTimestampMonitoring();
        });

        video.addEventListener("seeked", () => {
          handleVideoSeek(video.currentTime);
        });

        video.addEventListener("timeupdate", () => {
          handleGeneralTimestampUpdate(video.currentTime);
        });

        video.addEventListener("loadedmetadata", () => {
          currentVideo = video;
          if (isYouTubeVideo) {
            initializeSubtitleSync();
          }
          safeNotifyVideoInfo(video);
        });
      }
    });
  } catch (error) {
    console.error("❌ Error in detectVideos:", error);
  }
}

async function initializeSubtitleSync() {
  console.log("🔄 Initializing subtitle synchronization...");
  try {
    const videoId = getYouTubeVideoId();
    if (!videoId) return;

    const fetched = await fetchYouTubeSubtitles(videoId);

    if (fetched && fetched.length > 0) {
      subtitleData = fetched;
      console.log("✅ Subtitle sync ready:", subtitleData.length, "entries");
      safeNotifySubtitleData(subtitleData);
    }
  } catch (error) {
    console.error("❌ Error initializing subtitle sync:", error);
  }
}

let currentActiveSubtitle = null;
let lastVideoCurrentTime = 0;
let gestureStartTime = null;
let preciseTimestampInterval = null;

function startTimestampMonitoring(video) {
  if (timestampMonitor) clearInterval(timestampMonitor);
  if (preciseTimestampInterval) clearInterval(preciseTimestampInterval);

  preciseTimestampInterval = setInterval(() => {
    if (video && !video.paused && !video.ended) {
      handlePreciseTimestampUpdate(video.currentTime, video);
    }
  }, 50); 

  timestampMonitor = setInterval(() => {
    if (video && !video.paused) {
      handleGeneralTimestampUpdate(video.currentTime);
    }
  }, 100);
}

function stopTimestampMonitoring() {
  if (timestampMonitor) {
    clearInterval(timestampMonitor);
    timestampMonitor = null;
  }
  if (preciseTimestampInterval) {
    clearInterval(preciseTimestampInterval);
    preciseTimestampInterval = null;
  }
  currentActiveSubtitle = null;
  gestureStartTime = null;
}

function handlePreciseTimestampUpdate(currentTime, video) {
  // Add a small buffer (0.1s) to help catch subtitles
  const subtitle = findSubtitleAtTime(currentTime + 0.1);

  if (subtitle) {
    // Only send a new message if the text has actually changed
    if (!currentActiveSubtitle || currentActiveSubtitle.text !== subtitle.text) {
      currentActiveSubtitle = subtitle;
      console.log("🎬 Triggering Gesture for:", subtitle.text);
      processSubtitleAtTime(subtitle, currentTime, video);
    }
  } else {
    if (currentActiveSubtitle) {
      console.log("⏹️ Subtitle ended, stopping gesture");
      currentActiveSubtitle = null;
      safeNotifyGestureStop();
    }
  }
}

// function handlePreciseTimestampUpdate(currentTime, video) {
//   const subtitle = findSubtitleAtTime(currentTime);

//   if (subtitle) {
//     if (!currentActiveSubtitle || currentActiveSubtitle.start !== subtitle.start) {
//       currentActiveSubtitle = subtitle;
//       gestureStartTime = Date.now();
//       processSubtitleAtTime(subtitle, currentTime, video);
//     } else {
//       const elapsedRealTime = (Date.now() - gestureStartTime) / 1000;
//       const elapsedVideoTime = currentTime - subtitle.start;
//       const timeDrift = Math.abs(elapsedRealTime - elapsedVideoTime);

//       if (timeDrift > 0.2) {
//         processSubtitleAtTime(subtitle, currentTime, video);
//         gestureStartTime = Date.now() - elapsedVideoTime * 1000;
//       }
//     }
//   } else {
//     if (currentActiveSubtitle) {
//       currentActiveSubtitle = null;
//       gestureStartTime = null;
//       safeNotifyGestureStop();
//     }
//   }
// }

function handleGeneralTimestampUpdate(currentTime) {
  if (subtitleData.length === 0 || Math.abs(currentTime - lastVideoCurrentTime) < 0.05) return;
  lastVideoCurrentTime = currentTime;
}

function handleVideoSeek(newTime) {
  currentActiveSubtitle = null;
  gestureStartTime = null;
  lastProcessedTime = -1;
  lastVideoCurrentTime = newTime;

  const subtitle = findSubtitleAtTime(newTime);

  if (subtitle) {
    currentActiveSubtitle = subtitle;
    gestureStartTime = Date.now() - (newTime - subtitle.start) * 1000;
    processSubtitleAtTime(subtitle, newTime, currentVideo);
  } else {
    safeNotifyGestureStop();
  }
}

function findSubtitleAtTime(timestamp) {
  for (const subtitle of subtitleData) {
    if (timestamp >= subtitle.start && timestamp <= subtitle.end) return subtitle;
  }
  return null;
}

function processSubtitleAtTime(subtitle, currentTime, videoElement = null) {
  const remainingDuration = subtitle.end - currentTime;
  const totalDuration = subtitle.end - subtitle.start;
  const progressInSubtitle = currentTime - subtitle.start;
  const progressPercentage = (progressInSubtitle / totalDuration) * 100;

  if (remainingDuration <= 0 || remainingDuration < 0.1) return;

  const playbackRate = videoElement?.playbackRate || 1.0;
  const adjustedDuration = remainingDuration / playbackRate;

  const gestureData = {
    text: subtitle.text,
    duration: remainingDuration,
    adjustedDuration: adjustedDuration,
    totalDuration: totalDuration,
    startTime: subtitle.start,
    endTime: subtitle.end,
    currentTime: currentTime,
    progressInSubtitle: progressInSubtitle,
    progressPercentage: progressPercentage,
    playbackRate: playbackRate,
    timestamp: Date.now(),
    videoId: getYouTubeVideoId(),
    urgent: remainingDuration < 1.0, 
  };

  safeNotifyGestureText(gestureData);

  if (remainingDuration > 0.5) {
    setTimeout(() => {
      validateGestureProgress(subtitle, currentTime);
    }, remainingDuration * 500); 
  }
}

function validateGestureProgress(originalSubtitle, originalTime) {
  if (!currentVideo || currentVideo.paused) return;

  const now = currentVideo.currentTime;
  const currentSubtitle = findSubtitleAtTime(now);

  if (currentSubtitle && currentSubtitle.start === originalSubtitle.start) {
    const expectedProgress = now - originalSubtitle.start;
    const actualProgress = now - originalTime;
    const timeDrift = Math.abs(expectedProgress - actualProgress);

    if (timeDrift > 0.3) {
      processSubtitleAtTime(currentSubtitle, now, currentVideo);
    }
  }
}

function safeNotifyVideoPlayback(isPlaying, videoElement) {
  const data = {
    action: "videoPlayback",
    isPlaying: isPlaying,
    videoInfo: {
      src: videoElement.src || "",
      currentTime: videoElement.currentTime || 0,
      duration: videoElement.duration || 0,
      playbackRate: videoElement.playbackRate || 1,
      title: document.title || "",
      url: window.location.href || "",
    },
  };

  if (checkExtensionContext()) {
    try {
      chrome.runtime.sendMessage(data).catch((error) => {
        if (error.message.includes("Extension context invalidated")) {
          sendDirectMessage(data);
        }
      });
    } catch (error) {
      sendDirectMessage(data);
    }
  } else {
    sendDirectMessage(data);
  }
}

function safeNotifyVideoInfo(videoElement) {
  const data = {
    action: "videoInfo",
    info: {
      width: videoElement.videoWidth || 0,
      height: videoElement.videoHeight || 0,
      duration: videoElement.duration || 0,
      playbackRate: videoElement.playbackRate || 1,
      readyState: videoElement.readyState || 0,
    },
  };

  if (checkExtensionContext()) {
    try {
      chrome.runtime.sendMessage(data).catch((error) => {
        if (error.message.includes("Extension context invalidated")) {
          sendDirectMessage(data);
        }
      });
    } catch (error) {
      sendDirectMessage(data);
    }
  } else {
    sendDirectMessage(data);
  }
}

function safeNotifySubtitleData(subtitles) {
  const data = {
    action: "subtitleData",
    subtitles: subtitles,
    videoId: getYouTubeVideoId(),
    timestamp: Date.now(),
  };

  if (checkExtensionContext()) {
    try {
      chrome.runtime.sendMessage(data).catch((error) => {
        if (error.message.includes("Extension context invalidated")) {
          sendDirectMessage(data);
        }
      });
    } catch (error) {
      sendDirectMessage(data);
    }
  } else {
    sendDirectMessage(data);
  }
}

let backgroundPort = null;

function getBackgroundPort() {
  if (!backgroundPort) {
    try {
      backgroundPort = chrome.runtime.connect({ name: "gestureGuru" });
      backgroundPort.onDisconnect.addListener(() => {
        backgroundPort = null;
      });
    } catch (e) {
      backgroundPort = null;
    }
  }
  return backgroundPort;
}

function safeNotifyGestureText(gestureData) {
  if (!gestureData) return;

  // 1. Normalize the data (Ensures 'start' and 'end' always exist)
  const normalizedData = {
    text: (gestureData.text || "").toUpperCase(),
    start: gestureData.start || gestureData.startTime || 0,
    end: gestureData.end || gestureData.endTime || 2,
    duration: gestureData.duration || 2
  };

  const message = {
    action: "gestureText",
    data: normalizedData,
    timestamp: Date.now(),
  };

  lastGestureData = message;

  // 2. Try the Port connection first (Fastest)
  const port = getBackgroundPort ? getBackgroundPort() : null;
  if (port) {
    try {
      port.postMessage(message);
      // If we used a port, we still want to notify the window directly 
      // just in case the background script isn't forwarding.
    } catch (e) {
      backgroundPort = null; // Reset if broken
    }
  }

  // 3. The "Silent" Chrome Message (Fixes the red errors)
  if (chrome.runtime && chrome.runtime.id) {
    chrome.runtime.sendMessage(message, () => {
      // Accessing runtime.lastError here is what clears the 
      // "Receiving end does not exist" error from your console.
      if (chrome.runtime.lastError) {
        return; 
      }
    });
  }

  // 4. Direct Communication (For the Gesture Window)
  if (typeof sendDirectMessage === "function") {
    sendDirectMessage(message);
  }
}

function safeNotifyGestureStop() {
  const data = {
    action: "gestureStop",
    timestamp: Date.now(),
  };

  if (checkExtensionContext()) {
    try {
      chrome.runtime.sendMessage(data).catch((error) => {
        if (error.message.includes("Extension context invalidated")) {
          sendDirectMessage(data);
        }
      });
    } catch (error) {
      sendDirectMessage(data);
    }
  } else {
    sendDirectMessage(data);
  }
}

// Replace your existing sendDirectMessage with this:
function sendDirectMessage(data) {
  try {
    const allWindows = [window.top, window.parent];
    
    // ONLY send if the opener exists, do NOT call window.open() here
    if (window.opener && !window.opener.closed) {
      allWindows.push(window.opener);
    }

    allWindows.forEach((targetWindow) => {
      if (targetWindow && targetWindow !== window) {
        targetWindow.postMessage({
          type: "GESTURE_GURU_MESSAGE",
          source: "content_script",
          ...data,
        }, "*");
      }
    });

    // Use localStorage as the primary fallback instead of opening windows
    if (data.action === "gestureText") {
      localStorage.setItem("gestureGuru_currentText", JSON.stringify(data));
      localStorage.setItem("gestureGuru_lastUpdate", Date.now().toString());
    }
  } catch (error) {
    console.log("📨 Direct communication failed:", error.message);
  }
}

// function sendDirectMessage(data) {
//   try {
//     const allWindows = [window.top, window.parent];
//     try {
//       const gestureWin = window.open("", "gestureGuruWindow");
//       if (gestureWin && !gestureWin.closed) allWindows.push(gestureWin);
//     } catch (e) {}

//     allWindows.forEach((targetWindow) => {
//       if (targetWindow && targetWindow !== window) {
//         try {
//           targetWindow.postMessage({ type: "GESTURE_GURU_MESSAGE", source: "content_script", ...data }, "*");
//         } catch (e) {}
//       }
//     });

//     if (data.action === "gestureText") {
//       try {
//         localStorage.setItem("gestureGuru_currentText", JSON.stringify(data));
//         localStorage.setItem("gestureGuru_lastUpdate", Date.now().toString());
//       } catch (e) {}
//     }

//     if (window.opener && !window.opener.closed) {
//       try {
//         window.opener.postMessage({ type: "GESTURE_GURU_MESSAGE", source: "content_script", ...data }, "*");
//       } catch (e) {}
//     }
//   } catch (error) {}
// }

detectVideos();

const observer = new MutationObserver((mutations) => {
  let shouldRedetect = false;
  mutations.forEach((mutation) => {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === "VIDEO" || node.querySelector("video")) {
            shouldRedetect = true;
          }
        }
      });
    }
  });

  if (shouldRedetect) detectVideos();
});

function startObserving() {
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        if (document.body) observer.observe(document.body, { childList: true, subtree: true });
      });
    } else {
      setTimeout(() => {
        if (document.body) observer.observe(document.body, { childList: true, subtree: true });
      }, 100);
    }
  }
}

startObserving();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getVideoStatus") {
    const playingVideos = videoElements.filter((video) => !video.paused);
    sendResponse({
      totalVideos: videoElements.length,
      playingVideos: playingVideos.length,
      isListening: isListening,
      hasSubtitles: subtitleData.length > 0,
      currentTime: currentVideo ? currentVideo.currentTime : 0,
      isYouTube: isYouTubeVideo,
    });
  } else if (request.action === "requestSubtitleSync") {
    if (isYouTubeVideo && currentVideo) {
      initializeSubtitleSync();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, reason: "Not a YouTube video" });
    }
  } else if (request.action === "testGesture") {
    safeNotifyGestureText({ text: "HELLO WORLD", duration: 3, startTime: 0, endTime: 3, currentTime: 0 });
    sendResponse({ success: true });
  } else if (request.action === "runDemoAnimation") {
    try {
      const demoInterval = runDemoAnimation();
      sendResponse({ success: true, message: "Demo animation started", subtitleCount: getDemoSubtitles().length });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
});

try {
  chrome.runtime.sendMessage({
    action: "contentScriptReady",
    url: window.location.href,
    title: document.title,
    isYouTube: isYouTube(),
    videoId: getYouTubeVideoId(),
  }).catch(() => {});
} catch (error) {}

let lastUrl = window.location.href;
setInterval(async () => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    subtitleData = [];
    lastProcessedTime = -1;
    currentActiveSubtitle = null;

    setTimeout(async () => {
      detectVideos();
      if (isYouTube()) {
        await initializeSubtitleSync();
        if (currentVideo && !currentVideo.paused) {
          startTimestampMonitoring(currentVideo);
        }
      }
    }, 1500);
  }
}, 1000);

console.log("✅ GestureGuru Real-time Subtitle Sync fully initialized");

// // Mark that content script is loaded
// window.gestureGuruContentLoaded = true;

// let videoElements = [];
// let isListening = false;
// let recognitionInstance = null;

// // Real-time subtitle synchronization variables
// let subtitleData = [];
// let currentVideo = null;
// let timestampMonitor = null;
// let lastProcessedTime = -1;
// let isYouTubeVideo = false;

// // Extension context management
// let extensionContextValid = true;
// let gestureWindow = null;
// let lastGestureData = null;

// // Check if extension context is valid
// function checkExtensionContext() {
//   try {
//     if (chrome.runtime && chrome.runtime.id) {
//       extensionContextValid = true;
//       return true;
//     }
//   } catch (error) {
//     extensionContextValid = false;
//     console.log(
//       "⚠️ Extension context invalid, switching to direct communication"
//     );
//     return false;
//   }
//   extensionContextValid = false;
//   return false;
// }

// // Function to get gesture window reference
// function getGestureWindow() {
//   if (!gestureWindow || gestureWindow.closed) {
//     // Try to find existing gesture window
//     const windows = window.open("", "gestureWindow");
//     if (windows && !windows.closed) {
//       gestureWindow = windows;
//     }
//   }
//   return gestureWindow;
// }

// // Function to check if we're on YouTube
// function isYouTube() {
//   return (
//     window.location.hostname.includes("youtube.com") ||
//     window.location.hostname.includes("youtu.be")
//   );
// }

// // Function to extract video ID from YouTube URL
// function getYouTubeVideoId() {
//   const url = window.location.href;
//   const patterns = [/[?&]v=([^&]+)/, /youtu\.be\/([^?&]+)/, /embed\/([^?&]+)/];

//   for (const pattern of patterns) {
//     const match = url.match(pattern);
//     if (match && match[1]) {
//       return match[1];
//     }
//   }
//   return null;
// }

// // Function to get realistic demo subtitles with proper timing
// function getDemoSubtitles() {
//   console.log("🎭 Using realistic demo subtitles for testing");

//   return [
//     { start: 0, end: 2.5, text: "HELLO" },
//     { start: 2.5, end: 5.0, text: "WORLD" },
//     { start: 5.0, end: 9.0, text: "WHAZZUP" }, // 4 second duration as requested
//     { start: 9.0, end: 13.0, text: "HOW ARE YOU" },
//     { start: 13.0, end: 17.0, text: "GOOD MORNING" },
//     { start: 17.0, end: 20.0, text: "THANK YOU" },
//     { start: 20.0, end: 23.5, text: "GOODBYE" },
//     { start: 23.5, end: 27.0, text: "HAVE A NICE DAY" },
//     { start: 27.0, end: 30.5, text: "SEE YOU LATER" },
//     { start: 30.5, end: 33.0, text: "TAKE CARE" },
//     { start: 33.0, end: 36.0, text: "WELCOME" },
//     { start: 36.0, end: 38.5, text: "PLEASE" },
//     { start: 38.5, end: 41.0, text: "SORRY" },
//     { start: 41.0, end: 44.5, text: "EXCUSE ME" },
//     { start: 44.5, end: 46.0, text: "YES" },
//     { start: 46.0, end: 47.5, text: "NO" },
//     { start: 47.5, end: 50.0, text: "MAYBE" },
//     { start: 50.0, end: 52.5, text: "HELP" },
//     { start: 52.5, end: 54.0, text: "STOP" },
//     { start: 54.0, end: 56.0, text: "GO" },
//     { start: 56.0, end: 59.0, text: "COME HERE" },
//     { start: 59.0, end: 62.0, text: "LISTEN" },
//     { start: 62.0, end: 65.5, text: "UNDERSTAND" },
//     { start: 65.5, end: 68.0, text: "BEAUTIFUL" },
//     { start: 68.0, end: 71.0, text: "AMAZING" },
//     { start: 71.0, end: 74.5, text: "WONDERFUL" },
//     { start: 74.5, end: 77.0, text: "FANTASTIC" },
//     { start: 77.0, end: 80.0, text: "PERFECT" },
//   ];
// }

// // Test function to run demo animations
// function runDemoAnimation() {
//   console.log("🚀 Starting demo animation test...");

//   // Load demo subtitles
//   subtitleData = getDemoSubtitles();
//   console.log("📝 Loaded", subtitleData.length, "demo subtitle entries");

//   // Simulate video timing starting from 0
//   let currentDemoTime = 0;
//   const demoInterval = setInterval(() => {
//     // Find subtitle at current demo time
//     const subtitle = findSubtitleAtTime(currentDemoTime);

//     if (subtitle) {
//       console.log(
//         `🎭 Demo time ${currentDemoTime.toFixed(1)}s: "${subtitle.text}"`
//       );

//       // Create demo gesture data
//       const demoGestureData = {
//         text: subtitle.text,
//         duration: subtitle.end - currentDemoTime,
//         totalDuration: subtitle.end - subtitle.start,
//         startTime: subtitle.start,
//         endTime: subtitle.end,
//         currentTime: currentDemoTime,
//         progressInSubtitle: currentDemoTime - subtitle.start,
//         progressPercentage:
//           ((currentDemoTime - subtitle.start) /
//             (subtitle.end - subtitle.start)) *
//           100,
//         playbackRate: 1.0,
//         timestamp: Date.now(),
//         videoId: "demo",
//         urgent: false,
//         isDemo: true,
//       };

//       // Send gesture to animation system
//       safeNotifyGestureText(demoGestureData);
//     }

//     // Advance demo time
//     currentDemoTime += 0.5; // Advance by 500ms each step

//     // Stop demo after all subtitles
//     if (currentDemoTime > 85) {
//       console.log("🏁 Demo animation completed");
//       clearInterval(demoInterval);
//     }
//   }, 500); // Update every 500ms

//   console.log("✅ Demo animation started - will run for ~85 seconds");
//   return demoInterval;
// }

// // Enhanced function to fetch YouTube subtitles with real API integration
// async function fetchYouTubeSubtitles(videoId) {
//   try {
//     console.log("📥 Fetching subtitles for video:", videoId);

//     const realSubtitles = await extractYouTubeSubtitles(videoId);
//     if (realSubtitles && realSubtitles.length > 0) {
//       console.log("✅ Found real YouTube subtitles:", realSubtitles.length, "entries");
//       return realSubtitles;
//     }

//     console.log("⚠️ Using demo subtitles as fallback");
//     const currentTime = currentVideo ? currentVideo.currentTime : 0;
//     console.log("⏱️ Offsetting demo subtitles to current time:", currentTime);
//     return getDemoSubtitles().map(sub => ({
//       ...sub,
//       start: sub.start + currentTime,
//       end: sub.end + currentTime
//     }));

//   } catch (error) {
//     console.error("❌ Error fetching subtitles:", error);
//     const currentTime = currentVideo ? currentVideo.currentTime : 0;
//     return getDemoSubtitles().map(sub => ({
//       ...sub,
//       start: sub.start + currentTime,
//       end: sub.end + currentTime
//     }));
//   }
// }

// // Function to extract real YouTube subtitles
// async function extractYouTubeSubtitles(videoId) {
//   try {
//     // Method 1: Try to find caption tracks in the player
//     const captionTracks = await findYouTubeCaptionTracks();
//     if (captionTracks && captionTracks.length > 0) {
//       return await parseYouTubeCaptions(captionTracks[0]);
//     }

//     // Method 2: Try to extract from DOM
//     const domSubtitles = extractSubtitlesFromDOM();
//     if (domSubtitles && domSubtitles.length > 0) {
//       return domSubtitles;
//     }

//     return null;
//   } catch (error) {
//     console.log("📝 Could not extract real subtitles:", error.message);
//     return null;
//   }
// }

// // Find caption tracks from YouTube player
// async function findYouTubeCaptionTracks() {
//   try {
//     // Method 1: Try YouTube player API directly
//     const ytPlayer =
//       document.querySelector("#movie_player") ||
//       document.querySelector(".html5-video-player");

//     if (ytPlayer && typeof ytPlayer.getSubtitlesUserSettings === "function") {
//       const tracks = ytPlayer.getSubtitlesUserSettings();
//       if (tracks && tracks.length > 0) {
//         console.log("🎯 Found caption tracks via player API:", tracks.length);
//         return tracks;
//       }
//     }

//     // Method 2: Extract from page scripts using bracket counting
//     // This correctly handles nested JSON unlike a simple regex
//     const scripts = document.querySelectorAll("script");
//     for (const script of scripts) {
//       const content = script.textContent;
//       if (!content.includes("captionTracks")) continue;

//       const startIndex = content.indexOf('"captionTracks":');
//       if (startIndex === -1) continue;

//       // Find the opening bracket of the array
//       const arrayStart = content.indexOf("[", startIndex);
//       if (arrayStart === -1) continue;

//       // Walk forward counting brackets to find the real closing bracket
//       let depth = 0;
//       let arrayEnd = -1;

//       for (let i = arrayStart; i < content.length; i++) {
//         if (content[i] === "[" || content[i] === "{") depth++;
//         else if (content[i] === "]" || content[i] === "}") {
//           depth--;
//           // When depth returns to 0, we've found the end of the array
//           if (depth === 0) {
//             arrayEnd = i;
//             break;
//           }
//         }
//       }

//       if (arrayEnd === -1) continue;

//       try {
//         const jsonString = content.substring(arrayStart, arrayEnd + 1);
//         const tracks = JSON.parse(jsonString);

//         if (Array.isArray(tracks) && tracks.length > 0) {
//           console.log("🎯 Found caption tracks in script:", tracks.length);
//           return tracks;
//         }
//       } catch (parseError) {
//         console.log("⚠️ Failed to parse caption tracks JSON:", parseError.message);
//         continue; // Try next script tag
//       }
//     }

//     return null;
//   } catch (error) {
//     console.log("⚠️ Could not find caption tracks:", error.message);
//     return null;
//   }
// }

// // Parse YouTube caption data
// async function parseYouTubeCaptions(captionTrack) {
//   try {
//     if (!captionTrack.baseUrl) return null;

//     // Ensure URL is absolute
//     const url = captionTrack.baseUrl.startsWith("http")
//       ? captionTrack.baseUrl
//       : "https://www.youtube.com" + captionTrack.baseUrl;

//     const response = await fetch(url + "&fmt=json3", {
//       credentials: "omit",
//       headers: { "Accept": "application/json" }
//     });

//     if (!response.ok) {
//       console.log("⚠️ Caption fetch failed:", response.status);
//       return null;
//     }

//     // Debug - remove after confirming it works
//     const rawText = await response.text();
//     console.log("📄 Caption response preview:", rawText.substring(0, 500));

//     const json = JSON.parse(rawText);
//     const events = json.events || [];

//     const subtitles = [];
//     for (const event of events) {
//       if (!event.segs || !event.tStartMs) continue;

//       const start = event.tStartMs / 1000;
//       const duration = (event.dDurationMs || 2000) / 1000;
//       const text = event.segs
//         .map(s => s.utf8 || "")
//         .join("")
//         .trim()
//         .toUpperCase();

//       if (text && text !== "\n") {
//         subtitles.push({
//           start: start,
//           end: start + duration,
//           text: text
//         });
//       }
//     }

//     console.log("✅ Parsed", subtitles.length, "real subtitles");
//     return subtitles;

//   } catch (error) {
//     console.log("⚠️ Could not parse captions:", error.message);
//     return null;
//   }
// }

// // Extract subtitles from DOM (current displayed captions)
// function extractSubtitlesFromDOM() {
//   try {
//     const captionContainers = [
//       ".caption-window",
//       ".ytp-caption-segment",
//       ".captions-text",
//       '[class*="caption"]',
//       '[class*="subtitle"]',
//     ];

//     for (const selector of captionContainers) {
//       const elements = document.querySelectorAll(selector);
//       if (elements.length > 0) {
//         console.log("🎯 Found caption elements:", elements.length);
//         // This would need more sophisticated timing extraction
//         // For now, return null to use demo data
//         return null;
//       }
//     }

//     return null;
//   } catch (error) {
//     console.log("⚠️ Could not extract DOM subtitles:", error.message);
//     return null;
//   }
// }

// // Function to detect video elements
// function detectVideos() {
//   try {
//     const videos = document.querySelectorAll("video");
//     videoElements = Array.from(videos);
//     console.log(`🎥 Found ${videoElements.length} video elements`);

//     // Check if this is YouTube
//     isYouTubeVideo = isYouTube();
//     console.log("🌐 Is YouTube:", isYouTubeVideo);

//     // Add event listeners to videos
//     videoElements.forEach((video, index) => {
//       if (!video.dataset.gestureGuruListener) {
//         video.dataset.gestureGuruListener = "true";

//         // Set as current video if it's the main one
//         if (video.duration > 0 || video.readyState > 0) {
//           currentVideo = video;
//           console.log("🎯 Set current video:", index);

//           // Initialize subtitle system for this video
//           if (isYouTubeVideo) {
//             initializeSubtitleSync();
//           }
//         }

//         video.addEventListener("play", async () => {
//           currentVideo = video
//           safeNotifyVideoPlayback(true, video);

//           if (subtitleData.length === 0 && isYouTubeVideo) {
//             console.log("⏳ Waiting for subtitles before starting monitor...");
//             await initializeSubtitleSync();
//           }

//           startTimestampMonitoring(video);
//         })

//         video.addEventListener("pause", () => {
//           console.log(`⏸️ Video ${index} paused`);
//           safeNotifyVideoPlayback(false, video);
//           stopTimestampMonitoring();
//         });

//         video.addEventListener("ended", () => {
//           console.log(`⏹️ Video ${index} ended`);
//           safeNotifyVideoPlayback(false, video);
//           stopTimestampMonitoring();
//         });

//         video.addEventListener("seeked", () => {
//           console.log(`⏭️ Video ${index} seeked to ${video.currentTime}s`);
//           handleVideoSeek(video.currentTime);
//         });

//         video.addEventListener("timeupdate", () => {
//           // Handle real-time timestamp updates
//           handleGeneralTimestampUpdate(video.currentTime);
//         });

//         video.addEventListener("loadedmetadata", () => {
//           console.log(`📊 Video ${index} metadata loaded`);
//           currentVideo = video;
//           if (isYouTubeVideo) {
//             initializeSubtitleSync();
//           }
//           safeNotifyVideoInfo(video);
//         });
//       }
//     });
//   } catch (error) {
//     console.error("❌ Error in detectVideos:", error);
//   }
// }

// // Initialize subtitle synchronization system
// async function initializeSubtitleSync() {
//   console.log("🔄 Initializing subtitle synchronization...");
//   try {
//     const videoId = getYouTubeVideoId();
//     if (!videoId) return;

//     console.log("🎬 Video ID:", videoId);
//     const fetched = await fetchYouTubeSubtitles(videoId);

//     if (fetched && fetched.length > 0) {
//       subtitleData = fetched;
//       console.log("✅ Subtitle sync ready:", subtitleData.length, "entries");
//       safeNotifySubtitleData(subtitleData);
//     }
//   } catch (error) {
//     console.error("❌ Error initializing subtitle sync:", error);
//   }
// }

// // Enhanced real-time timestamp monitoring and gesture synchronization
// let currentActiveSubtitle = null;
// let lastVideoCurrentTime = 0;
// let gestureStartTime = null;
// let preciseTimestampInterval = null;

// // Start enhanced timestamp monitoring for real-time sync
// function startTimestampMonitoring(video) {
//   if (timestampMonitor) {
//     clearInterval(timestampMonitor);
//   }
//   if (preciseTimestampInterval) {
//     clearInterval(preciseTimestampInterval);
//   }

//   console.log("⏱️ Starting enhanced timestamp monitoring...");

//   // Primary monitor - every 50ms for ultra-precise synchronization
//   preciseTimestampInterval = setInterval(() => {
//     if (video && !video.paused && !video.ended) {
//       const currentTime = video.currentTime;
//       handlePreciseTimestampUpdate(currentTime, video);
//     }
//   }, 50); // 20 FPS monitoring for precise sync

//   // Secondary monitor - every 100ms for general updates
//   timestampMonitor = setInterval(() => {
//     if (video && !video.paused) {
//       const currentTime = video.currentTime;
//       handleGeneralTimestampUpdate(currentTime);
//     }
//   }, 100);
// }

// // Stop timestamp monitoring
// function stopTimestampMonitoring() {
//   if (timestampMonitor) {
//     clearInterval(timestampMonitor);
//     timestampMonitor = null;
//   }
//   if (preciseTimestampInterval) {
//     clearInterval(preciseTimestampInterval);
//     preciseTimestampInterval = null;
//   }
//   console.log("⏹️ Enhanced timestamp monitoring stopped");

//   // Clear current gesture
//   currentActiveSubtitle = null;
//   gestureStartTime = null;
// }

// // Handle precise timestamp updates for gesture synchronization
// function handlePreciseTimestampUpdate(currentTime, video) {
//   // Find subtitle for current timestamp
//   const subtitle = findSubtitleAtTime(currentTime);

//   if (subtitle) {
//     // Check if this is a new subtitle or continuation
//     if (
//       !currentActiveSubtitle ||
//       currentActiveSubtitle.start !== subtitle.start
//     ) {
//       // New subtitle detected
//       console.log(
//         `🎯 NEW SUBTITLE: "${subtitle.text}" at ${currentTime.toFixed(2)}s (${
//           subtitle.start
//         }-${subtitle.end})`
//       );

//       currentActiveSubtitle = subtitle;
//       gestureStartTime = Date.now();

//       // Calculate exact remaining duration
//       const remainingDuration = subtitle.end - currentTime;
//       const totalDuration = subtitle.end - subtitle.start;

//       console.log(
//         `⏰ Gesture timing: ${remainingDuration.toFixed(
//           2
//         )}s remaining of ${totalDuration.toFixed(2)}s total`
//       );

//       // Trigger immediate gesture
//       processSubtitleAtTime(subtitle, currentTime, video);
//     } else {
//       // Continue current subtitle - check for timing drift
//       const elapsedRealTime = (Date.now() - gestureStartTime) / 1000;
//       const elapsedVideoTime = currentTime - subtitle.start;
//       const timeDrift = Math.abs(elapsedRealTime - elapsedVideoTime);

//       if (timeDrift > 0.2) {
//         // More than 200ms drift
//         console.log(`🔄 Correcting timing drift: ${timeDrift.toFixed(2)}s`);
//         processSubtitleAtTime(subtitle, currentTime, video);
//         gestureStartTime = Date.now() - elapsedVideoTime * 1000;
//       }
//     }
//   } else {
//     // No subtitle at current time
//     if (currentActiveSubtitle) {
//       console.log(
//         `🛑 Subtitle ended: "${
//           currentActiveSubtitle.text
//         }" at ${currentTime.toFixed(2)}s`
//       );
//       currentActiveSubtitle = null;
//       gestureStartTime = null;

//       // Send stop gesture command
//       safeNotifyGestureStop();
//     }
//   }
// }

// // Handle general timestamp updates for monitoring
// function handleGeneralTimestampUpdate(currentTime) {
//   // Only process if we have subtitles and time has changed significantly
//   if (
//     subtitleData.length === 0 ||
//     Math.abs(currentTime - lastVideoCurrentTime) < 0.05
//   ) {
//     return;
//   }

//   lastVideoCurrentTime = currentTime;

//   // Update video progress info
//   const progress = (currentTime / (currentVideo?.duration || 1)) * 100;
//   console.log(
//     `📹 Video progress: ${currentTime.toFixed(1)}s (${progress.toFixed(1)}%)`
//   );
// }

// // Handle video seeking (forward/backward) with immediate synchronization
// function handleVideoSeek(newTime) {
//   console.log(
//     `🔄 Video seeked to ${newTime.toFixed(
//       2
//     )}s - immediate gesture adjustment...`
//   );

//   // Reset all timing tracking
//   currentActiveSubtitle = null;
//   gestureStartTime = null;
//   lastProcessedTime = -1;
//   lastVideoCurrentTime = newTime;

//   // Find subtitle at new position immediately
//   const subtitle = findSubtitleAtTime(newTime);

//   if (subtitle) {
//     console.log(
//       `⚡ IMMEDIATE: Found subtitle "${subtitle.text}" at seek position`
//     );

//     // Set as current active subtitle
//     currentActiveSubtitle = subtitle;
//     gestureStartTime = Date.now() - (newTime - subtitle.start) * 1000;

//     // Calculate remaining duration from seek position
//     const remainingDuration = subtitle.end - newTime;
//     const progressInSubtitle = newTime - subtitle.start;

//     console.log(
//       `⚡ Seek position: ${progressInSubtitle.toFixed(
//         2
//       )}s into subtitle, ${remainingDuration.toFixed(2)}s remaining`
//     );

//     // Trigger immediate gesture for remaining duration
//     processSubtitleAtTime(subtitle, newTime, currentVideo);
//   } else {
//     // No subtitle at seek position
//     console.log("🛑 No subtitle at seek position - stopping gestures");
//     safeNotifyGestureStop();
//   }
// }

// // Find subtitle entry for specific timestamp
// function findSubtitleAtTime(timestamp) {
//   for (const subtitle of subtitleData) {
//     if (timestamp >= subtitle.start && timestamp <= subtitle.end) {
//       return subtitle;
//     }
//   }
//   return null;
// }

// // Enhanced subtitle processing with precise timing and gesture synchronization
// function processSubtitleAtTime(subtitle, currentTime, videoElement = null) {
//   const remainingDuration = subtitle.end - currentTime;
//   const totalDuration = subtitle.end - subtitle.start;
//   const progressInSubtitle = currentTime - subtitle.start;
//   const progressPercentage = (progressInSubtitle / totalDuration) * 100;

//   console.log(`🎭 PRECISE GESTURE: "${subtitle.text}"`);
//   console.log(
//     `   ⏰ Total: ${totalDuration.toFixed(
//       2
//     )}s | Remaining: ${remainingDuration.toFixed(
//       2
//     )}s | Progress: ${progressPercentage.toFixed(1)}%`
//   );
//   console.log(
//     `   🎯 Timeline: ${subtitle.start.toFixed(2)}s → ${currentTime.toFixed(
//       2
//     )}s → ${subtitle.end.toFixed(2)}s`
//   );

//   // Validate timing
//   if (remainingDuration <= 0) {
//     console.log("⚠️ Subtitle has already ended, skipping gesture");
//     return;
//   }

//   if (remainingDuration < 0.1) {
//     console.log("⚠️ Less than 100ms remaining, skipping gesture");
//     return;
//   }

//   // Get video playback rate for timing adjustment
//   const playbackRate = videoElement?.playbackRate || 1.0;
//   const adjustedDuration = remainingDuration / playbackRate;

//   console.log(
//     `🎬 Video playback rate: ${playbackRate}x | Adjusted duration: ${adjustedDuration.toFixed(
//       2
//     )}s`
//   );

//   // Create comprehensive gesture data
//   const gestureData = {
//     text: subtitle.text,
//     duration: remainingDuration,
//     adjustedDuration: adjustedDuration,
//     totalDuration: totalDuration,
//     startTime: subtitle.start,
//     endTime: subtitle.end,
//     currentTime: currentTime,
//     progressInSubtitle: progressInSubtitle,
//     progressPercentage: progressPercentage,
//     playbackRate: playbackRate,
//     timestamp: Date.now(),
//     videoId: getYouTubeVideoId(),
//     urgent: remainingDuration < 1.0, // Flag for short duration gestures
//   };

//   // Send to gesture window with comprehensive timing data
//   console.log(`📤 Sending gesture data:`, gestureData);
//   safeNotifyGestureText(gestureData);

//   // Set up timing validation
//   if (remainingDuration > 0.5) {
//     setTimeout(() => {
//       validateGestureProgress(subtitle, currentTime);
//     }, remainingDuration * 500); // Check halfway through
//   }
// }

// // Validate gesture progress and sync
// function validateGestureProgress(originalSubtitle, originalTime) {
//   if (!currentVideo || currentVideo.paused) return;

//   const now = currentVideo.currentTime;
//   const currentSubtitle = findSubtitleAtTime(now);

//   if (!currentSubtitle || currentSubtitle.start !== originalSubtitle.start) {
//     console.log(`🔄 Gesture validation: Subtitle changed during playback`);
//     // Subtitle has changed, this is normal
//   } else {
//     const expectedProgress = now - originalSubtitle.start;
//     const actualProgress = now - originalTime;
//     const timeDrift = Math.abs(expectedProgress - actualProgress);

//     if (timeDrift > 0.3) {
//       console.log(`⚠️ Gesture timing drift detected: ${timeDrift.toFixed(2)}s`);
//       // Re-sync if significant drift
//       processSubtitleAtTime(currentSubtitle, now, currentVideo);
//     }
//   }
// }

// // Enhanced safe notification functions with context invalidation handling
// function safeNotifyVideoPlayback(isPlaying, videoElement) {
//   const data = {
//     action: "videoPlayback",
//     isPlaying: isPlaying,
//     videoInfo: {
//       src: videoElement.src || "",
//       currentTime: videoElement.currentTime || 0,
//       duration: videoElement.duration || 0,
//       playbackRate: videoElement.playbackRate || 1,
//       title: document.title || "",
//       url: window.location.href || "",
//     },
//   };

//   if (checkExtensionContext()) {
//     try {
//       chrome.runtime.sendMessage(data).catch((error) => {
//         if (error.message.includes("Extension context invalidated")) {
//           console.log(
//             "⚠️ Extension context invalidated, using fallback communication"
//           );
//           sendDirectMessage(data);
//         } else {
//           console.log("📨 Video playback message failed:", error.message);
//         }
//       });
//     } catch (error) {
//       console.log("📨 Chrome runtime not available, using fallback");
//       sendDirectMessage(data);
//     }
//   } else {
//     sendDirectMessage(data);
//   }
// }

// function safeNotifyVideoInfo(videoElement) {
//   const data = {
//     action: "videoInfo",
//     info: {
//       width: videoElement.videoWidth || 0,
//       height: videoElement.videoHeight || 0,
//       duration: videoElement.duration || 0,
//       playbackRate: videoElement.playbackRate || 1,
//       readyState: videoElement.readyState || 0,
//     },
//   };

//   if (checkExtensionContext()) {
//     try {
//       chrome.runtime.sendMessage(data).catch((error) => {
//         if (error.message.includes("Extension context invalidated")) {
//           console.log("⚠️ Extension context invalidated for video info");
//           sendDirectMessage(data);
//         } else {
//           console.log("📨 Video info message failed:", error.message);
//         }
//       });
//     } catch (error) {
//       sendDirectMessage(data);
//     }
//   } else {
//     sendDirectMessage(data);
//   }
// }

// function safeNotifySubtitleData(subtitles) {
//   const data = {
//     action: "subtitleData",
//     subtitles: subtitles,
//     videoId: getYouTubeVideoId(),
//     timestamp: Date.now(),
//   };

//   if (checkExtensionContext()) {
//     try {
//       chrome.runtime.sendMessage(data).catch((error) => {
//         if (error.message.includes("Extension context invalidated")) {
//           console.log("⚠️ Extension context invalidated for subtitle data");
//           sendDirectMessage(data);
//         } else {
//           console.log("📨 Subtitle data message failed:", error.message);
//         }
//       });
//     } catch (error) {
//       sendDirectMessage(data);
//     }
//   } else {
//     sendDirectMessage(data);
//   }
// }

// // Create persistent connection to background
// let backgroundPort = null;

// function getBackgroundPort() {
//   if (!backgroundPort) {
//     try {
//       backgroundPort = chrome.runtime.connect({ name: "gestureGuru" });
//       backgroundPort.onDisconnect.addListener(() => {
//         backgroundPort = null;
//       });
//     } catch (e) {
//       backgroundPort = null;
//     }
//   }
//   return backgroundPort;
// }

// function safeNotifyGestureText(gestureData) {
//   const data = {
//     action: "gestureText",
//     data: gestureData,
//     timestamp: Date.now(),
//   };

//   lastGestureData = data;

//   const port = getBackgroundPort();
//   if (port) {
//     try {
//       port.postMessage(data);
//       return;
//     } catch (e) {
//       backgroundPort = null;
//     }
//   }

//   sendDirectMessage(data);
// }

// function safeNotifyGestureStop() {
//   const data = {
//     action: "gestureStop",
//     timestamp: Date.now(),
//   };

//   if (checkExtensionContext()) {
//     try {
//       chrome.runtime.sendMessage(data).catch((error) => {
//         if (error.message.includes("Extension context invalidated")) {
//           console.log("⚠️ Extension context invalidated for gesture stop");
//           sendDirectMessage(data);
//         } else {
//           console.log("📨 Gesture stop message failed:", error.message);
//         }
//       });
//     } catch (error) {
//       sendDirectMessage(data);
//     }
//   } else {
//     sendDirectMessage(data);
//   }
// }

// // Direct communication fallback when extension context is invalid
// function sendDirectMessage(data) {
//   try {
//     // Try to communicate directly with gesture window via postMessage
//     const allWindows = [window.top, window.parent];

//     // Also try to find gesture window by name
//     try {
//       const gestureWin = window.open("", "gestureGuruWindow");
//       if (gestureWin && !gestureWin.closed) {
//         allWindows.push(gestureWin);
//       }
//     } catch (e) {
//       // Ignore popup blocker errors
//     }

//     // Send message to all possible windows
//     allWindows.forEach((targetWindow) => {
//       if (targetWindow && targetWindow !== window) {
//         try {
//           targetWindow.postMessage(
//             {
//               type: "GESTURE_GURU_MESSAGE",
//               source: "content_script",
//               ...data,
//             },
//             "*"
//           );
//           console.log("📤 Sent direct message:", data.action);
//         } catch (e) {
//           // Ignore cross-origin errors
//         }
//       }
//     });

//     // Also try localStorage for persistent communication
//     if (data.action === "gestureText") {
//       try {
//         localStorage.setItem("gestureGuru_currentText", JSON.stringify(data));
//         localStorage.setItem("gestureGuru_lastUpdate", Date.now().toString());
//         console.log("💾 Stored gesture data in localStorage");
//       } catch (e) {
//         // Ignore storage errors
//       }
//     }

//     // Try to use window.opener if available
//     if (window.opener && !window.opener.closed) {
//       try {
//         window.opener.postMessage(
//           {
//             type: "GESTURE_GURU_MESSAGE",
//             source: "content_script",
//             ...data,
//           },
//           "*"
//         );
//       } catch (e) {
//         // Ignore cross-origin errors
//       }
//     }
//   } catch (error) {
//     console.log("📨 Direct communication failed:", error.message);
//   }
// }

// // Initialize detection and start monitoring
// detectVideos();

// // Watch for dynamically added videos
// const observer = new MutationObserver((mutations) => {
//   let shouldRedetect = false;

//   mutations.forEach((mutation) => {
//     if (mutation.type === "childList") {
//       mutation.addedNodes.forEach((node) => {
//         if (node.nodeType === Node.ELEMENT_NODE) {
//           if (node.tagName === "VIDEO" || node.querySelector("video")) {
//             shouldRedetect = true;
//           }
//         }
//       });
//     }
//   });

//   if (shouldRedetect) {
//     detectVideos();
//   }
// });

// // Start observing
// function startObserving() {
//   if (document.body) {
//     observer.observe(document.body, {
//       childList: true,
//       subtree: true,
//     });
//   } else {
//     if (document.readyState === "loading") {
//       document.addEventListener("DOMContentLoaded", () => {
//         if (document.body) {
//           observer.observe(document.body, {
//             childList: true,
//             subtree: true,
//           });
//         }
//       });
//     } else {
//       setTimeout(() => {
//         if (document.body) {
//           observer.observe(document.body, {
//             childList: true,
//             subtree: true,
//           });
//         }
//       }, 100);
//     }
//   }
// }

// startObserving();

// // Listen for messages from background script
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "getVideoStatus") {
//     const playingVideos = videoElements.filter((video) => !video.paused);
//     sendResponse({
//       totalVideos: videoElements.length,
//       playingVideos: playingVideos.length,
//       isListening: isListening,
//       hasSubtitles: subtitleData.length > 0,
//       currentTime: currentVideo ? currentVideo.currentTime : 0,
//       isYouTube: isYouTubeVideo,
//     });
//   } else if (request.action === "requestSubtitleSync") {
//     if (isYouTubeVideo && currentVideo) {
//       initializeSubtitleSync();
//       sendResponse({ success: true });
//     } else {
//       sendResponse({ success: false, reason: "Not a YouTube video" });
//     }
//   } else if (request.action === "testGesture") {
//     // Test gesture with demo text
//     const testData = {
//       text: "HELLO WORLD",
//       duration: 3,
//       startTime: 0,
//       endTime: 3,
//       currentTime: 0,
//     };
//     safeNotifyGestureText(testData);
//     sendResponse({ success: true });
//   } else if (request.action === "runDemoAnimation") {
//     // Run full demo animation sequence
//     try {
//       const demoInterval = runDemoAnimation();
//       sendResponse({
//         success: true,
//         message: "Demo animation started",
//         subtitleCount: getDemoSubtitles().length,
//       });
//     } catch (error) {
//       console.error("❌ Error running demo animation:", error);
//       sendResponse({
//         success: false,
//         error: error.message,
//       });
//     }
//   }
// });

// // Send initial status
// try {
//   chrome.runtime
//     .sendMessage({
//       action: "contentScriptReady",
//       url: window.location.href,
//       title: document.title,
//       isYouTube: isYouTube(),
//       videoId: getYouTubeVideoId(),
//     })
//     .catch((error) => {
//       console.log("📨 Initial status message failed:", error.message);
//     });
// } catch (error) {
//   console.error("❌ Error sending initial status:", error);
// }

// // URL change detection for YouTube navigation
// let lastUrl = window.location.href;
// setInterval(async () => {
//   const currentUrl = window.location.href;
//   if (currentUrl !== lastUrl) {
//     console.log("🔄 URL changed, reinitializing...");
//     lastUrl = currentUrl;

//     subtitleData = [];
//     lastProcessedTime = -1;
//     currentActiveSubtitle = null;

//     setTimeout(async () => {
//       detectVideos();
//       if (isYouTube()) {
//         await initializeSubtitleSync();
//         // Restart monitoring if video is already playing
//         if (currentVideo && !currentVideo.paused) {
//           console.log("▶️ Video already playing after URL change, restarting monitor");
//           startTimestampMonitoring(currentVideo);
//         }
//       }
//     }, 1500);
//   }
// }, 1000);

// console.log("✅ GestureGuru Real-time Subtitle Sync fully initialized");
