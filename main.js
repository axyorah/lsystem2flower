// ---GLOBALS---
//    DOM
let lsysCanvas = document.getElementById("canvas-lsys");
const lsysContext = lsysCanvas.getContext("2d");

let pix2xpiCanvas = document.getElementById("canvas-pix2pix");

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

function mkRandColor() {
    let r = Math.floor(Math.random() * 255 );
    let g = Math.floor(Math.random() * 255 );
    let b = Math.floor(Math.random() * 255 );

    return `rgb(${r},${g},${b})`;
}

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

    let color = mkRandColor();

    flowerifyBtn.style.border = `2px solid ${color}`;
    flowerifyBtn.style.color = color;
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