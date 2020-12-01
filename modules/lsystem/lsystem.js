
class LSystem {
    constructor(turtle, canvas, context){
        this.turtle = turtle;
        this.canvas = canvas;
        this.context = context;
        this.reset();
    }

    dist  = 10; // [pxl] length of `F` segment
    angle = 15; // [deg] angle between child- and parent-branch directions
    numSeeds = 1; // num of radialy symetric `X` seeds in the axiom
    axiom = '[X]';
    axiomAngle = 360 /this.numSeeds;
    states = [this.axiom];
    rules = {
        'X': 'F[-X][+X]F[-X]+FX',
        'F': 'FF',
        '[': '[',
        ']': ']',
        '+': '+',
        '-': '-',
        '>': '>',
    };

    setRules = function(key, val) {
        this.rules[key] = val;
        console.log(`updated rule for ${key}: ${this.rules[key]}`);
    }

    setDist = function(val) {
        this.dist = val;
        console.log(`F-segment length set to: ${this.dist}`);
    }

    setAngle = function(val) {
        this.angle = val;
        console.log(`Angle set to: ${this.angle}`);
    }

    setNumSeeds = function(val) {
        this.numSeeds = val;
        console.log(`#seeds set to ${this.numSeeds}`);
    }

    setAxiomAndAxiomAngle = function() {
       this.axiomAngle = 360 / this.numSeeds;
       let newAxiom = '';
       for (let i = 0; i < this.numSeeds; i++) {
            newAxiom += '[';
            for (let j = 0; j < i; j++) {
                newAxiom += '>';
            }
            newAxiom += 'X]';            
       }
       this.axiom = newAxiom;
       console.log(`axiom set to ${this.axiom}`);
       console.log(`axiom angle set to ${this.axiomAngle}`);
    }

    reset = function(resetState=true) {
        if (resetState) {
            this.states = [this.axiom];
        }
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.numSeeds === 1) {
            turtle.moveTo(
                this.canvas.width/2,
                Math.floor(this.canvas.height * 0.95));
        } else {
            turtle.moveTo(
                this.canvas.width/2,
                this.canvas.height/2);
        }
        
        turtle.dir = - Math.PI / 2;
        turtle.stroke();
    }

    updateState = function(iters=1) {
        let state0;
        let state;
        for (let i = 0; i < iters; i++) {
            state0 = this.states[this.states.length-1];
            state = "";
            for (let sym of state0) {
                state += this.rules[sym];
            }
            this.states.push(state);
        }
        return state;
    }

    draw = function() {
        let pos_stack = [];
        let dir_stack = [];
        for (let sym of this.states[this.states.length-1]) {
            if (sym === 'F') turtle.forward(this.dist)
            else if (sym === '>') turtle.right(this.axiomAngle)
            else if (sym === '+') turtle.right(this.angle)
            else if (sym === '-') turtle.left(this.angle)
            else if (sym === '[') {
                pos_stack.push([turtle.x, turtle.y]) 
                dir_stack.push(turtle.dir)
            }
            else if (sym === ']') {
                turtle.stroke();
                turtle.penup();
                if (pos_stack.length > 0 && dir_stack.length > 0) {
                    turtle.moveTo(...pos_stack[pos_stack.length-1]);
                    turtle.dir = dir_stack[dir_stack.length-1];
                    pos_stack.pop();
                    dir_stack.pop();
                }                
                turtle.pendown();
            }
        }
        turtle.stroke();
    }
};

class exports { LSystem };