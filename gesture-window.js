// Every time this window opens or refreshes, it registers itself
chrome.runtime.sendMessage({ 
    action: "registerGestureWindow", 
    tabId: "current" // Background script will interpret this
});

console.log("👂 Listening for gestures...");

// Place this at the VERY top of gesture-window.js
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     console.log("📥 Message received:", request.action);

//     // 1. Immediate acknowledgment to prevent the "Channel Closed" error
//     sendResponse({ status: "received" }); 

//     // 2. Handle the logic AFTER responding
//     if (request.action === "gestureText") {
//         if (typeof handleIncomingGesture === "function") {
//             handleIncomingGesture(request.data);
//         } else {
//             console.warn("⚠️ handleIncomingGesture not defined yet");
//         }
//     }
    
//     // IMPORTANT: Do NOT return true here anymore. 
//     return false; 
// });

// Add this inside your ref object or as a global function
function findBone(name) {
    if (!ref.avatar) return null;
    
    // Try exact match
    let bone = ref.avatar.getObjectByName(name);
    
    // Try with mixamorig prefix
    if (!bone) bone = ref.avatar.getObjectByName("mixamorig_" + name);
    if (!bone) bone = ref.avatar.getObjectByName("mixamorig" + name); // some versions skip the underscore
    
    return bone;
}

// Gesture Window Script - Complete fixed version
console.log("GestureGuru gesture window loaded");

// Global variables
let scene, camera, renderer, currentModel;
let animations = [];
let currentText = "";
let isAnimating = false;
let pending = false;
let flag = false;
let speed = 0.1; 
let pause = 100; 
let settings = {
  autoMode: true,
  speedSync: true,
};

/**
 * Bridges the message from the extension to the 3D animation engine
 * @param {Object} gestureData - Contains the text and timing info
 */
function handleIncomingGesture(gestureData) {
    if (!gestureData || !gestureData.text) return;

    console.log("🕺 Avatar received gesture command:", gestureData.text);

    // 1. Update the UI overlay if you have one
    if (typeof showOverlay === "function") {
        showOverlay(`Gesture: ${gestureData.text}`);
    }

    // 2. Trigger the animation logic
    // We convert to uppercase because your animations are named 'A', 'B', 'HOME', etc.
    const textToAnimate = gestureData.text.toUpperCase();
    
    if (typeof processTextAnimation === "function") {
        processTextAnimation(textToAnimate);
    } else {
        console.error("❌ processTextAnimation function not found!");
    }

    // 3. Ensure the animation loop is running
    if (ref && !ref.pending) {
        ref.pending = true;
        ref.animate();
    }
}

// Animation reference object
let ref = {
  avatar: null,
  animations: [],
  pending: false,
  flag: false,
  scene: null,
  camera: null,
  renderer: null,

  // Robust bone finder in case the .glb exports bones with namespaces
  getBoneRobust: function(name) {
    if (!this.avatar) return null;
    let found = this.avatar.getObjectByName(name);
    if (found) return found;

    // Normalize the target name (remove special characters)
    const cleanTarget = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    this.avatar.traverse(child => {
        if (child.isBone && !found) {
            const cleanChild = child.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            // Match against stripped name to catch mixamorig:RightArm vs mixamorigRightArm
            if (cleanChild === cleanTarget || cleanChild.includes(cleanTarget) || cleanTarget.includes(cleanChild)) {
                found = child;
            }
        }
    });
    return found;
  },

  animate: function () {
    if (this.animations.length === 0) {
      this.pending = false;
      return;
    }
    requestAnimationFrame(this.animate.bind(this));

    if (this.animations[0].length) {
      if (!this.flag) {
        if (this.animations[0][0] === "add-text") {
          // Handle text addition shift
          this.animations.shift();
        } else {
          // Process bone animations dynamically and safely
          for (let i = 0; i < this.animations[0].length; ) {
            let [boneName, action, axis, limit, sign] = this.animations[0][i];

            const bone = this.getBoneRobust(boneName);
            if (!bone) {
              console.warn(`⚠️ Bone ${boneName} not found, skipping.`);
              this.animations[0].splice(i, 1);
              continue;
            }

            // Enhanced logic: Calculate shortest path to the target limit
            const currentVal = bone[action][axis];
            const targetVal = Number(limit);
            const diff = targetVal - currentVal;

            // If we are not at the limit yet (0.02 is a tiny ~1 degree tolerance buffer)
            if (Math.abs(diff) > 0.02) {
              const step = Math.min(speed, Math.abs(diff));
              bone[action][axis] += Math.sign(diff) * step;
              i++; // Move to next bone instruction
            } else {
              // Snap exactly to limit and remove command from array
              bone[action][axis] = targetVal;
              this.animations[0].splice(i, 1);
            }
          }
        }
      }
    } else {
      // Empty array signifies a pause between letters/words
      this.flag = true;
      setTimeout(() => {
        this.flag = false;
      }, pause);
      this.animations.shift();
    }
  },
};

// DOM elements
const canvas = document.getElementById("canvas");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const overlay = document.getElementById("overlay");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const testBtn = document.getElementById("testBtn");

// Initialize gesture window
window.initGestureWindow = function () {
  console.log("🚀 Initializing gesture window...");
  setupThreeJS();
  loadAvatar();
  setupMessageListener();
  makeWindowDraggable();
  setupTestButton();
};

// Setup Three.JS scene
function setupThreeJS() {
  try {
    console.log("🔧 Setting up Three.JS...");

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Added an ambient light to ensure the model isn't completely dark in shadows
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 2);
    spotLight.position.set(0, 5, 5);
    scene.add(spotLight);

    const canvasContainer = canvas.parentElement;
    const width = canvasContainer.offsetWidth || 400;
    const height = canvasContainer.offsetHeight || 300;

    camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
    camera.position.z = 1.6;
    camera.position.y = 1.4;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);

    canvas.innerHTML = "";
    canvas.appendChild(renderer.domElement);

    window.addEventListener("resize", onWindowResize);

    console.log("✅ Three.JS setup complete - Canvas size:", width + "x" + height);

    animate();
  } catch (err) {
    console.error("❌ Error setting up Three.JS:", err);
    showError("Failed to initialize 3D engine: " + err.message);
  }
}

function waitForDependencies() {
  return new Promise((resolve) => {
    const checkDependencies = () => {
      if (typeof THREE !== "undefined" && typeof THREE.GLTFLoader !== "undefined") {
        resolve();
      } else {
        setTimeout(checkDependencies, 100);
      }
    };
    checkDependencies();
  });
}

// Load 3D avatar
async function loadAvatar() {
  try {
    updateStatus("Loading avatar...", false);
    console.log("📥 Loading 3D avatar...");

    await waitForDependencies();

    if (typeof THREE === "undefined") throw new Error("THREE.js library not loaded");
    if (typeof THREE.GLTFLoader === "undefined") throw new Error("GLTFLoader not available");

    const loader = new THREE.GLTFLoader();
    console.log("🔧 GLTFLoader created successfully");

    const gltf = await new Promise((resolve, reject) => {
      loader.load(
        "./ybot.glb",
        resolve,
        (progress) => {
          if (progress.total > 0) {
            console.log("📊 Loading progress:", Math.round((progress.loaded / progress.total) * 100) + "%");
          }
        },
        (error) => {
          console.error("❌ Error loading model:", error);
          reject(error);
        }
      );
    });

    console.log("✅ Model loaded successfully");

    gltf.scene.traverse((child) => {
      if (child.type === "SkinnedMesh") {
        child.frustumCulled = false;
      }
    });

    currentModel = gltf.scene;
    ref.avatar = currentModel;
    ref.scene = scene;
    ref.camera = camera;
    ref.renderer = renderer;

    scene.add(currentModel);

    setTimeout(() => {
      applyDefaultPose();
      console.log("✅ Avatar added to scene successfully");
      hideLoading();
      updateStatus("Ready", true);
      
      // Notify background script we are ready
      chrome.runtime.sendMessage({ action: "avatarStatus", status: "ready" });
    }, 150); 
  } catch (error) {
    console.error("❌ Failed to load avatar:", error);
    showError("Failed to load avatar: " + error.message);
    updateStatus("Error loading model", false);
  }
}

// Apply default pose
function applyDefaultPose() {
  if (!ref.avatar) return;

  try {
    console.log("🎭 Applying default pose using real animations...");

    ref.animations = [];
    ref.pending = false;
    ref.flag = false;

    if (window.defaultPose && typeof window.defaultPose === "function") {
      window.defaultPose(ref);
      console.log("✅ Real default pose applied");
    } else {
      console.warn("⚠️ Real default pose not available, using fallback");
      let animations = [];
      animations.push(["mixamorigNeck", "rotation", "x", Math.PI / 12, "+"]);
      animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI / 3, "-"]);
      animations.push(["mixamorigLeftForeArm", "rotation", "y", -Math.PI / 1.5, "-"]);
      animations.push(["mixamorigRightArm", "rotation", "z", Math.PI / 3, "+"]);
      animations.push(["mixamorigRightForeArm", "rotation", "y", Math.PI / 1.5, "+"]);

      ref.animations.push(animations);

      if (ref.pending === false) {
        ref.pending = true;
        ref.animate();
      }
    }
  } catch (error) {
    console.error("❌ Error applying default pose:", error);
  }
}

// Enhanced real-time gesture animation
function animateRealTimeText(text, duration, gestureData = null) {
  if (!ref.avatar) return;

  ref.animations = [];
  ref.pending = false;
  ref.flag = false;

  applyDefaultPose();

  const processedText = text.toUpperCase().trim();
  const playbackRate = gestureData?.playbackRate || 1.0;
  const effectiveDuration = duration / playbackRate;

  if (effectiveDuration < 1.0) {
    speed = 0.15;
    pause = 50;
  } else if (effectiveDuration > 4.0) {
    speed = 0.05;
    pause = 200;
  } else {
    speed = 0.08;
    pause = 100;
  }

  ref.currentGestureData = {
    text: text,
    startTime: Date.now(),
    duration: duration * 1000,
    endTime: Date.now() + duration * 1000,
    gestureInfo: gestureData,
  };

  processTextAnimationWithTiming(processedText, effectiveDuration);

  if (!ref.pending && ref.animations.length > 0) {
    ref.pending = true;
    ref.animate();

    setTimeout(() => {
      validateGestureCompletion();
    }, duration * 1000);
  }

  const progressInfo = gestureData ? `${gestureData.progressPercentage?.toFixed(0)}% (${duration.toFixed(1)}s)` : `${duration.toFixed(1)}s`;
  showOverlay(`${text} - ${progressInfo}`);
  updateStatus(`Gesture: ${text}`, true);
}

function validateGestureCompletion() {
  if (ref.currentGestureData) {
    ref.currentGestureData = null;
    setTimeout(() => {
      if (!ref.pending) {
        applyDefaultPose();
        showOverlay("Ready...");
        updateStatus("Ready", true);
      }
    }, 200);
  }
}

function processTextAnimationWithTiming(text, effectiveDuration) {
  const words = text.split(" ");
  const wordCount = words.length;
  const timePerWord = wordCount > 1 ? effectiveDuration / wordCount : effectiveDuration;

  for (let i = 0; i < words.length; i++) {
    const word = words[i].trim();
    if (word.length === 0) continue;

    if (window.words && window.words[word]) {
      ref.animations.push(["add-text", word + " "]);
      window.words[word](ref);
      if (window.defaultPose) window.defaultPose(ref);
    } else {
      const charCount = word.length;
      const timePerChar = timePerWord / charCount;

      for (const [index, ch] of word.split("").entries()) {
        if (index === word.length - 1) {
          ref.animations.push(["add-text", ch + " "]);
        } else {
          ref.animations.push(["add-text", ch]);
        }

        if (window.alphabets && window.alphabets[ch]) {
          window.alphabets[ch](ref);
        } else {
          addBasicGesture(ch);
        }
      }
      if (window.defaultPose) window.defaultPose(ref);
    }
  }
}

async function processTextAnimation(text) {
  if (!text) return;
  const words = text.toUpperCase().split(/\s+/);

  for (let word of words) {
    if (word.length === 0) continue;

    // 1. Check if the whole word exists as a single animation (e.g., "HOME")
    if (window.words && window.words[word]) {
      console.log(`🎬 Playing word gesture: ${word}`);
      ref.animations.push(["add-text", word + " "]);
      await window.words[word](ref); // Use await if your gestures return promises
      if (window.defaultPose) window.defaultPose(ref);
    } 
    // 2. Fallback to spelling out the word
    else {
      console.log(`🔤 Spelling out: ${word}`);
      for (const ch of word.split("")) {
        if (window.alphabets && window.alphabets[ch]) {
          ref.animations.push(["add-text", ch]);
          await window.alphabets[ch](ref); 
        }
      }
      if (window.defaultPose) window.defaultPose(ref);
    }
  }
}

