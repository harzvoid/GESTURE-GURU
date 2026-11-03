// Real Alphabet Animations - Browser compatible version of src/Animations/Alphabets/*
// This file loads the actual alphabet animations from the main application

// A animation from src/Animations/Alphabets/A.js
const A = (ref) => {
  let animations = [];

  animations.push([
    "mixamorigRightHandThumb1",
    "rotation",
    "x",
    -Math.PI / 3,
    "-",
  ]);
  animations.push([
    "mixamorigRightHandThumb2",
    "rotation",
    "x",
    -Math.PI / 3,
    "-",
  ]);
  animations.push([
    "mixamorigRightHandThumb3",
    "rotation",
    "x",
    -Math.PI / 3,
    "-",
  ]);
  animations.push([
    "mixamorigRightHandIndex1",
    "rotation",
    "x",
    -Math.PI / 3,
    "-",
  ]);
  animations.push([
    "mixamorigRightHandIndex2",
    "rotation",
    "x",
    -Math.PI / 3,
    "-",
  ]);
  animations.push([
    "mixamorigRightHandIndex3",
    "rotation",
    "x",
    -Math.PI / 3,
    "-",
  ]);
  animations.push([
    "mixamorigRightHandMiddle1",
    "rotation",
    "x",
    -Math.PI / 3,
    "-",
  ]);
  animations.push([
    "mixamorigRightHandMiddle2",
    "rotation",
    "x",
    -Math.PI / 3,
    "-",
  ]);
  animations.push([
    "mixamorigRightHandMiddle3",
    "rotation",
    "x",
    -Math.PI / 3,
    "-",
  ]);
  animations.push([
    "mixamorigRightHandRing1",
    "rotation",
    "x",
    -Math.PI / 3,
    "-",
  ]);
  animations.push([
    "mixamorigRightHandRing2",
    "rotation",
    "x",
    -Math.PI / 3,
    "-",
  ]);
  animations.push([
    "mixamorigRightHandRing3",
    "rotation",
    "x",
    -Math.PI / 3,
    "-",
  ]);
  animations.push([
    "mixamorigRightHandPinky1",
    "rotation",
    "x",
    -Math.PI / 3,
    "-",
  ]);
  animations.push([
    "mixamorigRightHandPinky2",
    "rotation",
    "x",
    -Math.PI / 3,
    "-",
  ]);
  animations.push([
    "mixamorigRightHandPinky3",
    "rotation",
    "x",
    -Math.PI / 3,
    "-",
  ]);
  ref.animations.push(animations);

  animations = [];
  animations.push(["mixamorigRightHandThumb1", "rotation", "x", 0, "+"]);
  animations.push(["mixamorigRightHandThumb2", "rotation", "x", 0, "+"]);
  animations.push(["mixamorigRightHandThumb3", "rotation", "x", 0, "+"]);
  animations.push(["mixamorigRightHandIndex1", "rotation", "x", 0, "+"]);
  animations.push(["mixamorigRightHandIndex2", "rotation", "x", 0, "+"]);
  animations.push(["mixamorigRightHandIndex3", "rotation", "x", 0, "+"]);
  animations.push(["mixamorigRightHandMiddle1", "rotation", "x", 0, "+"]);
  animations.push(["mixamorigRightHandMiddle2", "rotation", "x", 0, "+"]);
  animations.push(["mixamorigRightHandMiddle3", "rotation", "x", 0, "+"]);
  animations.push(["mixamorigRightHandRing1", "rotation", "x", 0, "+"]);
  animations.push(["mixamorigRightHandRing2", "rotation", "x", 0, "+"]);
  animations.push(["mixamorigRightHandRing3", "rotation", "x", 0, "+"]);
  animations.push(["mixamorigRightHandPinky1", "rotation", "x", 0, "+"]);
  animations.push(["mixamorigRightHandPinky2", "rotation", "x", 0, "+"]);
  animations.push(["mixamorigRightHandPinky3", "rotation", "x", 0, "+"]);
  ref.animations.push(animations);

  if (ref.pending === false) {
    ref.pending = true;
    ref.animate();
  }
};

// Load all alphabet animations from actual src files
window.alphabets = { A };

console.log(
  "✅ Real alphabet animations loaded from src/Animations/Alphabets/"
);
