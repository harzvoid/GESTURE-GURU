// Main animation loader - loads all real animations from src/Animations folder
// This replaces the old animations-library.js with actual imports

// Initialize the alphabets and words objects
window.alphabets = {};
window.words = {};

console.log("🔤 Loading real animations from src/Animations folder...");

// Load all alphabet animations
const alphabetLetters = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

// Load all word animations
const wordList = ["HOME", "PERSON", "TIME", "YOU"];

// Function to dynamically load alphabet animations
function loadAlphabetAnimations() {
  alphabetLetters.forEach((letter) => {
    if (window[letter] && typeof window[letter] === "function") {
      window.alphabets[letter] = window[letter];
      console.log(`✅ Loaded alphabet animation: ${letter}`);
    } else {
      console.warn(`⚠️ Alphabet animation not found: ${letter}`);
    }
  });
}

// Function to dynamically load word animations
function loadWordAnimations() {
  wordList.forEach((word) => {
    if (window[word] && typeof window[word] === "function") {
      window.words[word] = window[word];
      console.log(`✅ Loaded word animation: ${word}`);
    } else {
      console.warn(`⚠️ Word animation not found: ${word}`);
    }
  });
}

// Load animations after all scripts are loaded
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => {
    loadAlphabetAnimations();
    loadWordAnimations();

    console.log(`🎭 Animation loading complete!`);
    console.log(`📝 Alphabets loaded: ${Object.keys(window.alphabets).length}`);
    console.log(`📚 Words loaded: ${Object.keys(window.words).length}`);
    console.log(
      `🏠 Default pose loaded: ${
        typeof window.defaultPose === "function" ? "Yes" : "No"
      }`
    );
  }, 100); // Small delay to ensure all scripts are loaded
});

// Also try immediate loading for scripts loaded after DOM
function tryLoadAnimations() {
  if (typeof window.A === "function") {
    loadAlphabetAnimations();
    loadWordAnimations();
  }
}

// Export loading function for manual triggering
window.loadRealAnimations = tryLoadAnimations;