function addBasicGesture(char) {
  ref.animations.push([
    ["mixamorigRightArm", "rotation", "z", 0.5, "+"],
    ["mixamorigRightForeArm", "rotation", "z", 0.3, "+"],
  ]);
  ref.animations.push([]);
  ref.animations.push([
    ["mixamorigRightArm", "rotation", "z", 0, "-"],
    ["mixamorigRightForeArm", "rotation", "z", 0, "-"],
  ]);
}

// Global render loop - separated from animation logic
function animate() {
  requestAnimationFrame(animate);
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

function onWindowResize() {
  if (camera && renderer && canvas) {
    const canvasContainer = canvas.parentElement;
    const width = canvasContainer.offsetWidth || 400;
    const height = canvasContainer.offsetHeight || 300;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
}

// Global utility functions
function showLoading() {
  if (loading) loading.style.display = "flex";
  if (error) error.style.display = "none";
}
function hideLoading() {
  if (loading) loading.style.display = "none";
}
function showError(message) {
  if (error) {
    error.innerHTML = `<p>❌ ${message}</p>`;
    error.style.display = "block";
  }
  if (loading) loading.style.display = "none";
}
function updateStatus(message, isConnected) {
  if (statusDot) statusDot.className = isConnected ? "status-dot connected" : "status-dot";
  if (statusText) statusText.textContent = message;
}
function showOverlay(text) {
  if (overlay) {
    overlay.textContent = text;
    overlay.style.display = "block";
    setTimeout(() => {
      if (overlay) overlay.style.display = "none";
    }, 1000);
  }
}

// Helper to normalize bones for fallback animations
function getBonesMap(model) {
  const bones = {};
  if (!model) return bones;
  model.traverse((child) => {
    if (child.isBone) {
      bones[child.name] = child;
      const safeName = child.name.replace(/[^a-zA-Z0-9]/g, '');
      bones[safeName] = child;
      if (!safeName.toLowerCase().startsWith('mixamorig')) {
        const capName = safeName.charAt(0).toUpperCase() + safeName.slice(1);
        bones['mixamorig' + capName] = child;
      }
    }
  });
  return bones;
}

function resetToNeutral() {
  if (!currentModel) return;
  currentModel.traverse((child) => {
    if (child.isBone) child.rotation.set(0, 0, 0);
  });
}

// --- FALLBACK ANIMATIONS (Fixed with robust bone mapping) ---
function animateA() {
  if (!currentModel) return;
  const bones = getBonesMap(currentModel);

  setTimeout(() => {
    if (bones.mixamorigRightHandIndex1) bones.mixamorigRightHandIndex1.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHandIndex2) bones.mixamorigRightHandIndex2.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHandIndex3) bones.mixamorigRightHandIndex3.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHandMiddle1) bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHandRing1) bones.mixamorigRightHandRing1.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHandPinky1) bones.mixamorigRightHandPinky1.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHandThumb2) bones.mixamorigRightHandThumb2.rotation.y = -Math.PI / 3;
    if (bones.mixamorigRightHand) bones.mixamorigRightHand.rotation.z = Math.PI / 4;
    if (bones.mixamorigRightForeArm) bones.mixamorigRightForeArm.rotation.z = Math.PI / 6;
    if (bones.mixamorigRightArm) bones.mixamorigRightArm.rotation.x = -Math.PI / 6;
  }, 100);
  setTimeout(resetToNeutral, 500);
}

function animateB() {
  if (!currentModel) return;
  const bones = getBonesMap(currentModel);

  setTimeout(() => {
    if (bones.mixamorigRightHandThumb1) bones.mixamorigRightHandThumb1.rotation.x = Math.PI / 2;
    if (bones.mixamorigRightHandThumb2) bones.mixamorigRightHandThumb2.rotation.y = Math.PI / 2;
    if (bones.mixamorigRightHand) bones.mixamorigRightHand.rotation.x = Math.PI / 2;
    if (bones.mixamorigRightForeArm) bones.mixamorigRightForeArm.rotation.z = Math.PI / 4;
    if (bones.mixamorigRightArm) bones.mixamorigRightArm.rotation.x = -Math.PI / 4;
  }, 100);
  setTimeout(resetToNeutral, 500);
}

function animateE() {
  if (!currentModel) return;
  const bones = getBonesMap(currentModel);

  setTimeout(() => {
    if (bones.mixamorigRightHandIndex1) bones.mixamorigRightHandIndex1.rotation.z = Math.PI / 3;
    if (bones.mixamorigRightHandMiddle1) bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 3;
    if (bones.mixamorigRightHandRing1) bones.mixamorigRightHandRing1.rotation.z = Math.PI / 3;
    if (bones.mixamorigRightHandPinky1) bones.mixamorigRightHandPinky1.rotation.z = Math.PI / 3;
    if (bones.mixamorigRightHandThumb2) bones.mixamorigRightHandThumb2.rotation.y = -Math.PI / 4;
    if (bones.mixamorigRightHand) bones.mixamorigRightHand.rotation.x = Math.PI / 4;
    if (bones.mixamorigRightForeArm) bones.mixamorigRightForeArm.rotation.z = Math.PI / 6;
  }, 100);
  setTimeout(resetToNeutral, 500);
}

function animateH() {
  if (!currentModel) return;
  const bones = getBonesMap(currentModel);

  setTimeout(() => {
    if (bones.mixamorigRightHandRing1) bones.mixamorigRightHandRing1.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHandPinky1) bones.mixamorigRightHandPinky1.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHandThumb2) bones.mixamorigRightHandThumb2.rotation.y = -Math.PI / 3;
    if (bones.mixamorigRightHand) bones.mixamorigRightHand.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightForeArm) bones.mixamorigRightForeArm.rotation.z = Math.PI / 3;
  }, 100);
  setTimeout(resetToNeutral, 500);
}

function animateL() {
  if (!currentModel) return;
  const bones = getBonesMap(currentModel);

  setTimeout(() => {
    if (bones.mixamorigRightHandMiddle1) bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHandRing1) bones.mixamorigRightHandRing1.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHandPinky1) bones.mixamorigRightHandPinky1.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHandThumb1) bones.mixamorigRightHandThumb1.rotation.x = -Math.PI / 3;
    if (bones.mixamorigRightHand) bones.mixamorigRightHand.rotation.x = Math.PI / 6;
  }, 100);
  setTimeout(resetToNeutral, 500);
}

function animateO() {
  if (!currentModel) return;
  const bones = getBonesMap(currentModel);

  setTimeout(() => {
    if (bones.mixamorigRightHandIndex1) bones.mixamorigRightHandIndex1.rotation.z = Math.PI / 4;
    if (bones.mixamorigRightHandMiddle1) bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 4;
    if (bones.mixamorigRightHandRing1) bones.mixamorigRightHandRing1.rotation.z = Math.PI / 4;
    if (bones.mixamorigRightHandPinky1) bones.mixamorigRightHandPinky1.rotation.z = Math.PI / 4;
    if (bones.mixamorigRightHandThumb1) bones.mixamorigRightHandThumb1.rotation.x = Math.PI / 4;
  }, 100);
  setTimeout(resetToNeutral, 500);
}

function animateD() {
  if (!currentModel) return;
  const bones = getBonesMap(currentModel);

  setTimeout(() => {
    if (bones.mixamorigRightHandMiddle1) bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 1.5;
    if (bones.mixamorigRightHandThumb1) bones.mixamorigRightHandThumb1.rotation.x = Math.PI / 3;
    if (bones.mixamorigRightHand) bones.mixamorigRightHand.rotation.z = -Math.PI / 7.5;
    if (bones.mixamorigRightArm) bones.mixamorigRightArm.rotation.x = -Math.PI / 6.5;
  }, 100);
  setTimeout(resetToNeutral, 500);
}

function animateF() {
  if (!currentModel) return;
  const bones = getBonesMap(currentModel);

  setTimeout(() => {
    if (bones.mixamorigRightHandRing1) bones.mixamorigRightHandRing1.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHandThumb2) bones.mixamorigRightHandThumb2.rotation.y = -Math.PI / 2.5;
    if (bones.mixamorigRightHand) bones.mixamorigRightHand.rotation.z = Math.PI / 4;
  }, 100);
  setTimeout(resetToNeutral, 500);
}

function animateI() {
  if (!currentModel) return;
  const bones = getBonesMap(currentModel);

  setTimeout(() => {
    if (bones.mixamorigRightHandMiddle1) bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHandRing1) bones.mixamorigRightHandRing1.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHandThumb2) bones.mixamorigRightHandThumb2.rotation.y = -Math.PI / 2.5;
    if (bones.mixamorigRightHand) bones.mixamorigRightHand.rotation.x = -Math.PI / 2;
  }, 100);
  setTimeout(resetToNeutral, 500);
}

function animateU() {
  if (!currentModel) return;
  const bones = getBonesMap(currentModel);

  setTimeout(() => {
    if (bones.mixamorigRightHandRing1) bones.mixamorigRightHandRing1.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHandPinky1) bones.mixamorigRightHandPinky1.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHandThumb1) bones.mixamorigRightHandThumb1.rotation.x = Math.PI / 3;
    if (bones.mixamorigRightHand) bones.mixamorigRightHand.rotation.x = -Math.PI;
  }, 100);
  setTimeout(resetToNeutral, 500);
}

function animateY() {
  if (!currentModel) return;
  const bones = getBonesMap(currentModel);

  setTimeout(() => {
    if (bones.mixamorigRightHandMiddle1) bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 1.5;
    if (bones.mixamorigRightHandRing1) bones.mixamorigRightHandRing1.rotation.z = Math.PI / 1.6;
    if (bones.mixamorigRightHandThumb2) bones.mixamorigRightHandThumb2.rotation.y = -Math.PI / 2.5;
    if (bones.mixamorigRightHand) bones.mixamorigRightHand.rotation.z = Math.PI / 2.5;
  }, 100);
  setTimeout(resetToNeutral, 500);
}

function animateHOME() {
  if (!currentModel) return;
  const bones = getBonesMap(currentModel);

  setTimeout(() => {
    if (bones.mixamorigRightHandThumb2) bones.mixamorigRightHandThumb2.rotation.y = -Math.PI / 3;
    if (bones.mixamorigRightHand) bones.mixamorigRightHand.rotation.x = Math.PI / 4;
    if (bones.mixamorigRightForeArm) bones.mixamorigRightForeArm.rotation.x = Math.PI / 3;
    if (bones.mixamorigRightArm) bones.mixamorigRightArm.rotation.x = -Math.PI / 2;
  }, 100);
  setTimeout(() => {
    if (bones.mixamorigRightForeArm) bones.mixamorigRightForeArm.rotation.x = Math.PI / 6;
  }, 300);
  setTimeout(resetToNeutral, 600);
}

function animateYOU() {
  if (!currentModel) return;
  const bones = getBonesMap(currentModel);

  setTimeout(() => {
    if (bones.mixamorigRightHandMiddle1) bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHandRing1) bones.mixamorigRightHandRing1.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHandPinky1) bones.mixamorigRightHandPinky1.rotation.z = Math.PI / 2;
    if (bones.mixamorigRightHand) bones.mixamorigRightHand.rotation.x = 0;
    if (bones.mixamorigRightForeArm) bones.mixamorigRightForeArm.rotation.z = Math.PI / 4;
  }, 100);
  setTimeout(resetToNeutral, 500);
}

function animateTIME() {
  if (!currentModel) return;
  const bones = getBonesMap(currentModel);

  setTimeout(() => {
    if (bones.mixamorigLeftHand) bones.mixamorigLeftHand.rotation.x = Math.PI / 2;
    if (bones.mixamorigRightHand) bones.mixamorigRightHand.rotation.x = -Math.PI / 4;
    if (bones.mixamorigRightForeArm) bones.mixamorigRightForeArm.rotation.x = Math.PI / 4;
  }, 100);
  setTimeout(resetToNeutral, 500);
}

function animatePERSON() {
  if (!currentModel) return;
  const bones = getBonesMap(currentModel);

  setTimeout(() => {
    if (bones.mixamorigRightHandMiddle1) bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 2;
    if (bones.mixamorigLeftHandMiddle1) bones.mixamorigLeftHandMiddle1.rotation.z = -Math.PI / 2;
    if (bones.mixamorigRightHand) bones.mixamorigRightHand.rotation.x = Math.PI / 2;
    if (bones.mixamorigLeftHand) bones.mixamorigLeftHand.rotation.x = Math.PI / 2;
  }, 100);
  setTimeout(resetToNeutral, 500);
}

