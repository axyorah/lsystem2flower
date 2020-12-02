//import * as tf from '@tensorflow/tfjs';

// ---GLOBALS---
//    DOM
let lsysCanvas = document.getElementById("canvas-lsys");
const lsysContext = lsysCanvas.getContext("2d");

let pix2pixCanvas = document.getElementById("canvas-pix2pix");
const pix2pixContext = pix2pixCanvas.getContext("2d");

const numSeeds = document.getElementById("numseeds");
const axiomLabel = document.getElementById("axiom-label");

const growBtn = document.getElementById("button-grow");
const undoBtn = document.getElementById("button-undo");
const resetBtn = document.getElementById("button-reset");

const flenRng = document.getElementById("flen");
const angleRng = document.getElementById("angle");

const flenSpan = document.getElementById("flen-span");
const angleSpan = document.getElementById("angle-span");

const ruleX = document.getElementById("rule-X");
const ruleF = document.getElementById("rule-F");

const flowerifyBtn = document.getElementById("button-pix2pix");

//    Modules
var turtle = new TURTLE("canvas-lsys");
const lsys = new LSystem(turtle, lsysCanvas, lsysContext);

//    Vars
const MAX_ITERS = 8;
lsysContext.font = "20px Arial";
lsysContext.fillStyle = "black";

//    Path to pix2pix Generator
//    assumming http server is serving at port 8181:
//    $ http-server . -p 8181
const path = "http://localhost:8181/web_model/model.json";

// ---HELPER FUNCTIONS---
const redraw = function () {
    lsys.reset(false);    
    lsys.draw();
    lsysContext.fillText(`Phase ${lsys.states.length-1}`, 10, 30);
}

const recalculateAllStates = function () {
    const numStates = lsys.states.length - 1;
    lsys.states = [lsys.axiom];
    lsys.updateState(numStates);
}

const updateAxiomLabel = function () {
    axiomLabel.innerHTML = `Axiom: <code>'${lsys.axiom}'</code>`;
}

const mkRandColor = function () {
    let r = Math.floor(Math.random() * 255 );
    let g = Math.floor(Math.random() * 255 );
    let b = Math.floor(Math.random() * 255 );

    return `rgb(${r},${g},${b})`;
}



// --- PROMISES (pix2pix -> flowerify) ---
let generator;
const loadGeneratorFromJson = async function() {
    generator = await tf.loadGraphModel(path);
    //generator.predict([tf.zeros([1,256,256,3])]); // <-- add to test!
    //generator.load();
    //generator.summary();
}
loadGeneratorFromJson();

// ---EVENT LISTENERS---
//    Numeric Inputs: num seeds
numSeeds.addEventListener("input", function () {
    lsys.setNumSeeds(parseInt(numSeeds.value));
    lsys.setAxiomAndAxiomAngle();
    updateAxiomLabel();
    recalculateAllStates();
    redraw();
})

//    Buttons
resetBtn.addEventListener("click", function() {
    lsys.reset();
    lsys.draw();
});
growBtn.addEventListener("click", function() {
    if (lsys.states.length <= MAX_ITERS) {
        lsys.updateState(1);
        redraw(); 
    } else {
        console.log(`maximal number of iterations is reached!`)
    }   
});
undoBtn.addEventListener("click", function() {
    if (lsys.states.length > 1) lsys.states.pop();
    redraw();
});
flowerifyBtn.addEventListener("click", function() {    
    // make button change color each time it's clicked
    let color = mkRandColor();

    flowerifyBtn.style.border = `2px solid ${color}`;
    flowerifyBtn.style.color = color;
})
flowerifyBtn.addEventListener("click", function() {
    // TODO: grab lsys img + preprocess + predict
    let flower_raw = generator.predict([tf.zeros([1,256,256,3])]);
    // TODO: unprocess + post to pix2pix canvas
})

//    Sliders
flenRng.addEventListener("input", function() {
    let val = parseInt(flenRng.value);
    flenSpan.innerText = val;
    lsys.setDist(val);
    redraw();
});
angleRng.addEventListener("input", function() {
    let val = parseInt(angleRng.value);
    angleSpan.innerText = val;
    lsys.setAngle(val);
    redraw();
});

//    Text Inputs: Rules
ruleX.addEventListener("input", function() {
    lsys.setRules('X', ruleX.value);
    recalculateAllStates();
    redraw();
});
ruleF.addEventListener("input", function() {
    lsys.setRules('F', ruleF.value);
    recalculateAllStates();
    redraw();
});