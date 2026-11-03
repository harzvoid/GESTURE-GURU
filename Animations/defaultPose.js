// Default pose function for Chrome extension (global scope)
function defaultPose(ref) {
  if (!ref.avatar) {
    console.warn("Avatar not loaded yet, cannot apply default pose");
    return;
  }

  console.log("🎭 Applying default pose...");

  // Add a character to track this animation
  if (ref.characters) {
    ref.characters.push(" ");
  }

  let animations = [];

  // Define the default pose animations with proper bone rotations
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

  // Reset arms to neutral position first, then apply pose for immediate positioning
  const leftArm = ref.avatar.getObjectByName("mixamorigLeftArm");
  const rightArm = ref.avatar.getObjectByName("mixamorigRightArm");
  const leftForeArm = ref.avatar.getObjectByName("mixamorigLeftForeArm");
  const rightForeArm = ref.avatar.getObjectByName("mixamorigRightForeArm");
  const neck = ref.avatar.getObjectByName("mixamorigNeck");

  // Apply immediate pose for instant positioning
  if (leftArm) {
    leftArm.rotation.x = 0;
    leftArm.rotation.y = 0;
    leftArm.rotation.z = -Math.PI / 3;
  }
  if (rightArm) {
    rightArm.rotation.x = 0;
    rightArm.rotation.y = 0;
    rightArm.rotation.z = Math.PI / 3;
  }
  if (leftForeArm) {
    leftForeArm.rotation.x = 0;
    leftForeArm.rotation.y = -Math.PI / 1.5;
    leftForeArm.rotation.z = 0;
  }
  if (rightForeArm) {
    rightForeArm.rotation.x = 0;
    rightForeArm.rotation.y = Math.PI / 1.5;
    rightForeArm.rotation.z = 0;
  }
  if (neck) {
    neck.rotation.x = Math.PI / 12;
    neck.rotation.y = 0;
    neck.rotation.z = 0;
  }

  // Add the animations for smooth transitions in future poses
  ref.animations.push(animations);

  if (ref.pending === false) {
    ref.pending = true;
    ref.animate();
  }

  console.log("✅ Default pose applied");
}

// Make the function available globally for the Chrome extension
window.defaultPose = defaultPose;
