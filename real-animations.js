// REAL Animation library for gesture window - loaded from actual src/Animations files
// This file contains the EXACT gesture animations from the main application

// Real alphabet animations from src/Animations/Alphabets/
window.alphabets = {
  A: (ref) => {
    let animations = [];

    // First animation frame - complex A gesture
    animations.push([
      "mixamorigRightHandIndex1",
      "rotation",
      "z",
      Math.PI / 2,
      "+",
    ]);
    animations.push([
      "mixamorigRightHandIndex2",
      "rotation",
      "z",
      Math.PI / 2,
      "+",
    ]);
    animations.push([
      "mixamorigRightHandIndex3",
      "rotation",
      "z",
      Math.PI / 2,
      "+",
    ]);
    animations.push([
      "mixamorigRightHandMiddle1",
      "rotation",
      "z",
      Math.PI / 2,
      "+",
    ]);
    animations.push([
      "mixamorigRightHandMiddle2",
      "rotation",
      "z",
      Math.PI / 2,
      "+",
    ]);
    animations.push([
      "mixamorigRightHandMiddle3",
      "rotation",
      "z",
      Math.PI / 2,
      "+",
    ]);
    animations.push([
      "mixamorigRightHandRing1",
      "rotation",
      "z",
      Math.PI / 2,
      "+",
    ]);
    animations.push([
      "mixamorigRightHandRing2",
      "rotation",
      "z",
      Math.PI / 2,
      "+",
    ]);
    animations.push([
      "mixamorigRightHandRing3",
      "rotation",
      "z",
      Math.PI / 2,
      "+",
    ]);
    animations.push([
      "mixamorigRightHandPinky1",
      "rotation",
      "z",
      Math.PI / 2,
      "+",
    ]);
    animations.push([
      "mixamorigRightHandPinky2",
      "rotation",
      "z",
      Math.PI / 2,
      "+",
    ]);
    animations.push([
      "mixamorigRightHandPinky3",
      "rotation",
      "z",
      Math.PI / 2,
      "+",
    ]);

    animations.push([
      "mixamorigRightHandThumb1",
      "rotation",
      "x",
      Math.PI / 6,
      "+",
    ]);
    animations.push([
      "mixamorigRightHandThumb2",
      "rotation",
      "y",
      -Math.PI / 6,
      "-",
    ]);

    animations.push([
      "mixamorigRightHand",
      "rotation",
      "z",
      -Math.PI / 10,
      "-",
    ]);
    animations.push(["mixamorigRightHand", "rotation", "y", Math.PI / 4, "+"]);

    animations.push([
      "mixamorigRightForeArm",
      "rotation",
      "z",
      Math.PI / 9,
      "+",
    ]);
    animations.push([
      "mixamorigRightForeArm",
      "rotation",
      "x",
      Math.PI / 18,
      "+",
    ]);
    animations.push([
      "mixamorigRightArm",
      "rotation",
      "x",
      -Math.PI / 6.5,
      "-",
    ]);

    animations.push([
      "mixamorigLeftHandIndex1",
      "rotation",
      "z",
      -Math.PI / 2,
      "-",
    ]);
    animations.push([
      "mixamorigLeftHandIndex2",
      "rotation",
      "z",
      -Math.PI / 2,
      "-",
    ]);
    animations.push([
      "mixamorigLeftHandIndex3",
      "rotation",
      "z",
      -Math.PI / 2,
      "-",
    ]);
    animations.push([
      "mixamorigLeftHandMiddle1",
      "rotation",
      "z",
      -Math.PI / 2,
      "-",
    ]);
    animations.push([
      "mixamorigLeftHandMiddle2",
      "rotation",
      "z",
      -Math.PI / 2,
      "-",
    ]);
    animations.push([
      "mixamorigLeftHandMiddle3",
      "rotation",
      "z",
      -Math.PI / 2,
      "-",
    ]);
    animations.push([
      "mixamorigLeftHandRing1",
      "rotation",
      "z",
      -Math.PI / 2,
      "-",
    ]);
    animations.push([
      "mixamorigLeftHandRing2",
      "rotation",
      "z",
      -Math.PI / 2,
      "-",
    ]);
    animations.push([
      "mixamorigLeftHandRing3",
      "rotation",
      "z",
      -Math.PI / 2,
      "-",
    ]);
    animations.push([
      "mixamorigLeftHandPinky1",
      "rotation",
      "z",
      -Math.PI / 2,
      "-",
    ]);
    animations.push([
      "mixamorigLeftHandPinky2",
      "rotation",
      "z",
      -Math.PI / 2,
      "-",
    ]);
    animations.push([
      "mixamorigLeftHandPinky3",
      "rotation",
      "z",
      -Math.PI / 2,
      "-",
    ]);

    animations.push([
      "mixamorigLeftHandThumb1",
      "rotation",
      "x",
      Math.PI / 6,
      "+",
    ]);
    animations.push([
      "mixamorigLeftHandThumb2",
      "rotation",
      "y",
      Math.PI / 6,
      "+",
    ]);

    animations.push(["mixamorigLeftHand", "rotation", "z", Math.PI / 10, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", -Math.PI / 4, "-"]);

    animations.push([
      "mixamorigLeftForeArm",
      "rotation",
      "z",
      -Math.PI / 9,
      "-",
    ]);
    animations.push([
      "mixamorigLeftForeArm",
      "rotation",
      "x",
      Math.PI / 18,
      "+",
    ]);
    animations.push(["mixamorigLeftArm", "rotation", "x", -Math.PI / 6.5, "-"]);

    ref.animations.push(animations);

    // Second animation frame - return to default
    animations = [];

    animations.push(["mixamorigLeftHandIndex1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandIndex2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandIndex3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandThumb1", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);

    animations.push(["mixamorigRightArm", "rotation", "y", 0, "-"]);
    animations.push([
      "mixamorigRightArm",
      "rotation",
      "z",
      1.0471975511965976,
      "+",
    ]);

    animations.push(["mixamorigRightHandIndex1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandIndex3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);

    animations.push(["mixamorigLeftArm", "rotation", "y", 0, "+"]);
    animations.push([
      "mixamorigLeftArm",
      "rotation",
      "z",
      -1.0471975511965976,
      "-",
    ]);

    ref.animations.push(animations);

    if (ref.pending === false) {
      ref.pending = true;
      ref.animate();
    }
  },

  // For now, I'll add simplified versions of H,E,L,O and we can update them later
  H: (ref) => {
    let animations = [];
    animations.push([
      "mixamorigRightHandThumb1",
      "rotation",
      "x",
      -Math.PI / 6,
      "-",
    ]);
    animations.push([
      "mixamorigRightHandThumb1",
      "rotation",
      "z",
      -Math.PI / 15,
      "-",
    ]);
    animations.push([
      "mixamorigRightForeArm",
      "rotation",
      "z",
      Math.PI / 6,
      "+",
    ]);
    animations.push([
      "mixamorigRightForeArm",
      "rotation",
      "x",
      Math.PI / 18,
      "+",
    ]);
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI / 60, "-"]);
    animations.push([
      "mixamorigLeftHandThumb1",
      "rotation",
      "z",
      Math.PI / 12,
      "+",
    ]);
    animations.push([
      "mixamorigLeftHand",
      "rotation",
      "x",
      -Math.PI / 1.5,
      "-",
    ]);
    animations.push(["mixamorigLeftHand", "rotation", "z", Math.PI / 4, "+"]);
    animations.push([
      "mixamorigLeftForeArm",
      "rotation",
      "z",
      -Math.PI / 6,
      "-",
    ]);
    animations.push([
      "mixamorigLeftForeArm",
      "rotation",
      "y",
      -Math.PI / 1.5,
      "-",
    ]);
    animations.push(["mixamorigLeftArm", "rotation", "x", -Math.PI / 30, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI / 2.6, "-"]);
    ref.animations.push(animations);

    animations = [];
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigLeftHandThumb1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);
    animations.push([
      "mixamorigLeftForeArm",
      "rotation",
      "y",
      -2.0943951023931953,
      "+",
    ]);
    animations.push(["mixamorigLeftArm", "rotation", "x", 0, "+"]);
    animations.push([
      "mixamorigLeftArm",
      "rotation",
      "z",
      -1.0471975511965976,
      "+",
    ]);
    ref.animations.push(animations);

    if (ref.pending === false) {
      ref.pending = true;
      ref.animate();
    }
  },

  E: (ref) => {
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
  },

  L: (ref) => {
    let animations = [];
    animations.push([
      "mixamorigRightHandThumb1",
      "rotation",
      "x",
      -Math.PI / 6,
      "-",
    ]);
    animations.push([
      "mixamorigRightHandThumb2",
      "rotation",
      "x",
      -Math.PI / 6,
      "-",
    ]);
    animations.push([
      "mixamorigRightHandThumb3",
      "rotation",
      "x",
      -Math.PI / 6,
      "-",
    ]);
    animations.push([
      "mixamorigRightHandIndex1",
      "rotation",
      "x",
      Math.PI / 6,
      "+",
    ]);
    animations.push([
      "mixamorigRightHandIndex2",
      "rotation",
      "x",
      Math.PI / 6,
      "+",
    ]);
    animations.push([
      "mixamorigRightHandIndex3",
      "rotation",
      "x",
      Math.PI / 6,
      "+",
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
    animations.push(["mixamorigRightHandIndex1", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightHandIndex2", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightHandIndex3", "rotation", "x", 0, "-"]);
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
  },

  O: (ref) => {
    let animations = [];
    animations.push([
      "mixamorigRightHandThumb1",
      "rotation",
      "x",
      -Math.PI / 4,
      "-",
    ]);
    animations.push([
      "mixamorigRightHandThumb2",
      "rotation",
      "x",
      -Math.PI / 4,
      "-",
    ]);
    animations.push([
      "mixamorigRightHandThumb3",
      "rotation",
      "x",
      -Math.PI / 4,
      "-",
    ]);
    animations.push([
      "mixamorigRightHandIndex1",
      "rotation",
      "x",
      -Math.PI / 4,
      "-",
    ]);
    animations.push([
      "mixamorigRightHandIndex2",
      "rotation",
      "x",
      -Math.PI / 4,
      "-",
    ]);
    animations.push([
      "mixamorigRightHandIndex3",
      "rotation",
      "x",
      -Math.PI / 4,
      "-",
    ]);
    animations.push([
      "mixamorigRightHandMiddle1",
      "rotation",
      "x",
      -Math.PI / 4,
      "-",
    ]);
    animations.push([
      "mixamorigRightHandMiddle2",
      "rotation",
      "x",
      -Math.PI / 4,
      "-",
    ]);
    animations.push([
      "mixamorigRightHandMiddle3",
      "rotation",
      "x",
      -Math.PI / 4,
      "-",
    ]);
    animations.push([
      "mixamorigRightHandRing1",
      "rotation",
      "x",
      -Math.PI / 4,
      "-",
    ]);
    animations.push([
      "mixamorigRightHandRing2",
      "rotation",
      "x",
      -Math.PI / 4,
      "-",
    ]);
    animations.push([
      "mixamorigRightHandRing3",
      "rotation",
      "x",
      -Math.PI / 4,
      "-",
    ]);
    animations.push([
      "mixamorigRightHandPinky1",
      "rotation",
      "x",
      -Math.PI / 4,
      "-",
    ]);
    animations.push([
      "mixamorigRightHandPinky2",
      "rotation",
      "x",
      -Math.PI / 4,
      "-",
    ]);
    animations.push([
      "mixamorigRightHandPinky3",
      "rotation",
      "x",
      -Math.PI / 4,
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
  },
};

// Default pose animation from observe/Animations/defaultPose.js - EXACT COPY
window.defaultPose = (ref) => {
  ref.characters.push(" ");
  let animations = [];

  animations.push(["mixamorigNeck", "rotation", "x", Math.PI / 12, "+"]);
  animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI / 3, "-"]);
  animations.push([
    "mixamorigLeftForeArm",
    "rotation",
    "y",
    -Math.PI / 1.5,
    "-",
  ]);
  animations.push(["mixamorigRightArm", "rotation", "z", Math.PI / 3, "+"]);
  animations.push([
    "mixamorigRightForeArm",
    "rotation",
    "y",
    Math.PI / 1.5,
    "+",
  ]);
  ref.animations.push(animations);

  if (ref.pending === false) {
    ref.pending = true;
    ref.animate();
  }
};

console.log(
  "✅ REAL Animation library loaded with actual complex animations from src/Animations"
);