// Text animation function router
function animateText(text) {
  if (!text || !text.trim()) return;

  const cleanText = text.trim().toUpperCase();
  const words = cleanText.split(/\s+/);
  if (words.length === 0) return;

  const firstWord = words[0];

  if (firstWord === "HOME") return animateHOME();
  if (firstWord === "YOU") return animateYOU();
  if (firstWord === "TIME") return animateTIME();
  if (firstWord === "PERSON") return animatePERSON();

  for (let i = 0; i < Math.min(firstWord.length, 4); i++) {
    const letter = firstWord[i];

    setTimeout(() => {
      showOverlay(`Letter: ${letter}`);
      switch (letter) {
        case "A": animateA(); break;
        case "B": animateB(); break;
        case "C": animateA(); break; 
        case "D": animateD(); break;
        case "E": animateE(); break;
        case "F": animateF(); break;
        case "G": animateA(); break; 
        case "H": animateH(); break;
        case "I": animateI(); break;
        case "J": animateI(); break; 
        case "K": animateH(); break; 
        case "L": animateL(); break;
        case "M": animateB(); break; 
        case "N": animateB(); break; 
        case "O": animateO(); break;
        case "P": animateD(); break; 
        case "Q": animateO(); break; 
        case "R": animateH(); break; 
        case "S": animateA(); break; 
        case "T": animateD(); break; 
        case "U": animateU(); break;
        case "V": animateD(); break; 
        case "W": animateE(); break; 
        case "X": animateA(); break; 
        case "Y": animateY(); break;
        case "Z": animateD(); break; 
        default: animateA(); break;
      }
    }, i * 600);
  }
}

// Message listener for extension communication
function setupMessageListener() {
  window.addEventListener("message", (event) => {
    if (!event.data || !event.data.action) return;
    const { action, data } = event.data;

    switch (action) {
      case "animateText":
        if (data && data.text) animateText(data.text);
        break;
      case "gestureText":
        if (data && data.text) animateRealTimeText(data.text, data.duration || 3, data);
        break;
      case "gestureStop":
        ref.animations = [];
        ref.pending = false;
        applyDefaultPose();
        break;
      case "subtitleData":
        if (data && data.subtitles) loadAnimationLibraries();
        break;
      case "testAnimation":
        animateA();
        break;
      case "updateStatus":
        if (data) updateStatus(data.message || "Ready", data.connected || false);
        break;
    }
  });
}

// Background script messenger
// SINGLE, UNIFIED MESSAGE LISTENER (Place near the bottom of gesture-window.js)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Received from background:", request.action);
  
  try {
      // 1. Unified check for both manual gestures AND automatic subtitles
      if (request.action === "gestureText" || request.action === "subtitleData") {
        
        // 2. Extract the text (it might be in request.data.text OR request.text)
        const rawText = request.data?.text || request.text || "";
        const cleanText = rawText.toUpperCase();

        if (cleanText) {
          console.log("📖 Animating text:", cleanText);

          // Trigger your animation processor
          // Note: Ensure this matches the function name you are using (animateRealTimeText or processTextAnimation)
          if (typeof animateRealTimeText === "function") {
              animateRealTimeText(cleanText, request.data?.duration || 3, request.data);
          } else if (typeof processTextAnimation === "function") {
              processTextAnimation(cleanText);
          }

          showOverlay("Listening");
          // showOverlay(`Gesture: ${cleanText}`);
          
          if (!ref.pending) {
            ref.pending = true;
            ref.animate();
          }
        }
      } 
      else if (request.action === "gestureStop") {
        ref.animations = [];
        ref.pending = false;
        if (typeof applyDefaultPose === "function") applyDefaultPose();
      }
      
      // 3. Keep the channel happy by responding immediately
      sendResponse({ success: true, status: "received" });
      
  } catch (error) {
      console.error("❌ Error in message listener:", error);
      sendResponse({ success: false, error: error.message });
  }

  // MUST return false because we sent the response synchronously
  return false; 
});

// Load animation libraries
function loadAnimationLibraries() {
  try {
    if (window.parent && window.parent.alphabets) window.alphabets = window.parent.alphabets;
    if (window.parent && window.parent.words) window.words = window.parent.words;
    if (!window.alphabets && typeof alphabets !== "undefined") window.alphabets = alphabets;
    if (!window.words && typeof words !== "undefined") window.words = words;
  } catch (error) {
    console.warn("⚠️ Could not load animation libraries:", error.message);
  }
}

// Draggable Window Logic
function makeWindowDraggable() {
  let isDragging = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;
  const dragElement = document.querySelector(".drag-handle") || document.body;

  function dragStart(e) {
    if (e.type === "touchstart") {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }
    if (e.target === dragElement || dragElement.contains(e.target)) isDragging = true;
  }

  function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      if (e.type === "touchmove") {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }
      xOffset = currentX;
      yOffset = currentY;
      document.body.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }
  }

  document.addEventListener("mousedown", dragStart);
  document.addEventListener("mouseup", dragEnd);
  document.addEventListener("mousemove", drag);
  document.addEventListener("touchstart", dragStart);
  document.addEventListener("touchend", dragEnd);
  document.addEventListener("touchmove", drag);
}

// Test Button Setup
function getDemoSubtitles() {
  return [
    { start: 0, end: 2.5, text: "HELLO" },
    { start: 2.5, end: 5.0, text: "WORLD" }
  ]; // Shortened for length constraints, your full array works fine!
}

function setupTestButton() {
  if (testBtn) {
    testBtn.addEventListener("click", () => {
      if (!ref.avatar) return showOverlay("Error: Avatar not loaded");

      const demoSubtitles = getDemoSubtitles();
      let currentSubtitleIndex = 0;
      let demoInterval;

      const runNextSubtitle = () => {
        if (currentSubtitleIndex >= demoSubtitles.length) {
          showOverlay("Demo Complete!");
          clearInterval(demoInterval);
          return;
        }

        const subtitle = demoSubtitles[currentSubtitleIndex];
        const gestureData = {
          text: subtitle.text,
          duration: subtitle.end - subtitle.start,
          playbackRate: 1.0,
        };

        processTextAnimation(subtitle.text.toUpperCase());
        showOverlay(`Demo: ${subtitle.text}`);

        if (!ref.pending) {
          ref.pending = true;
          ref.animate();
        }
        currentSubtitleIndex++;
      };

      ref.animations = [];
      ref.pending = false;
      ref.flag = false;
      showOverlay("Starting Demo Animation...");
      runNextSubtitle();
      demoInterval = setInterval(runNextSubtitle, 3000); 
    });
  }
}

// Initialization Triggers
document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.initGestureWindow === "function") window.initGestureWindow();
});

if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(() => {
    if (typeof window.initGestureWindow === "function") window.initGestureWindow();
  }, 100);
}

// Local Storage Fallback Checker
function checkLocalStorageForGestures() {
  try {
    const gestureData = localStorage.getItem("gestureGuru_currentText");
    const lastUpdate = localStorage.getItem("gestureGuru_lastUpdate");

    if (gestureData && lastUpdate) {
      if (Date.now() - parseInt(lastUpdate) < 5000) {
        const data = JSON.parse(gestureData);
        if (data && data.data && data.data.text) {
          processTextAnimation(data.data.text.toUpperCase());
          showOverlay(`Gesture: ${data.data.text}`);
          if (!ref.pending) {
            ref.pending = true;
            ref.animate();
          }
          localStorage.removeItem("gestureGuru_currentText");
          localStorage.removeItem("gestureGuru_lastUpdate");
        }
      }
    }
  } catch (error) {}
}
setInterval(checkLocalStorageForGestures, 1000);

// // Every time this window opens or refreshes, it registers itself
// chrome.runtime.sendMessage({ 
//     action: "registerGestureWindow", 
//     tabId: "current" // Background script will interpret this
// });

// console.log("👂 Listening for gestures...");

// // Place this at the VERY top of gesture-window.js
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     console.log("📥 Message received:", request.action);

//     // 1. Immediate acknowledgment to prevent the "Channel Closed" error
//     sendResponse({ status: "received" }); 

//     // 2. Handle the logic AFTER responding
//     if (request.action === "gestureText") {
//         if (typeof handleIncomingGesture === "function") {
//             handleIncomingGesture(request.data);
//         } else {
//             console.warn("⚠️ handleIncomingGesture not defined yet");
//         }
//     }
    
//     // IMPORTANT: Do NOT return true here anymore. 
//     // We already sent the response above, so we don't need to keep it open.
//     return false; 
// });

// // Gesture Window Script - Complete fixed version
// console.log("GestureGuru gesture window loaded");

// // Global variables
// let scene, camera, renderer, currentModel;
// let animations = [];
// let currentText = "";
// let isAnimating = false;
// let pending = false;
// let flag = false;
// let speed = 0.1; // Exact same variable name as observe folder
// let pause = 100; // Exact same variable name as observe folder
// let settings = {
//   autoMode: true,
//   speedSync: true,
// };

// // Animation reference object exactly like observe folder
// let ref = {
//   avatar: null,
//   animations: [],
//   pending: false,
//   flag: false,
//   scene: null,
//   camera: null,
//   renderer: null,

//   animate: function () {
//     if (this.animations.length === 0) {
//       this.pending = false;
//       return;
//     }
//     requestAnimationFrame(this.animate.bind(this));

//     if (this.animations[0].length) {
//       if (!this.flag) {
//         if (this.animations[0][0] === "add-text") {
//           // Handle text addition (not used in gesture mode but keeping for compatibility)
//           this.animations.shift();
//         } else {
//           // Process bone animations exactly like observe folder
//           for (let i = 0; i < this.animations[0].length; ) {
//             let [boneName, action, axis, limit, sign] = this.animations[0][i];

//             const bone = this.avatar?.getObjectByName(boneName);
//             if (!bone) {
//               console.warn(`Bone ${boneName} not found`);
//               this.animations[0].splice(i, 1);
//               continue;
//             }

//             if (sign === "+" && bone[action][axis] < limit) {
//               bone[action][axis] += speed;
//               bone[action][axis] = Math.min(bone[action][axis], limit);
//               i++;
//             } else if (sign === "-" && bone[action][axis] > limit) {
//               bone[action][axis] -= speed;
//               bone[action][axis] = Math.max(bone[action][axis], limit);
//               i++;
//             } else {
//               this.animations[0].splice(i, 1);
//             }
//           }
//         }
//       }
//     } else {
//       this.flag = true;
//       setTimeout(() => {
//         this.flag = false;
//       }, pause);
//       this.animations.shift();
//     }

//     if (this.renderer && this.scene && this.camera) {
//       this.renderer.render(this.scene, this.camera);
//     }
//   },
// };

// // DOM elements
// const canvas = document.getElementById("canvas");
// const loading = document.getElementById("loading");
// const error = document.getElementById("error");
// const overlay = document.getElementById("overlay");
// const statusDot = document.getElementById("statusDot");
// const statusText = document.getElementById("statusText");
// const testBtn = document.getElementById("testBtn");

// // Initialize gesture window
// window.initGestureWindow = function () {
//   console.log("🚀 Initializing gesture window...");
//   setupThreeJS();
//   loadAvatar();
//   setupMessageListener();
//   makeWindowDraggable();
//   setupTestButton();
// };

// // Setup Three.JS scene
// function setupThreeJS() {
//   try {
//     console.log("🔧 Setting up Three.JS...");

//     // Create scene exactly like observe folder
//     scene = new THREE.Scene();
//     scene.background = "white"; // Exact same as observe folder

//     // Lighting setup exactly like observe folder
//     const spotLight = new THREE.SpotLight(0xffffff, 2);
//     spotLight.position.set(0, 5, 5);
//     scene.add(spotLight);

//     // Get canvas container dimensions
//     const canvasContainer = canvas.parentElement;
//     const width = canvasContainer.offsetWidth || 400;
//     const height = canvasContainer.offsetHeight || 300;

//     // Create camera with exact same settings as observe
//     camera = new THREE.PerspectiveCamera(
//       30, // Same FOV as observe
//       width / height, // Use actual container dimensions
//       0.1,
//       1000
//     );

//     // Camera position exactly like observe
//     camera.position.z = 1.6;
//     camera.position.y = 1.4;

//     // Create renderer with exact same settings as observe
//     renderer = new THREE.WebGLRenderer({ antialias: true });
//     renderer.setSize(width, height);

