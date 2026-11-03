export const I = (ref) => {

    let animations = []

    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/4, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/5, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "y", -Math.PI/8, "-"]);

    ref.animations.push(animations);


    animations = []
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/12, "+"]);
    ref.animations.push(animations);

    animations = []
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "+"]);

    ref.animations.push(animations);


    if(ref.pending === false){
        ref.pending = true;
        ref.animate();
    }
}
