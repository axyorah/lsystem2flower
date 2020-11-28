// GLOBALS
//   DOM
var canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const growBtn = document.getElementById("button-grow");
const undoBtn = document.getElementById("button-undo");
const resetBtn = document.getElementById("button-reset");

const flenRng = document.getElementById("flen");
const angleRng = document.getElementById("angle");

const flenSpan = document.getElementById("flen-span");
const angleSpan = document.getElementById("angle-span");

const ruleXBtn = document.getElementById("rule-X");
const ruleFBtn = document.getElementById("rule-F");
const ruleOpenBracketBtn = document.getElementById("rule-[");
const ruleClosedBracketBtn = document.getElementById("rule-]");
const rulePlusBtn = document.getElementById("rule-+");
const ruleMinusBtn = document.getElementById("rule--");

//   Modules
var turtle = new TURTLE("canvas");
const lsys = new LSystem(turtle, context);

// EVENT FUNCTIONS
const reset = function() {
    lsys.reset();
    lsys.draw();
}

const growOneStep = function() {
    lsys.reset(false);
    lsys.updateState(1);
    lsys.draw()
}

const undoOneStep = function() {
    lsys.reset(false);
    if (lsys.states.length > 1) {
        lsys.states.pop();
    }
    lsys.draw();
}

const modFLen = function() {
    let val = parseInt(flenRng.value);
    flenSpan.innerText = val;

    lsys.reset(false);
    lsys.setDist(val);
    lsys.draw();
}

const modAngle = function() {
    let val = parseInt(angleRng.value);
    angleSpan.innerText = val;

    lsys.reset(false);
    lsys.setAngle(val);
    lsys.draw();
}

const modRuleX = function() {
    let val = ruleXBtn.value;

    lsys.reset(false);
    lsys.setRules('X', val);
    lsys.draw();
}

const modRuleF = function() {
    let val = ruleFBtn.value;

    lsys.reset(false);
    lsys.setRules('F', val);
    lsys.draw();
}

const modRuleOpenBracket = function() {
    let val = ruleOpenBracketBtn.value;

    lsys.reset(false);
    lsys.setRules('[', val);
    lsys.draw();
}

const modRuleClosedBracket = function() {
    let val = ruleClosedBracketBtn.value;

    lsys.reset(false);
    lsys.setRules(']', val);
    lsys.draw();
}

const modRulePlus = function() {
    let val = rulePlusBtn.value;

    lsys.reset(false);
    lsys.setRules('+', val);
    lsys.draw();
}

const modRuleMinus = function() {
    let val = ruleMinusBtn.value;

    lsys.reset(false);
    lsys.setRules('-', val);
    lsys.draw();
}

// EVENT LISTENERS
//   Buttons
growBtn.addEventListener("click", growOneStep);
undoBtn.addEventListener("click", undoOneStep);
resetBtn.addEventListener("click", reset);

//   Sliders
flenRng.addEventListener("change", modFLen);
angleRng.addEventListener("change", modAngle);

//   Rules
ruleXBtn.addEventListener("click", modRuleX);
ruleFBtn.addEventListener("click", modRuleF);
ruleOpenBracketBtn.addEventListener("click", modRuleOpenBracket);
ruleClosedBracketBtn.addEventListener("click", modRuleClosedBracket);
rulePlusBtn.addEventListener("click", modRulePlus);
ruleMinusBtn.addEventListener("click", modRuleMinus);