//     // Clear canvas before adding renderer
//     canvas.innerHTML = "";
//     canvas.appendChild(renderer.domElement);

//     // Handle window resize
//     window.addEventListener("resize", onWindowResize);

//     console.log(
//       "✅ Three.JS setup complete - Canvas size:",
//       width + "x" + height
//     );

//     // Start render loop immediately
//     animate();
//   } catch (err) {
//     console.error("❌ Error setting up Three.JS:", err);
//     showError("Failed to initialize 3D engine: " + err.message);
//   }
//   // Inside your model loader callback, after scene.add(model)
//   console.log("✅ Avatar Ready to receive gestures");
//   chrome.runtime.sendMessage({ 
//       action: "avatarStatus", 
//       status: "ready" 
//   });
// }

// // Wait for dependencies to load
// function waitForDependencies() {
//   return new Promise((resolve) => {
//     const checkDependencies = () => {
//       if (
//         typeof THREE !== "undefined" &&
//         typeof THREE.GLTFLoader !== "undefined"
//       ) {
//         console.log("All dependencies loaded successfully");
//         resolve();
//       } else {
//         console.log(
//           "Waiting for dependencies... THREE:",
//           typeof THREE !== "undefined",
//           "GLTFLoader:",
//           typeof THREE.GLTFLoader !== "undefined"
//         );
//         setTimeout(checkDependencies, 100);
//       }
//     };
//     checkDependencies();
//   });
// }

// // Load 3D avatar
// async function loadAvatar() {
//   try {
//     updateStatus("Loading avatar...", false);
//     console.log("📥 Loading 3D avatar...");

//     // Wait for dependencies to be available
//     await waitForDependencies();

//     // Check if required dependencies are available
//     if (typeof THREE === "undefined") {
//       throw new Error("THREE.js library not loaded");
//     }

//     if (typeof THREE.GLTFLoader === "undefined") {
//       throw new Error("GLTFLoader not available");
//     }

//     // Create GLTFLoader instance
//     const loader = new THREE.GLTFLoader();
//     console.log("🔧 GLTFLoader created successfully");

//     // Use a Promise-based approach for loading
//     const gltf = await new Promise((resolve, reject) => {
//       loader.load(
//         "./ybot.glb", // Model in public folder
//         resolve,
//         (progress) => {
//           console.log(
//             "📊 Loading progress:",
//             Math.round((progress.loaded / progress.total) * 100) + "%"
//           );
//         },
//         (error) => {
//           console.error("❌ Error loading model:", error);
//           reject(error);
//         }
//       );
//     });

//     console.log("✅ Model loaded successfully:", gltf);

//     // Process the loaded model exactly like observe folder
//     gltf.scene.traverse((child) => {
//       if (child.type === "SkinnedMesh") {
//         child.frustumCulled = false;
//       }
//     });

//     currentModel = gltf.scene;
//     ref.avatar = currentModel;
//     ref.scene = scene;
//     ref.camera = camera;
//     ref.renderer = renderer;

//     // Add model to scene
//     scene.add(currentModel);

//     console.log("📍 Model position:", currentModel.position);
//     console.log("📐 Model rotation:", currentModel.rotation);
//     console.log("📏 Model scale:", currentModel.scale);
//     console.log("🎯 Camera position:", camera.position);
//     console.log("🔍 Camera looking at:", camera.rotation);

//     // Apply default pose like observe folder with a small delay to ensure proper initialization
//     setTimeout(() => {
//       applyDefaultPose();
//       console.log("✅ Avatar added to scene successfully");
//       hideLoading();
//       updateStatus("Ready", true);
//     }, 150); // Small delay to ensure model is fully processed
//   } catch (error) {
//     console.error("❌ Failed to load avatar:", error);
//     showError("Failed to load avatar: " + error.message);
//     updateStatus("Error loading model", false);
//   }
// }

// // Apply default pose exactly like observe folder
// function applyDefaultPose() {
//   if (!ref.avatar) return;

//   try {
//     console.log("🎭 Applying default pose using real animations...");

//     // Clear any existing animations
//     ref.animations = [];
//     ref.pending = false;
//     ref.flag = false;

//     // Apply real default pose from animations
//     if (window.defaultPose && typeof window.defaultPose === "function") {
//       window.defaultPose(ref);
//       console.log("✅ Real default pose applied");
//     } else {
//       console.warn("⚠️ Real default pose not available, using fallback");
//       // Fallback to observe folder approach
//       let animations = [];

//       animations.push(["mixamorigNeck", "rotation", "x", Math.PI / 12, "+"]);
//       animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI / 3, "-"]);
//       animations.push([
//         "mixamorigLeftForeArm",
//         "rotation",
//         "y",
//         -Math.PI / 1.5,
//         "-",
//       ]);
//       animations.push(["mixamorigRightArm", "rotation", "z", Math.PI / 3, "+"]);
//       animations.push([
//         "mixamorigRightForeArm",
//         "rotation",
//         "y",
//         Math.PI / 1.5,
//         "+",
//       ]);

//       ref.animations.push(animations);

//       // Start animation if not already running
//       if (ref.pending === false) {
//         ref.pending = true;
//         ref.animate();
//       }
//     }
//   } catch (error) {
//     console.error("❌ Error applying default pose:", error);
//   }
// }

// // Enhanced real-time gesture animation with precise timing synchronization
// function animateRealTimeText(text, duration, gestureData = null) {
//   if (!ref.avatar) {
//     console.error("❌ Avatar not loaded for real-time animation");
//     return;
//   }

//   // Enhanced logging with precise timing info
//   if (gestureData) {
//     console.log(`� PRECISE GESTURE: "${text}"`);
//     console.log(
//       `   ⏰ Duration: ${duration.toFixed(
//         2
//       )}s | Total: ${gestureData.totalDuration?.toFixed(2)}s`
//     );
//     console.log(
//       `   📊 Progress: ${gestureData.progressPercentage?.toFixed(1)}%`
//     );
//     console.log(`   🎬 Playback Rate: ${gestureData.playbackRate}x`);
//     console.log(
//       `   🕐 Timeline: ${gestureData.startTime?.toFixed(
//         2
//       )}s → ${gestureData.endTime?.toFixed(2)}s`
//     );
//   } else {
//     console.log(`🎭 Real-time gesture: "${text}" (${duration.toFixed(2)}s)`);
//   }

//   // Clear any existing animations for immediate response
//   ref.animations = [];
//   ref.pending = false;
//   ref.flag = false;

//   // Apply default pose first for consistent starting position
//   applyDefaultPose();

//   // Process text with enhanced timing awareness
//   const processedText = text.toUpperCase().trim();

//   // Calculate animation speed based on duration and playback rate
//   const playbackRate = gestureData?.playbackRate || 1.0;
//   const effectiveDuration = duration / playbackRate;

//   // Adjust animation speed for precise timing
//   if (effectiveDuration < 1.0) {
//     // Fast gesture for short durations
//     speed = 0.15;
//     pause = 50;
//     console.log("⚡ Fast gesture mode for short duration");
//   } else if (effectiveDuration > 4.0) {
//     // Slow gesture for long durations
//     speed = 0.05;
//     pause = 200;
//     console.log("🐌 Slow gesture mode for long duration");
//   } else {
//     // Normal gesture speed
//     speed = 0.08;
//     pause = 100;
//     console.log("📐 Normal gesture speed");
//   }

//   // Store timing data for progress tracking
//   ref.currentGestureData = {
//     text: text,
//     startTime: Date.now(),
//     duration: duration * 1000, // Convert to milliseconds
//     endTime: Date.now() + duration * 1000,
//     gestureInfo: gestureData,
//   };

//   // Process text animation with timing awareness
//   processTextAnimationWithTiming(processedText, effectiveDuration);

//   // Start animation with timing validation
//   if (!ref.pending && ref.animations.length > 0) {
//     ref.pending = true;
//     ref.animate();

//     // Set up completion timeout
//     setTimeout(() => {
//       validateGestureCompletion();
//     }, duration * 1000);
//   }

//   // Show current text with timing info in overlay
//   const progressInfo = gestureData
//     ? `${gestureData.progressPercentage?.toFixed(0)}% (${duration.toFixed(1)}s)`
//     : `${duration.toFixed(1)}s`;
//   showOverlay(`${text} - ${progressInfo}`);

//   // Update status with precise timing
//   updateStatus(`Gesture: ${text}`, true);
// }

// // Validate gesture completion and timing
// function validateGestureCompletion() {
//   if (ref.currentGestureData) {
//     const elapsed = Date.now() - ref.currentGestureData.startTime;
//     const expected = ref.currentGestureData.duration;
//     const timeDiff = Math.abs(elapsed - expected);

//     if (timeDiff > 500) {
//       // More than 500ms difference
//       console.log(
//         `⚠️ Gesture timing variance: ${timeDiff}ms (expected: ${expected}ms, actual: ${elapsed}ms)`
//       );
//     } else {
//       console.log(
//         `✅ Gesture completed on time (${elapsed}ms vs expected ${expected}ms)`
//       );
//     }

//     // Clear gesture data
//     ref.currentGestureData = null;

//     // Return to default pose
//     setTimeout(() => {
//       if (!ref.pending) {
//         // Only if no new gesture started
//         applyDefaultPose();
//         showOverlay("Ready...");
//         updateStatus("Ready", true);
//       }
//     }, 200);
//   }
// }

// // Enhanced text processing with timing awareness
// function processTextAnimationWithTiming(text, effectiveDuration) {
//   // Split text into words
//   const words = text.split(" ");
//   const wordCount = words.length;
//   const timePerWord =
//     wordCount > 1 ? effectiveDuration / wordCount : effectiveDuration;

//   console.log(
//     `📝 Processing ${wordCount} word(s), ${timePerWord.toFixed(2)}s per word`
//   );

//   for (let i = 0; i < words.length; i++) {
//     const word = words[i].trim();
//     if (word.length === 0) continue;

//     console.log(
//       `🔤 Word ${i + 1}/${wordCount}: "${word}" (${timePerWord.toFixed(2)}s)`
//     );

//     // Try to find word animation first
//     if (window.words && window.words[word]) {
//       ref.animations.push(["add-text", word + " "]);
//       window.words[word](ref);
//       // Return to default pose after each word
//       if (window.defaultPose) {
//         window.defaultPose(ref);
//       }
//     } else {
//       // Process character by character with timing
//       const charCount = word.length;
//       const timePerChar = timePerWord / charCount;

//       for (const [index, ch] of word.split("").entries()) {
//         if (index === word.length - 1) {
//           ref.animations.push(["add-text", ch + " "]);
//         } else {
//           ref.animations.push(["add-text", ch]);
//         }

//         // Use alphabet animation if available
//         if (window.alphabets && window.alphabets[ch]) {
//           window.alphabets[ch](ref);
//         } else {
//           // Fallback to basic gesture for unknown characters
//           addBasicGesture(ch);
//         }
//       }
//       // Return to default pose after each word (when spelled out)
//       if (window.defaultPose) {
//         window.defaultPose(ref);
//       }
//     }
//   }
// }

// // Process text animation like observe folder
// function processTextAnimation(text) {
//   // Split text into words
//   const words = text.split(" ");

//   for (let word of words) {
//     if (word.trim().length === 0) continue;

//     // Try to find word animation first
//     if (window.words && window.words[word]) {
//       ref.animations.push(["add-text", word + " "]);
//       window.words[word](ref);
//       // Return to default pose after each word
//       if (window.defaultPose) {
//         window.defaultPose(ref);
//       }
//     } else {
//       // Process character by character
//       for (const [index, ch] of word.split("").entries()) {
//         if (index === word.length - 1) {
//           ref.animations.push(["add-text", ch + " "]);
//         } else {
//           ref.animations.push(["add-text", ch]);
//         }

//         // Use alphabet animation if available
//         if (window.alphabets && window.alphabets[ch]) {
//           window.alphabets[ch](ref);
//         } else {
//           // Fallback to basic gesture for unknown characters
//           addBasicGesture(ch);
//         }
//       }
//       // Return to default pose after each word (when spelled out)
//       if (window.defaultPose) {
//         window.defaultPose(ref);
//       }
//     }
//   }
// }

// // Add basic gesture for unknown characters
// function addBasicGesture(char) {
//   // Simple wave gesture as fallback
//   ref.animations.push([
//     ["mixamorigRightArm", "rotation", "z", 0.5, "+"],
//     ["mixamorigRightForeArm", "rotation", "z", 0.3, "+"],
//   ]);
//   ref.animations.push([]);
//   ref.animations.push([
//     ["mixamorigRightArm", "rotation", "z", 0, "-"],
//     ["mixamorigRightForeArm", "rotation", "z", 0, "-"],
//   ]);
// }

