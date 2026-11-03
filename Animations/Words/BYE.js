export const BYE = (ref) => {

    let animations = []

    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/3, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/4, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "z", Math.PI/10, "+"]);

    ref.animations.push(animations);


    animations = []
    animations.push(["mixamorigRightHand", "rotation", "y", Math.PI/6, "+"]);
    ref.animations.push(animations);


    animations = []
    animations.push(["mixamorigRightHand", "rotation", "y", -Math.PI/6, "-"]);
    ref.animations.push(animations);


    animations = []
    animations.push(["mixamorigRightHand", "rotation", "y", Math.PI/6, "+"]);
    ref.animations.push(animations);


    animations = []
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "-"]);

    ref.animations.push(animations);


    if(ref.pending === false){
        ref.pending = true;
        ref.animate();
    }

}