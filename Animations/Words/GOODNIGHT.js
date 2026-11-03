export const GOOD_NIGHT = (ref) => {

    let animations = []

    // 👉 Raise both hands upward
    animations.push(["mixamorigLeftArm", "rotation", "x", -Math.PI/4, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/4, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/6, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/6, "+"]);

    // Slight inward tilt
    animations.push(["mixamorigLeftArm", "rotation", "y", Math.PI/10, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "y", -Math.PI/10, "-"]);

    ref.animations.push(animations);


    // 👉 Small motion (like settling into sleep pose)
    animations = []

    animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/12, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/12, "+"]);

    ref.animations.push(animations);


    // 👉 Return to normal
    animations = []

    animations.push(["mixamorigLeftArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigLeftArm", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "y", 0, "+"]);

    ref.animations.push(animations);


    if(ref.pending === false){
        ref.pending = true;
        ref.animate();
    }

}