// // Animation render loop - always running for base rendering
// function animate() {
//   requestAnimationFrame(animate);

//   if (renderer && scene && camera) {
//     renderer.render(scene, camera);
//   }
// }

// // Window resize handler
// function onWindowResize() {
//   if (camera && renderer && canvas) {
//     const canvasContainer = canvas.parentElement;
//     const width = canvasContainer.offsetWidth || 400;
//     const height = canvasContainer.offsetHeight || 300;

//     camera.aspect = width / height;
//     camera.updateProjectionMatrix();
//     renderer.setSize(width, height);

//     console.log("📐 Window resized - Canvas size:", width + "x" + height);
//   }
// }

// // Utility functions
// function showLoading() {
//   if (loading) loading.style.display = "flex";
//   if (error) error.style.display = "none";
// }

// function hideLoading() {
//   if (loading) loading.style.display = "none";
// }

// function showError(message) {
//   if (error) {
//     error.innerHTML = `<p>❌ ${message}</p>`;
//     error.style.display = "block";
//   }
//   if (loading) loading.style.display = "none";
//   console.error("Error:", message);
// }

// function updateStatus(message, isConnected) {
//   if (statusDot) {
//     statusDot.className = isConnected ? "status-dot connected" : "status-dot";
//   }
//   if (statusText) {
//     statusText.textContent = message;
//   }
// }

// function showOverlay(text) {
//   if (overlay) {
//     overlay.textContent = text;
//     overlay.style.display = "block";
//     setTimeout(() => {
//       if (overlay) overlay.style.display = "none";
//     }, 1000);
//   }
// }

// // Reset model to neutral position
// function resetToNeutral() {
//   if (!currentModel) return;

//   currentModel.traverse((child) => {
//     if (child.isBone) {
//       // Reset rotation to neutral
//       child.rotation.set(0, 0, 0);
//     }
//   });
// }

// // Animation functions for letters
// function animateA() {
//   console.log("🔤 Starting A animation");

//   if (!currentModel || !currentModel.traverse) {
//     console.error("❌ Model not ready for A animation");
//     return;
//   }

//   const bones = {};
//   currentModel.traverse((child) => {
//     if (child.isBone) {
//       bones[child.name] = child;
//     }
//   });

//   // A hand gesture - closed fist with thumb to side
//   setTimeout(() => {
//     // Right hand A position
//     if (bones.mixamorigRightHandIndex1)
//       bones.mixamorigRightHandIndex1.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandIndex2)
//       bones.mixamorigRightHandIndex2.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandIndex3)
//       bones.mixamorigRightHandIndex3.rotation.z = Math.PI / 2;

//     if (bones.mixamorigRightHandMiddle1)
//       bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandMiddle2)
//       bones.mixamorigRightHandMiddle2.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandMiddle3)
//       bones.mixamorigRightHandMiddle3.rotation.z = Math.PI / 2;

//     if (bones.mixamorigRightHandRing1)
//       bones.mixamorigRightHandRing1.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandRing2)
//       bones.mixamorigRightHandRing2.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandRing3)
//       bones.mixamorigRightHandRing3.rotation.z = Math.PI / 2;

//     if (bones.mixamorigRightHandPinky1)
//       bones.mixamorigRightHandPinky1.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandPinky2)
//       bones.mixamorigRightHandPinky2.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandPinky3)
//       bones.mixamorigRightHandPinky3.rotation.z = Math.PI / 2;

//     if (bones.mixamorigRightHandThumb2)
//       bones.mixamorigRightHandThumb2.rotation.y = -Math.PI / 3;
//     if (bones.mixamorigRightHandThumb3)
//       bones.mixamorigRightHandThumb3.rotation.y = -Math.PI / 3;

//     if (bones.mixamorigRightHand)
//       bones.mixamorigRightHand.rotation.z = Math.PI / 4;
//     if (bones.mixamorigRightForeArm)
//       bones.mixamorigRightForeArm.rotation.z = Math.PI / 6;
//     if (bones.mixamorigRightArm)
//       bones.mixamorigRightArm.rotation.x = -Math.PI / 6;
//   }, 100);

//   // Reset to neutral after delay
//   setTimeout(() => {
//     resetToNeutral();
//   }, 500);
// }

// function animateB() {
//   console.log("🔤 Starting B animation");

//   if (!currentModel || !currentModel.traverse) {
//     console.error("❌ Model not ready for B animation");
//     return;
//   }

//   const bones = {};
//   currentModel.traverse((child) => {
//     if (child.isBone) {
//       bones[child.name] = child;
//     }
//   });

//   // B hand gesture - four fingers up, thumb folded
//   setTimeout(() => {
//     // Keep fingers extended (close to straight)
//     if (bones.mixamorigRightHandIndex1)
//       bones.mixamorigRightHandIndex1.rotation.z = 0;
//     if (bones.mixamorigRightHandIndex2)
//       bones.mixamorigRightHandIndex2.rotation.z = 0;
//     if (bones.mixamorigRightHandIndex3)
//       bones.mixamorigRightHandIndex3.rotation.z = 0;

//     if (bones.mixamorigRightHandMiddle1)
//       bones.mixamorigRightHandMiddle1.rotation.z = 0;
//     if (bones.mixamorigRightHandMiddle2)
//       bones.mixamorigRightHandMiddle2.rotation.z = 0;
//     if (bones.mixamorigRightHandMiddle3)
//       bones.mixamorigRightHandMiddle3.rotation.z = 0;

//     if (bones.mixamorigRightHandRing1)
//       bones.mixamorigRightHandRing1.rotation.z = 0;
//     if (bones.mixamorigRightHandRing2)
//       bones.mixamorigRightHandRing2.rotation.z = 0;
//     if (bones.mixamorigRightHandRing3)
//       bones.mixamorigRightHandRing3.rotation.z = 0;

//     if (bones.mixamorigRightHandPinky1)
//       bones.mixamorigRightHandPinky1.rotation.z = 0;
//     if (bones.mixamorigRightHandPinky2)
//       bones.mixamorigRightHandPinky2.rotation.z = 0;
//     if (bones.mixamorigRightHandPinky3)
//       bones.mixamorigRightHandPinky3.rotation.z = 0;

//     // Fold thumb across palm
//     if (bones.mixamorigRightHandThumb1)
//       bones.mixamorigRightHandThumb1.rotation.x = Math.PI / 2;
//     if (bones.mixamorigRightHandThumb2)
//       bones.mixamorigRightHandThumb2.rotation.y = Math.PI / 2;
//     if (bones.mixamorigRightHandThumb3)
//       bones.mixamorigRightHandThumb3.rotation.y = Math.PI / 3;

//     // Position hand upright
//     if (bones.mixamorigRightHand)
//       bones.mixamorigRightHand.rotation.x = Math.PI / 2;
//     if (bones.mixamorigRightForeArm)
//       bones.mixamorigRightForeArm.rotation.z = Math.PI / 4;
//     if (bones.mixamorigRightArm)
//       bones.mixamorigRightArm.rotation.x = -Math.PI / 4;
//   }, 100);

//   // Reset to neutral after delay
//   setTimeout(() => {
//     resetToNeutral();
//   }, 500);
// }

// function animateE() {
//   console.log("🔤 Starting E animation");

//   if (!currentModel || !currentModel.traverse) {
//     console.error("❌ Model not ready for E animation");
//     return;
//   }

//   const bones = {};
//   currentModel.traverse((child) => {
//     if (child.isBone) {
//       bones[child.name] = child;
//     }
//   });

//   // E hand gesture - fingers curved downward
//   setTimeout(() => {
//     // Curve all fingers downward
//     if (bones.mixamorigRightHandIndex1)
//       bones.mixamorigRightHandIndex1.rotation.z = Math.PI / 3;
//     if (bones.mixamorigRightHandIndex2)
//       bones.mixamorigRightHandIndex2.rotation.z = Math.PI / 3;
//     if (bones.mixamorigRightHandIndex3)
//       bones.mixamorigRightHandIndex3.rotation.z = Math.PI / 3;

//     if (bones.mixamorigRightHandMiddle1)
//       bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 3;
//     if (bones.mixamorigRightHandMiddle2)
//       bones.mixamorigRightHandMiddle2.rotation.z = Math.PI / 3;
//     if (bones.mixamorigRightHandMiddle3)
//       bones.mixamorigRightHandMiddle3.rotation.z = Math.PI / 3;

//     if (bones.mixamorigRightHandRing1)
//       bones.mixamorigRightHandRing1.rotation.z = Math.PI / 3;
//     if (bones.mixamorigRightHandRing2)
//       bones.mixamorigRightHandRing2.rotation.z = Math.PI / 3;
//     if (bones.mixamorigRightHandRing3)
//       bones.mixamorigRightHandRing3.rotation.z = Math.PI / 3;

//     if (bones.mixamorigRightHandPinky1)
//       bones.mixamorigRightHandPinky1.rotation.z = Math.PI / 3;
//     if (bones.mixamorigRightHandPinky2)
//       bones.mixamorigRightHandPinky2.rotation.z = Math.PI / 3;
//     if (bones.mixamorigRightHandPinky3)
//       bones.mixamorigRightHandPinky3.rotation.z = Math.PI / 3;

//     // Thumb position
//     if (bones.mixamorigRightHandThumb2)
//       bones.mixamorigRightHandThumb2.rotation.y = -Math.PI / 4;
//     if (bones.mixamorigRightHandThumb3)
//       bones.mixamorigRightHandThumb3.rotation.y = -Math.PI / 4;

//     // Hand positioning
//     if (bones.mixamorigRightHand)
//       bones.mixamorigRightHand.rotation.x = Math.PI / 4;
//     if (bones.mixamorigRightForeArm)
//       bones.mixamorigRightForeArm.rotation.z = Math.PI / 6;
//     if (bones.mixamorigRightArm)
//       bones.mixamorigRightArm.rotation.x = -Math.PI / 8;
//   }, 100);

//   // Reset to neutral after delay
//   setTimeout(() => {
//     resetToNeutral();
//   }, 500);
// }

// function animateH() {
//   console.log("🔤 Starting H animation");

//   if (!currentModel || !currentModel.traverse) {
//     console.error("❌ Model not ready for H animation");
//     return;
//   }

//   const bones = {};
//   currentModel.traverse((child) => {
//     if (child.isBone) {
//       bones[child.name] = child;
//     }
//   });

//   // H hand gesture - index and middle fingers extended
//   setTimeout(() => {
//     // Extend index and middle, close others
//     if (bones.mixamorigRightHandIndex1)
//       bones.mixamorigRightHandIndex1.rotation.z = 0;
//     if (bones.mixamorigRightHandIndex2)
//       bones.mixamorigRightHandIndex2.rotation.z = 0;
//     if (bones.mixamorigRightHandIndex3)
//       bones.mixamorigRightHandIndex3.rotation.z = 0;

//     if (bones.mixamorigRightHandMiddle1)
//       bones.mixamorigRightHandMiddle1.rotation.z = 0;
//     if (bones.mixamorigRightHandMiddle2)
//       bones.mixamorigRightHandMiddle2.rotation.z = 0;
//     if (bones.mixamorigRightHandMiddle3)
//       bones.mixamorigRightHandMiddle3.rotation.z = 0;

//     // Close ring and pinky
//     if (bones.mixamorigRightHandRing1)
//       bones.mixamorigRightHandRing1.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandRing2)
//       bones.mixamorigRightHandRing2.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandRing3)
//       bones.mixamorigRightHandRing3.rotation.z = Math.PI / 2;

//     if (bones.mixamorigRightHandPinky1)
//       bones.mixamorigRightHandPinky1.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandPinky2)
//       bones.mixamorigRightHandPinky2.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandPinky3)
//       bones.mixamorigRightHandPinky3.rotation.z = Math.PI / 2;

//     // Thumb position
//     if (bones.mixamorigRightHandThumb2)
//       bones.mixamorigRightHandThumb2.rotation.y = -Math.PI / 3;
//     if (bones.mixamorigRightHandThumb3)
//       bones.mixamorigRightHandThumb3.rotation.y = -Math.PI / 3;

//     // Hand positioning - horizontal orientation
//     if (bones.mixamorigRightHand)
//       bones.mixamorigRightHand.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightForeArm)
//       bones.mixamorigRightForeArm.rotation.z = Math.PI / 3;
//     if (bones.mixamorigRightArm)
//       bones.mixamorigRightArm.rotation.x = -Math.PI / 6;
//   }, 100);

//   // Reset to neutral after delay
//   setTimeout(() => {
//     resetToNeutral();
//   }, 500);
// }

