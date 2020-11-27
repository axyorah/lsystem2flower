// GLOBALS
var canvas = document.getElementById("canvas");
var turtle = new TURTLE("canvas");

DIST = 20; // [pxls] length of `F` segment
ANGLE = 15; // [deg] deviation of child branch from parent branch direction


// turtle init setup
turtle.moveTo(250,400);
turtle.dir = - Math.PI / 2;
turtle.stroke();

let rules = {
    'X': 'F[-X][X]F[-X]+FX',
    'F': 'FF',
    '[': '[',
    ']': ']',
    '+': '+',
    '-': '-'
}

function iterate(state, rules, iters) {
    let state0;
    for (let i = 0; i < iters; i++) {
        state0 = state;
        state = "";
        for (let sym of state0) {
            state += rules[sym];
        }
    }
    return state;
}

function tree(state, rules, angle, dist, clr=true) {
    let pos_stack = [];
    let dir_stack = [];
    for (let sym of state) {
        console.log(sym);
        if (sym === 'F') turtle.forward(dist)
        else if (sym === '+') turtle.right(angle)
        else if (sym === '-') turtle.left(angle)
        else if (sym === '[') {
            pos_stack.push([turtle.x, turtle.y]) 
            dir_stack.push(turtle.dir)
        }
        else if (sym === ']') {
            turtle.stroke();
            turtle.penup();
            turtle.moveTo(...pos_stack[pos_stack.length-1]);
            turtle.dir = dir_stack[dir_stack.length-1];
            pos_stack.pop();
            dir_stack.pop();
            turtle.pendown();
        }
    }
    turtle.stroke();
}

state = 'X';
let stateNew = iterate(state, rules, 3);
console.log(stateNew);
tree(stateNew, rules, ANGLE, DIST);


