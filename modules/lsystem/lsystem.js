
class LSystem {
    constructor(turtle, context){
        this.turtle = turtle;
        this.context = context;
        this.reset();
    }

    dist = 10; // [pxl] length of `F` segment
    angle = 15; // [deg] angle between child- and parent-branch directions
    states = ['X'];
    rules = {
        'X': 'F[-X][+X]F[-X]+FX',
        'F': 'FF',
        '[': '[',
        ']': ']',
        '+': '+',
        '-': '-',
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

    reset = function(resetState=true) {
        if (resetState) {
            this.states = ['X'];
        }
        context.clearRect(0, 0, canvas.width, canvas.height);
        turtle.moveTo(canvas.width/2,Math.floor(canvas.height * 0.95));
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