// function animateL() {
//   console.log("🔤 Starting L animation");

//   if (!currentModel || !currentModel.traverse) {
//     console.error("❌ Model not ready for L animation");
//     return;
//   }

//   const bones = {};
//   currentModel.traverse((child) => {
//     if (child.isBone) {
//       bones[child.name] = child;
//     }
//   });

//   // L hand gesture - index finger up, thumb out
//   setTimeout(() => {
//     // Extend index finger
//     if (bones.mixamorigRightHandIndex1)
//       bones.mixamorigRightHandIndex1.rotation.z = 0;
//     if (bones.mixamorigRightHandIndex2)
//       bones.mixamorigRightHandIndex2.rotation.z = 0;
//     if (bones.mixamorigRightHandIndex3)
//       bones.mixamorigRightHandIndex3.rotation.z = 0;

//     // Close other fingers
//     if (bones.mixamorigRightHandMiddle1)
//       bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandMiddle2)
//       bones.mixamorigRightHandMiddle2.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandMiddle3)
//       bones.mixamorigRightHandMiddle3.rotation.z = Math.PI / 2;

//     if (bones.mixamorigRightHandRing1)
//       bones.mixamorigRightHandRing1.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandRing2)
//       bones.mixamorigRightHandRing2.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandRing3)
//       bones.mixamorigRightHandRing3.rotation.z = Math.PI / 2;

//     if (bones.mixamorigRightHandPinky1)
//       bones.mixamorigRightHandPinky1.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandPinky2)
//       bones.mixamorigRightHandPinky2.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandPinky3)
//       bones.mixamorigRightHandPinky3.rotation.z = Math.PI / 2;

//     // Extend thumb outward
//     if (bones.mixamorigRightHandThumb1)
//       bones.mixamorigRightHandThumb1.rotation.x = -Math.PI / 3;
//     if (bones.mixamorigRightHandThumb2)
//       bones.mixamorigRightHandThumb2.rotation.y = -Math.PI / 2;
//     if (bones.mixamorigRightHandThumb3)
//       bones.mixamorigRightHandThumb3.rotation.y = -Math.PI / 4;

//     // Hand positioning
//     if (bones.mixamorigRightHand)
//       bones.mixamorigRightHand.rotation.x = Math.PI / 6;
//     if (bones.mixamorigRightForeArm)
//       bones.mixamorigRightForeArm.rotation.z = Math.PI / 4;
//     if (bones.mixamorigRightArm)
//       bones.mixamorigRightArm.rotation.x = -Math.PI / 4;
//   }, 100);

//   // Reset to neutral after delay
//   setTimeout(() => {
//     resetToNeutral();
//   }, 500);
// }

// function animateO() {
//   console.log("🔤 Starting O animation");

//   if (!currentModel || !currentModel.traverse) {
//     console.error("❌ Model not ready for O animation");
//     return;
//   }

//   const bones = {};
//   currentModel.traverse((child) => {
//     if (child.isBone) {
//       bones[child.name] = child;
//     }
//   });

//   // O hand gesture - all fingers curved to form circle
//   setTimeout(() => {
//     // Curve all fingers to form O shape
//     if (bones.mixamorigRightHandIndex1)
//       bones.mixamorigRightHandIndex1.rotation.z = Math.PI / 4;
//     if (bones.mixamorigRightHandIndex2)
//       bones.mixamorigRightHandIndex2.rotation.z = Math.PI / 3;
//     if (bones.mixamorigRightHandIndex3)
//       bones.mixamorigRightHandIndex3.rotation.z = Math.PI / 3;

//     if (bones.mixamorigRightHandMiddle1)
//       bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 4;
//     if (bones.mixamorigRightHandMiddle2)
//       bones.mixamorigRightHandMiddle2.rotation.z = Math.PI / 3;
//     if (bones.mixamorigRightHandMiddle3)
//       bones.mixamorigRightHandMiddle3.rotation.z = Math.PI / 3;

//     if (bones.mixamorigRightHandRing1)
//       bones.mixamorigRightHandRing1.rotation.z = Math.PI / 4;
//     if (bones.mixamorigRightHandRing2)
//       bones.mixamorigRightHandRing2.rotation.z = Math.PI / 3;
//     if (bones.mixamorigRightHandRing3)
//       bones.mixamorigRightHandRing3.rotation.z = Math.PI / 3;

//     if (bones.mixamorigRightHandPinky1)
//       bones.mixamorigRightHandPinky1.rotation.z = Math.PI / 4;
//     if (bones.mixamorigRightHandPinky2)
//       bones.mixamorigRightHandPinky2.rotation.z = Math.PI / 3;
//     if (bones.mixamorigRightHandPinky3)
//       bones.mixamorigRightHandPinky3.rotation.z = Math.PI / 3;

//     // Curve thumb to meet fingers
//     if (bones.mixamorigRightHandThumb1)
//       bones.mixamorigRightHandThumb1.rotation.x = Math.PI / 4;
//     if (bones.mixamorigRightHandThumb2)
//       bones.mixamorigRightHandThumb2.rotation.y = -Math.PI / 6;
//     if (bones.mixamorigRightHandThumb3)
//       bones.mixamorigRightHandThumb3.rotation.y = -Math.PI / 6;

//     // Hand positioning
//     if (bones.mixamorigRightHand)
//       bones.mixamorigRightHand.rotation.x = Math.PI / 8;
//     if (bones.mixamorigRightForeArm)
//       bones.mixamorigRightForeArm.rotation.z = Math.PI / 6;
//     if (bones.mixamorigRightArm)
//       bones.mixamorigRightArm.rotation.x = -Math.PI / 8;
//   }, 100);

//   // Reset to neutral after delay
//   setTimeout(() => {
//     resetToNeutral();
//   }, 500);
// }

// // Additional animation functions for other letters
// function animateD() {
//   console.log("🔤 Starting D animation");

//   if (!currentModel || !currentModel.traverse) {
//     console.error("❌ Model not ready for D animation");
//     return;
//   }

//   const bones = {};
//   currentModel.traverse((child) => {
//     if (child.isBone) {
//       bones[child.name] = child;
//     }
//   });

//   // D hand gesture - pointing index finger
//   setTimeout(() => {
//     // Right hand D position
//     if (bones.mixamorigRightHandIndex1)
//       bones.mixamorigRightHandIndex1.rotation.z = Math.PI / 4.5;
//     if (bones.mixamorigRightHandIndex2)
//       bones.mixamorigRightHandIndex2.rotation.z = Math.PI / 4.5;
//     if (bones.mixamorigRightHandIndex3)
//       bones.mixamorigRightHandIndex3.rotation.z = Math.PI / 4.5;

//     if (bones.mixamorigRightHandMiddle1)
//       bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 1.5;
//     if (bones.mixamorigRightHandMiddle2)
//       bones.mixamorigRightHandMiddle2.rotation.z = Math.PI / 1.5;
//     if (bones.mixamorigRightHandMiddle3)
//       bones.mixamorigRightHandMiddle3.rotation.z = Math.PI / 1.5;

//     if (bones.mixamorigRightHandThumb1) {
//       bones.mixamorigRightHandThumb1.rotation.x = Math.PI / 3;
//       bones.mixamorigRightHandThumb1.rotation.y = Math.PI / 3;
//     }

//     if (bones.mixamorigRightHand) {
//       bones.mixamorigRightHand.rotation.z = -Math.PI / 7.5;
//       bones.mixamorigRightHand.rotation.y = Math.PI / 6;
//     }

//     if (bones.mixamorigRightArm) {
//       bones.mixamorigRightArm.rotation.x = -Math.PI / 6.5;
//       bones.mixamorigRightArm.rotation.z = Math.PI / 2.7;
//     }
//   }, 100);

//   // Reset to neutral after delay
//   setTimeout(() => {
//     resetToNeutral();
//   }, 500);
// }

// function animateF() {
//   console.log("🔤 Starting F animation");

//   if (!currentModel || !currentModel.traverse) {
//     console.error("❌ Model not ready for F animation");
//     return;
//   }

//   const bones = {};
//   currentModel.traverse((child) => {
//     if (child.isBone) {
//       bones[child.name] = child;
//     }
//   });

//   // F hand gesture - three fingers up, thumb and index touching
//   setTimeout(() => {
//     // Right hand F position
//     if (bones.mixamorigRightHandRing1)
//       bones.mixamorigRightHandRing1.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandRing2)
//       bones.mixamorigRightHandRing2.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandRing3)
//       bones.mixamorigRightHandRing3.rotation.z = Math.PI / 2;

//     if (bones.mixamorigRightHandPinky1)
//       bones.mixamorigRightHandPinky1.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandPinky2)
//       bones.mixamorigRightHandPinky2.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandPinky3)
//       bones.mixamorigRightHandPinky3.rotation.z = Math.PI / 2;

//     if (bones.mixamorigRightHandThumb2)
//       bones.mixamorigRightHandThumb2.rotation.y = -Math.PI / 2.5;
//     if (bones.mixamorigRightHandThumb3)
//       bones.mixamorigRightHandThumb3.rotation.y = -Math.PI / 2.5;

//     if (bones.mixamorigRightHand) {
//       bones.mixamorigRightHand.rotation.z = Math.PI / 4;
//       bones.mixamorigRightHand.rotation.x = Math.PI / 18;
//     }

//     if (bones.mixamorigRightForeArm)
//       bones.mixamorigRightForeArm.rotation.z = Math.PI / 9;
//   }, 100);

//   // Reset to neutral after delay
//   setTimeout(() => {
//     resetToNeutral();
//   }, 500);
// }

// function animateI() {
//   console.log("🔤 Starting I animation");

//   if (!currentModel || !currentModel.traverse) {
//     console.error("❌ Model not ready for I animation");
//     return;
//   }

//   const bones = {};
//   currentModel.traverse((child) => {
//     if (child.isBone) {
//       bones[child.name] = child;
//     }
//   });

//   // I hand gesture - pinky finger extended
//   setTimeout(() => {
//     // Right hand I position - close fingers, extend pinky
//     if (bones.mixamorigRightHandMiddle1)
//       bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandMiddle2)
//       bones.mixamorigRightHandMiddle2.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandMiddle3)
//       bones.mixamorigRightHandMiddle3.rotation.z = Math.PI / 2;

//     if (bones.mixamorigRightHandRing1)
//       bones.mixamorigRightHandRing1.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandRing2)
//       bones.mixamorigRightHandRing2.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandRing3)
//       bones.mixamorigRightHandRing3.rotation.z = Math.PI / 2;

//     if (bones.mixamorigRightHandThumb2)
//       bones.mixamorigRightHandThumb2.rotation.y = -Math.PI / 2.5;
//     if (bones.mixamorigRightHandThumb3)
//       bones.mixamorigRightHandThumb3.rotation.y = -Math.PI / 2.5;

//     if (bones.mixamorigRightHand) {
//       bones.mixamorigRightHand.rotation.x = -Math.PI / 2;
//       bones.mixamorigRightHand.rotation.z = Math.PI / 12;
//     }

//     if (bones.mixamorigRightForeArm) {
//       bones.mixamorigRightForeArm.rotation.z = Math.PI / 6;
//       bones.mixamorigRightForeArm.rotation.x = -Math.PI / 36;
//     }

//     if (bones.mixamorigRightArm)
//       bones.mixamorigRightArm.rotation.x = -Math.PI / 13;
//   }, 100);

//   // Reset to neutral after delay
//   setTimeout(() => {
//     resetToNeutral();
//   }, 500);
// }

// function animateU() {
//   console.log("🔤 Starting U animation");

//   if (!currentModel || !currentModel.traverse) {
//     console.error("❌ Model not ready for U animation");
//     return;
//   }

//   const bones = {};
//   currentModel.traverse((child) => {
//     if (child.isBone) {
//       bones[child.name] = child;
//     }
//   });

//   // U hand gesture - two fingers up together
//   setTimeout(() => {
//     // Right hand U position
//     if (bones.mixamorigRightHandIndex1)
//       bones.mixamorigRightHandIndex1.rotation.z = Math.PI / 4.5;
//     if (bones.mixamorigRightHandIndex2)
//       bones.mixamorigRightHandIndex2.rotation.z = Math.PI / 4.5;
//     if (bones.mixamorigRightHandIndex3)
//       bones.mixamorigRightHandIndex3.rotation.z = Math.PI / 4.5;

//     if (bones.mixamorigRightHandMiddle1)
//       bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandMiddle2)
//       bones.mixamorigRightHandMiddle2.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandMiddle3)
//       bones.mixamorigRightHandMiddle3.rotation.z = Math.PI / 2;

