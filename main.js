// ---GLOBALS---
//    DOM
var canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const growBtn = document.getElementById("button-grow");
const undoBtn = document.getElementById("button-undo");
const resetBtn = document.getElementById("button-reset");

const flenRng = document.getElementById("flen");
const angleRng = document.getElementById("angle");

const flenSpan = document.getElementById("flen-span");
const angleSpan = document.getElementById("angle-span");

const ruleX = document.getElementById("rule-X");
const ruleF = document.getElementById("rule-F");
const ruleOpenBracket = document.getElementById("rule-[");
const ruleClosedBracket = document.getElementById("rule-]");
const rulePlus = document.getElementById("rule-+");
const ruleMinus = document.getElementById("rule--");

//    Modules
var turtle = new TURTLE("canvas");
const lsys = new LSystem(turtle, context);

//    Vars
const MAX_ITERS = 8;
context.font = "20px Arial";
context.fillStyle = "black";

// ---HELPER FUNCTIONS---
const redraw = function () {
    lsys.reset(false);    
    lsys.draw();
    context.fillText(`Phase ${lsys.states.length-1}`, 10, 30);
}

const recalculateAllStates = function () {
    const numStates = lsys.states.length - 1;
    lsys.states = ['X'];
    lsys.updateState(numStates);
}

// ---EVENT LISTENERS---
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

//    Rules
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
ruleOpenBracket.addEventListener("input", function() {
    lsys.setRules('[', ruleOpenBracket.value);
    recalculateAllStates();
    redraw();
});
ruleClosedBracket.addEventListener("input", function() {
    lsys.setRules(']', ruleClosedBracket.value);
    recalculateAllStates();
    redraw();
});
rulePlus.addEventListener("input", function() {
    lsys.setRules('+', rulePlus.value);
    recalculateAllStates();
    redraw();
});
ruleMinus.addEventListener("input", function() {
    lsys.setRules('-', ruleMinus.value);
    recalculateAllStates();
    redraw();
});