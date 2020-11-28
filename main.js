// GLOBALS
//   DOM
var canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const flen = document.getElementById("flen");
const flenSpan = document.getElementById("flen-span");

const angle = document.getElementById("angle");
const angleSpan = document.getElementById("angle-span");

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