//     if (bones.mixamorigRightHandRing1)
//       bones.mixamorigRightHandRing1.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandPinky1)
//       bones.mixamorigRightHandPinky1.rotation.z = Math.PI / 2;

//     if (bones.mixamorigRightHandThumb1) {
//       bones.mixamorigRightHandThumb1.rotation.x = Math.PI / 3;
//       bones.mixamorigRightHandThumb1.rotation.y = Math.PI / 3;
//     }

//     if (bones.mixamorigRightHand)
//       bones.mixamorigRightHand.rotation.x = -Math.PI;

//     if (bones.mixamorigRightForeArm) {
//       bones.mixamorigRightForeArm.rotation.x = Math.PI / 7;
//       bones.mixamorigRightForeArm.rotation.z = Math.PI / 7;
//     }

//     if (bones.mixamorigRightArm)
//       bones.mixamorigRightArm.rotation.x = -Math.PI / 4;
//   }, 100);

//   // Reset to neutral after delay
//   setTimeout(() => {
//     resetToNeutral();
//   }, 500);
// }

// function animateY() {
//   console.log("🔤 Starting Y animation");

//   if (!currentModel || !currentModel.traverse) {
//     console.error("❌ Model not ready for Y animation");
//     return;
//   }

//   const bones = {};
//   currentModel.traverse((child) => {
//     if (child.isBone) {
//       bones[child.name] = child;
//     }
//   });

//   // Y hand gesture - thumb and pinky extended
//   setTimeout(() => {
//     // Right hand Y position
//     if (bones.mixamorigRightHandMiddle1)
//       bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 1.5;
//     if (bones.mixamorigRightHandMiddle2)
//       bones.mixamorigRightHandMiddle2.rotation.z = Math.PI / 1.5;
//     if (bones.mixamorigRightHandMiddle3)
//       bones.mixamorigRightHandMiddle3.rotation.z = Math.PI / 1.5;

//     if (bones.mixamorigRightHandRing1)
//       bones.mixamorigRightHandRing1.rotation.z = Math.PI / 1.6;
//     if (bones.mixamorigRightHandRing2)
//       bones.mixamorigRightHandRing2.rotation.z = Math.PI / 1.6;
//     if (bones.mixamorigRightHandRing3)
//       bones.mixamorigRightHandRing3.rotation.z = Math.PI / 1.6;

//     if (bones.mixamorigRightHandThumb2)
//       bones.mixamorigRightHandThumb2.rotation.y = -Math.PI / 2.5;
//     if (bones.mixamorigRightHandThumb3)
//       bones.mixamorigRightHandThumb3.rotation.y = -Math.PI / 2.5;

//     if (bones.mixamorigRightHand) {
//       bones.mixamorigRightHand.rotation.z = Math.PI / 2.5;
//       bones.mixamorigRightHand.rotation.x = -Math.PI / 8;
//     }

//     if (bones.mixamorigRightForeArm) {
//       bones.mixamorigRightForeArm.rotation.z = Math.PI / 15;
//       bones.mixamorigRightForeArm.rotation.x = -Math.PI / 10;
//     }

//     if (bones.mixamorigRightArm) {
//       bones.mixamorigRightArm.rotation.y = Math.PI / 33;
//       bones.mixamorigRightArm.rotation.z = Math.PI / 2.2;
//     }
//   }, 100);

//   // Reset to neutral after delay
//   setTimeout(() => {
//     resetToNeutral();
//   }, 500);
// }

// // Word animation functions
// function animateHOME() {
//   console.log("🏠 Starting HOME animation");

//   if (!currentModel) {
//     console.error("❌ Model not ready for HOME animation");
//     return;
//   }

//   const bones = {};
//   currentModel.traverse((child) => {
//     if (child.isBone) {
//       bones[child.name] = child;
//     }
//   });

//   // HOME gesture - hand to mouth then outward
//   setTimeout(() => {
//     // Position hand near mouth
//     if (bones.mixamorigRightHandThumb2)
//       bones.mixamorigRightHandThumb2.rotation.y = -Math.PI / 3;
//     if (bones.mixamorigRightHandThumb3)
//       bones.mixamorigRightHandThumb3.rotation.y = -Math.PI / 3;

//     if (bones.mixamorigRightHand)
//       bones.mixamorigRightHand.rotation.x = Math.PI / 4;
//     if (bones.mixamorigRightForeArm) {
//       bones.mixamorigRightForeArm.rotation.x = Math.PI / 3;
//       bones.mixamorigRightForeArm.rotation.z = Math.PI / 6;
//     }
//     if (bones.mixamorigRightArm)
//       bones.mixamorigRightArm.rotation.x = -Math.PI / 2;
//   }, 100);

//   // Move outward
//   setTimeout(() => {
//     if (bones.mixamorigRightForeArm) {
//       bones.mixamorigRightForeArm.rotation.x = Math.PI / 6;
//       bones.mixamorigRightForeArm.rotation.z = Math.PI / 4;
//     }
//     if (bones.mixamorigRightArm)
//       bones.mixamorigRightArm.rotation.x = -Math.PI / 4;
//   }, 300);

//   // Reset to neutral
//   setTimeout(() => {
//     resetToNeutral();
//   }, 600);
// }

// function animateYOU() {
//   console.log("👆 Starting YOU animation");

//   if (!currentModel) {
//     console.error("❌ Model not ready for YOU animation");
//     return;
//   }

//   const bones = {};
//   currentModel.traverse((child) => {
//     if (child.isBone) {
//       bones[child.name] = child;
//     }
//   });

//   // YOU gesture - pointing directly forward
//   setTimeout(() => {
//     // Extend index finger
//     if (bones.mixamorigRightHandIndex1)
//       bones.mixamorigRightHandIndex1.rotation.z = 0;
//     if (bones.mixamorigRightHandIndex2)
//       bones.mixamorigRightHandIndex2.rotation.z = 0;
//     if (bones.mixamorigRightHandIndex3)
//       bones.mixamorigRightHandIndex3.rotation.z = 0;

//     // Close other fingers
//     if (bones.mixamorigRightHandMiddle1)
//       bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandRing1)
//       bones.mixamorigRightHandRing1.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHandPinky1)
//       bones.mixamorigRightHandPinky1.rotation.z = Math.PI / 2;

//     // Point forward
//     if (bones.mixamorigRightHand) bones.mixamorigRightHand.rotation.x = 0;
//     if (bones.mixamorigRightForeArm)
//       bones.mixamorigRightForeArm.rotation.z = Math.PI / 4;
//     if (bones.mixamorigRightArm)
//       bones.mixamorigRightArm.rotation.x = -Math.PI / 4;
//   }, 100);

//   // Reset to neutral
//   setTimeout(() => {
//     resetToNeutral();
//   }, 500);
// }

// function animateTIME() {
//   console.log("⏰ Starting TIME animation");

//   if (!currentModel) {
//     console.error("❌ Model not ready for TIME animation");
//     return;
//   }

//   const bones = {};
//   currentModel.traverse((child) => {
//     if (child.isBone) {
//       bones[child.name] = child;
//     }
//   });

//   // TIME gesture - tapping wrist
//   setTimeout(() => {
//     // Position left hand as watch
//     if (bones.mixamorigLeftHand)
//       bones.mixamorigLeftHand.rotation.x = Math.PI / 2;
//     if (bones.mixamorigLeftForeArm)
//       bones.mixamorigLeftForeArm.rotation.z = -Math.PI / 4;

//     // Right hand tapping motion
//     if (bones.mixamorigRightHandIndex1)
//       bones.mixamorigRightHandIndex1.rotation.z = 0;
//     if (bones.mixamorigRightHand)
//       bones.mixamorigRightHand.rotation.x = -Math.PI / 4;
//     if (bones.mixamorigRightForeArm) {
//       bones.mixamorigRightForeArm.rotation.x = Math.PI / 4;
//       bones.mixamorigRightForeArm.rotation.z = -Math.PI / 6;
//     }
//     if (bones.mixamorigRightArm)
//       bones.mixamorigRightArm.rotation.x = -Math.PI / 3;
//   }, 100);

//   // Reset to neutral
//   setTimeout(() => {
//     resetToNeutral();
//   }, 500);
// }

// function animatePERSON() {
//   console.log("👤 Starting PERSON animation");

//   if (!currentModel) {
//     console.error("❌ Model not ready for PERSON animation");
//     return;
//   }

//   const bones = {};
//   currentModel.traverse((child) => {
//     if (child.isBone) {
//       bones[child.name] = child;
//     }
//   });

//   // PERSON gesture - both index fingers down
//   setTimeout(() => {
//     // Right hand
//     if (bones.mixamorigRightHandIndex1)
//       bones.mixamorigRightHandIndex1.rotation.z = 0;
//     if (bones.mixamorigRightHandMiddle1)
//       bones.mixamorigRightHandMiddle1.rotation.z = Math.PI / 2;
//     if (bones.mixamorigRightHand)
//       bones.mixamorigRightHand.rotation.x = Math.PI / 2;
//     if (bones.mixamorigRightForeArm)
//       bones.mixamorigRightForeArm.rotation.z = Math.PI / 6;

//     // Left hand
//     if (bones.mixamorigLeftHandIndex1)
//       bones.mixamorigLeftHandIndex1.rotation.z = 0;
//     if (bones.mixamorigLeftHandMiddle1)
//       bones.mixamorigLeftHandMiddle1.rotation.z = -Math.PI / 2;
//     if (bones.mixamorigLeftHand)
//       bones.mixamorigLeftHand.rotation.x = Math.PI / 2;
//     if (bones.mixamorigLeftForeArm)
//       bones.mixamorigLeftForeArm.rotation.z = -Math.PI / 6;
//   }, 100);

//   // Reset to neutral
//   setTimeout(() => {
//     resetToNeutral();
//   }, 500);
// }

// // Text animation function
// function animateText(text) {
//   if (!text || !text.trim()) {
//     console.log("📝 No text to animate");
//     return;
//   }

//   const cleanText = text.trim().toUpperCase();
//   console.log("🎬 Animating text:", cleanText);

//   // Split into words
//   const words = cleanText.split(/\s+/);
//   if (words.length === 0) return;

//   const firstWord = words[0];

//   // Check for word animations first (priority)
//   if (firstWord === "HOME") {
//     animateHOME();
//     return;
//   } else if (firstWord === "YOU") {
//     animateYOU();
//     return;
//   } else if (firstWord === "TIME") {
//     animateTIME();
//     return;
//   } else if (firstWord === "PERSON") {
//     animatePERSON();
//     return;
//   }

//   // Fall back to letter-by-letter animation
//   console.log("🔤 Spelling out word:", firstWord);

//   for (let i = 0; i < Math.min(firstWord.length, 4); i++) {
//     // Limit to 4 letters for speed
//     const letter = firstWord[i];

//     setTimeout(() => {
//       console.log("🔤 Animating letter:", letter);
//       showOverlay(`Letter: ${letter}`);

//       // Use specific animations for ALL available letters
//       switch (letter) {
//         case "A":
//           animateA();
//           break;
//         case "B":
//           animateB();
//           break;
//         case "C":
//           animateA();
//           break; // Use A for C (similar hand shape)
//         case "D":
//           animateD();
//           break;
//         case "E":
//           animateE();
//           break;
//         case "F":
//           animateF();
//           break;
//         case "G":
//           animateA();
//           break; // Use A for G (similar hand shape)
//         case "H":
//           animateH();
//           break;
//         case "I":
//           animateI();
//           break;
//         case "J":
//           animateI();
//           break; // Use I for J (similar)
//         case "K":
//           animateH();
//           break; // Use H for K (two fingers)
//         case "L":
//           animateL();
//           break;
//         case "M":
//           animateB();
//           break; // Use B for M (closed fist)
//         case "N":
//           animateB();
//           break; // Use B for N (similar)
//         case "O":
//           animateO();
//           break;
//         case "P":
//           animateD();
//           break; // Use D for P (similar finger position)
//         case "Q":
//           animateO();
//           break; // Use O for Q (similar circular shape)
//         case "R":
//           animateH();
//           break; // Use H for R (crossed fingers)
//         case "S":
//           animateA();
//           break; // Use A for S (closed fist)
//         case "T":
//           animateD();
//           break; // Use D for T (thumb between fingers)
//         case "U":
//           animateU();
//           break;
//         case "V":
//           animateD();
//           break; // Use D for V (two fingers up)
//         case "W":
//           animateE();
//           break; // Use E for W (three fingers)
//         case "X":
//           animateA();
//           break; // Use A for X (curved finger)
//         case "Y":
//           animateY();
//           break;
//         case "Z":
//           animateD();
//           break; // Use D for Z (pointing gesture)
//         default:
//           console.log("🔤 Unknown letter:", letter, "- using A gesture");
//           animateA();
//           break;
//       }
//     }, i * 600); // 600ms delay between letters
//   }
// }

