// GLOBALS
var canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
var turtle = new TURTLE("canvas");
let lsys = new LSystem(turtle, context);


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

const reset = function() {
    lsys.reset();
    lsys.draw();
}