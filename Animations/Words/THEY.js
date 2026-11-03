export const THEY = (ref) => {

    let animations = []

    animations.push(["mixamorigLeftArm", "rotation", "x", -Math.PI/5, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/5, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/6, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/6, "+"]);

    ref.animations.push(animations);


    animations = []
    animations.push(["mixamorigLeftArm", "rotation", "y", -Math.PI/6, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "y", Math.PI/6, "+"]);
    ref.animations.push(animations);


    animations = []
    animations.push(["mixamorigLeftArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigLeftArm", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "y", 0, "-"]);

    ref.animations.push(animations);


    if(ref.pending === false){
        ref.pending = true;
        ref.animate();
    }
}