// // Message listener for extension communication
// function setupMessageListener() {
//   try {
//     // Handle messages from extension
//     window.addEventListener("message", (event) => {
//       if (!event.data || !event.data.action) return;

//       const { action, data } = event.data;

//       switch (action) {
//         case "animateText":
//           if (data && data.text) {
//             console.log("📨 Received text to animate:", data.text);
//             animateText(data.text);
//           }
//           break;
//         case "gestureText":
//           // Enhanced real-time gesture synchronization with precise timing
//           if (data && data.text) {
//             console.log("🎯 Enhanced real-time gesture:", data.text);
//             console.log("📊 Gesture data:", data);

//             // Pass complete gesture data for precise timing
//             animateRealTimeText(data.text, data.duration || 3, data);
//           }
//           break;
//         case "gestureStop":
//           // Stop current gesture animation
//           console.log("🛑 Stopping gesture animation");
//           ref.animations = [];
//           ref.pending = false;
//           applyDefaultPose();
//           break;
//         case "subtitleData":
//           // Handle subtitle data for initialization
//           if (data && data.subtitles) {
//             console.log(
//               "📝 Subtitle data received:",
//               data.subtitles.length,
//               "entries"
//             );
//             // Load alphabet and word animations if needed
//             loadAnimationLibraries();
//           }
//           break;
//         case "testAnimation":
//           console.log("🧪 Test animation triggered");
//           animateA();
//           break;
//         case "updateStatus":
//           if (data) {
//             updateStatus(data.message || "Ready", data.connected || false);
//           }
//           break;
//         default:
//           console.log("❓ Unknown action:", action);
//       }
//     });

//     console.log("✅ Message listener setup complete");
//   } catch (error) {
//     console.error("❌ Error setting up message listener:", error);
//   }
// }

// // Listen for messages from background script via chrome.runtime
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log("📨 Received from background:", request.action);
  
//   if (request.action === "gestureText" && request.data) {
//     console.log("🎭 Animating gesture:", request.data.text);
//     animateRealTimeText(
//       request.data.text.toUpperCase(),
//       request.data.duration || 3,
//       request.data
//     );
//     showOverlay(`Gesture: ${request.data.text}`);
//     if (!ref.pending) {
//       ref.pending = true;
//       ref.animate();
//     }
//   } else if (request.action === "gestureStop") {
//     ref.animations = [];
//     ref.pending = false;
//     applyDefaultPose();
//   } else if (request.action === "subtitleData") {
//     console.log("📝 Subtitle data received:", request.subtitles?.length);
//   }
  
//   sendResponse({ success: true });
//   return true;
// });

// // Load animation libraries dynamically
// function loadAnimationLibraries() {
//   try {
//     // Load alphabet animations from the main app
//     if (window.parent && window.parent.alphabets) {
//       window.alphabets = window.parent.alphabets;
//       console.log("✅ Alphabet animations loaded from parent");
//     }

//     // Load word animations from the main app
//     if (window.parent && window.parent.words) {
//       window.words = window.parent.words;
//       console.log("✅ Word animations loaded from parent");
//     }

//     // Fallback: try to load from global scope
//     if (!window.alphabets && typeof alphabets !== "undefined") {
//       window.alphabets = alphabets;
//     }

//     if (!window.words && typeof words !== "undefined") {
//       window.words = words;
//     }

//     console.log("📚 Animation libraries check complete");
//   } catch (error) {
//     console.warn("⚠️ Could not load animation libraries:", error.message);
//   }
// }

// // Make window draggable
// function makeWindowDraggable() {
//   let isDragging = false;
//   let currentX;
//   let currentY;
//   let initialX;
//   let initialY;
//   let xOffset = 0;
//   let yOffset = 0;

//   const dragElement = document.querySelector(".drag-handle") || document.body;

//   function dragStart(e) {
//     if (e.type === "touchstart") {
//       initialX = e.touches[0].clientX - xOffset;
//       initialY = e.touches[0].clientY - yOffset;
//     } else {
//       initialX = e.clientX - xOffset;
//       initialY = e.clientY - yOffset;
//     }

//     if (e.target === dragElement || dragElement.contains(e.target)) {
//       isDragging = true;
//     }
//   }

//   function dragEnd(e) {
//     initialX = currentX;
//     initialY = currentY;
//     isDragging = false;
//   }

//   function drag(e) {
//     if (isDragging) {
//       e.preventDefault();

//       if (e.type === "touchmove") {
//         currentX = e.touches[0].clientX - initialX;
//         currentY = e.touches[0].clientY - initialY;
//       } else {
//         currentX = e.clientX - initialX;
//         currentY = e.clientY - initialY;
//       }

//       xOffset = currentX;
//       yOffset = currentY;

//       document.body.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
//     }
//   }

//   document.addEventListener("mousedown", dragStart);
//   document.addEventListener("mouseup", dragEnd);
//   document.addEventListener("mousemove", drag);

//   document.addEventListener("touchstart", dragStart);
//   document.addEventListener("touchend", dragEnd);
//   document.addEventListener("touchmove", drag);
// }

// // Demo subtitles data (same as content script)
// function getDemoSubtitles() {
//   return [
//     { start: 0, end: 2.5, text: "HELLO" },
//     { start: 2.5, end: 5.0, text: "WORLD" },
//     { start: 5.0, end: 9.0, text: "WHAZZUP" },
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

// // Setup test button
// function setupTestButton() {
//   if (testBtn) {
//     testBtn.addEventListener("click", () => {
//       console.log("🧪 Test button clicked - Running Demo Subtitles");

//       if (!ref.avatar) {
//         console.error("❌ Avatar not loaded for test");
//         showOverlay("Error: Avatar not loaded");
//         return;
//       }

//       // Load demo subtitles
//       const demoSubtitles = getDemoSubtitles();
//       console.log("� Loaded", demoSubtitles.length, "demo subtitle entries");

//       // Start demo animation sequence
//       let currentSubtitleIndex = 0;
//       let demoInterval;

//       const runNextSubtitle = () => {
//         if (currentSubtitleIndex >= demoSubtitles.length) {
//           console.log("🏁 Demo animation sequence completed");
//           showOverlay("Demo Complete!");
//           clearInterval(demoInterval);
//           return;
//         }

//         const subtitle = demoSubtitles[currentSubtitleIndex];
//         console.log(
//           `🎭 Demo subtitle ${currentSubtitleIndex + 1}/${
//             demoSubtitles.length
//           }: "${subtitle.text}"`
//         );

//         // Create gesture data similar to content script
//         const gestureData = {
//           text: subtitle.text,
//           duration: subtitle.end - subtitle.start,
//           totalDuration: subtitle.end - subtitle.start,
//           startTime: subtitle.start,
//           endTime: subtitle.end,
//           currentTime: subtitle.start,
//           progressInSubtitle: 0,
//           progressPercentage: 0,
//           playbackRate: 1.0,
//           timestamp: Date.now(),
//           videoId: "demo",
//           urgent: false,
//           isDemo: true,
//         };

//         // Process the text animation
//         processTextAnimation(subtitle.text.toUpperCase());
//         showOverlay(
//           `Demo: ${subtitle.text} (${currentSubtitleIndex + 1}/${
//             demoSubtitles.length
//           })`
//         );

//         // Start animation if not already running
//         if (!ref.pending) {
//           ref.pending = true;
//           ref.animate();
//         }

//         currentSubtitleIndex++;
//       };

//       // Clear existing animations
//       ref.animations = [];
//       ref.pending = false;
//       ref.flag = false;

//       // Start the demo sequence
//       showOverlay("Starting Demo Animation...");

//       // Run first subtitle immediately
//       runNextSubtitle();

//       // Set interval to run remaining subtitles
//       demoInterval = setInterval(() => {
//         runNextSubtitle();
//       }, 3000); // 3 seconds between each subtitle for demo purposes
//     });
//     console.log("✅ Test button setup complete - will run demo subtitles");
//   }
// }

// // Start initialization when page loads
// document.addEventListener("DOMContentLoaded", () => {
//   console.log("🚀 DOM loaded, initializing gesture window...");
//   if (typeof window.initGestureWindow === "function") {
//     window.initGestureWindow();
//   } else {
//     console.error("❌ initGestureWindow function not found");
//   }
// });

// // Fallback initialization
// if (
//   document.readyState === "complete" ||
//   document.readyState === "interactive"
// ) {
//   console.log("🚀 Document ready, initializing gesture window...");
//   setTimeout(() => {
//     if (typeof window.initGestureWindow === "function") {
//       window.initGestureWindow();
//     }
//   }, 100);
// }

// // Enhanced message handling for fallback communication
// window.addEventListener("message", (event) => {
//   try {
//     if (event.data && event.data.type === "GESTURE_GURU_MESSAGE") {
//       console.log("📨 Received direct message:", event.data);

//       switch (event.data.action) {
//         case "gestureText":
//           if (event.data.data && event.data.data.text) {
//             console.log(
//               "🎭 Processing direct gesture text:",
//               event.data.data.text
//             );
//             console.log("📊 Direct gesture data:", event.data.data);

//             // Use enhanced animation with timing data
//             animateRealTimeText(
//               event.data.data.text.toUpperCase(),
//               event.data.data.duration || 3,
//               event.data.data
//             );

//             showOverlay(`Gesture: ${event.data.data.text}`);

//             if (!ref.pending) {
//               ref.pending = true;
//               ref.animate();
//             }
//           }
//           break;

//         case "gestureStop":
//           console.log("⏹️ Stopping current gesture");
//           ref.animations = [];
//           ref.pending = false;
//           applyDefaultPose();
//           showOverlay("Gesture stopped");
//           break;

//         case "videoPlayback":
//           const isPlaying = event.data.isPlaying;
//           console.log(`📹 Video ${isPlaying ? "playing" : "paused"}`);
//           updateStatus(isPlaying ? "Playing" : "Paused", isPlaying);

//           if (!isPlaying) {
//             // Pause current gestures
//             ref.pending = false;
//           }
//           break;

//         case "subtitleData":
//           console.log(
//             "📝 Received subtitle data:",
//             event.data.subtitles?.length || 0,
//             "entries"
//           );
//           break;
//       }
//     }
//   } catch (error) {
//     console.error("❌ Error handling direct message:", error);
//   }
// });

// // Check localStorage for gesture data (additional fallback)
// function checkLocalStorageForGestures() {
//   try {
//     const gestureData = localStorage.getItem("gestureGuru_currentText");
//     const lastUpdate = localStorage.getItem("gestureGuru_lastUpdate");

//     if (gestureData && lastUpdate) {
//       const updateTime = parseInt(lastUpdate);
//       const now = Date.now();

//       // Only process if data is recent (within 5 seconds)
//       if (now - updateTime < 5000) {
//         const data = JSON.parse(gestureData);
//         if (data && data.data && data.data.text) {
//           console.log(
//             "💾 Processing gesture from localStorage:",
//             data.data.text
//           );
//           processTextAnimation(data.data.text.toUpperCase());
//           showOverlay(`Gesture: ${data.data.text}`);

//           if (!ref.pending) {
//             ref.pending = true;
//             ref.animate();
//           }

//           // Clear processed data
//           localStorage.removeItem("gestureGuru_currentText");
//           localStorage.removeItem("gestureGuru_lastUpdate");
//         }
//       }
//     }
//   } catch (error) {
//     console.log("💾 localStorage check failed:", error.message);
//   }
// }

// // Periodically check localStorage for gesture updates
// setInterval(checkLocalStorageForGestures, 1000);

// // Notify parent window that gesture window is ready
// window.addEventListener("load", () => {
//   try {
//     if (window.opener && !window.opener.closed) {
//       window.opener.postMessage(
//         {
//           type: "GESTURE_GURU_MESSAGE",
//           action: "gestureWindowReady",
//           source: "gesture_window",
//         },
//         "*"
//       );
//     }

//     // Also notify any parent frames
//     if (window.parent && window.parent !== window) {
//       window.parent.postMessage(
//         {
//           type: "GESTURE_GURU_MESSAGE",
//           action: "gestureWindowReady",
//           source: "gesture_window",
//         },
//         "*"
//       );
//     }
//   } catch (error) {
//     console.log("📤 Could not notify parent of readiness:", error.message);
//   }
// });

// console.log("📄 Gesture window script loaded successfully");
