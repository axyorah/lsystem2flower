// GLOBALS
//   DOM
var canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const flen = document.getElementById("flen");
const flenSpan = document.getElementById("flen-span");

const angle = document.getElementById("angle");
const angleSpan = document.getElementById("angle-span");

const ruleX = document.getElementById("rule-X");
const ruleF = document.getElementById("rule-F");
const ruleOpenBracket = document.getElementById("rule-[");
const ruleClosedBracket = document.getElementById("rule-]");
const rulePlus = document.getElementById("rule-+");
const ruleMinus = document.getElementById("rule--");

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
    lsys.states.pop();
    lsys.draw();
}

const modFLen = function() {
    let val = parseInt(flen.value);
    flenSpan.innerText = val;

    lsys.reset(false);
    lsys.setDist(val);
    lsys.draw();
}

const modAngle = function() {
    let val = parseInt(angle.value);
    angleSpan.innerText = val;

    lsys.reset(false);
    lsys.setAngle(val);
    lsys.draw();
}

const modRuleX = function() {
    let val = ruleX.value;

    lsys.reset(false);
    lsys.setRules('X', val);
    lsys.draw();
}

const modRuleF = function() {
    let val = ruleF.value;

    lsys.reset(false);
    lsys.setRules('F', val);
    lsys.draw();
}

const modRuleOpenBracket = function() {
    let val = ruleOpenBracket.value;

    lsys.reset(false);
    lsys.setRules('[', val);
    lsys.draw();
}

const modRuleClosedBracket = function() {
    let val = ruleClosedBracket.value;

    lsys.reset(false);
    lsys.setRules(']', val);
    lsys.draw();
}

const modRulePlus = function() {
    let val = rulePlus.value;

    lsys.reset(false);
    lsys.setRules('+', val);
    lsys.draw();
}

const modRuleMinus = function() {
    let val = ruleMinus.value;

    lsys.reset(false);
    lsys.setRules('-', val);
    lsys.draw();
}