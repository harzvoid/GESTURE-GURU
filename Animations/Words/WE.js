export const WE = (ref) => {

    let animations = []

    animations.push(["mixamorigLeftArm", "rotation", "x", -Math.PI/5, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/5, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/6, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/6, "+"]);

    ref.animations.push(animations);


    animations = []
    animations.push(["mixamorigLeftHand", "rotation", "y", Math.PI/10, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "y", -Math.PI/10, "-"]);
    ref.animations.push(animations);


    animations = []
    animations.push(["mixamorigLeftHand", "rotation", "y", -Math.PI/10, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", Math.PI/10, "+"]);
    ref.animations.push(animations);


    animations = []
    animations.push(["mixamorigLeftArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "+"]);

    ref.animations.push(animations);


    if(ref.pending === false){
        ref.pending = true;
        ref.animate();
    }
}  
