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

//    l-system-related
const turtle = new TURTLE("canvas-lsys");
const lsys = new LSystem(turtle, lsysCanvas);

//    pix2pix-related
let generated = new Image();

//    general
const MAX_ITERS = 8;

// ---HELPER FUNCTIONS---
const redraw = function () {
    lsys.reset(false);    
    lsys.draw();
    lsysContext.strokeText(`Phase ${lsys.states.length-1}`, 10, 30);
}

const recalculateAllStates = function () {
    const numStates = lsys.states.length - 1;
    lsys.states = [lsys.axiom];
    lsys.updateState(numStates);
}

const updateAxiomLabel = function () {
    axiomLabel.innerHTML = 
        `Axiom: <code>'${lsys.axiom}'</code>  ` +
        `('>' = ${Math.floor(lsys.axiomAngle*10)/10}<sup>o</sup>)`;
}

const mkRandColor = function () {
    let r = Math.floor(Math.random() * 255 );
    let g = Math.floor(Math.random() * 255 );
    let b = Math.floor(Math.random() * 255 );

    return `rgb(${r},${g},${b})`;
}

const decodeBase64Encoding = function (base64) {
    generated.onload = function() {
            pix2pixContext.drawImage(
            generated, 0, 0, pix2pixCanvas.width, pix2pixCanvas.height);
    };
    generated.src = base64;
}

const flatStringOfIntsToCanvas = function (flatstr) {
    let datastr = flatstr.split(",")
    let imageData = pix2pixContext.createImageData(
        pix2pixCanvas.width, pix2pixCanvas.height);
    for (let i = 0; i < datastr.length; i++) {
        imageData.data[i] = parseInt(datastr[i]);
    }
    pix2pixContext.putImageData(imageData, 0, 0);
}

const postData = async function (url = "", data = {}) {
    const response = await fetch(url, {
        method: "POST",
        mode: "cors", 
        cache: "no-cache", 
        credentials: "same-origin", 
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        redirect: "follow", 
        referrerPolicy: "no-referrer", 
        body: JSON.stringify(data) 
    });
    return response.json();
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
    // make button change color each time it's clicked
    let color = mkRandColor();

    flowerifyBtn.style.border = `2px solid ${color}`;
    flowerifyBtn.style.color = color;
})
flowerifyBtn.addEventListener("click", function () {
    // get l-system input 
    let b64Image = lsysCanvas.toDataURL();

    // send raw base64 canvas img to flask server and display response on canvas
    postData("http://localhost:5000/flowerify", { data: b64Image })
        .then( res => flatStringOfIntsToCanvas(res["data"]) );
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

// RUN
const main = function () {    
    lsysContext.fillStyle = "#FFFFFF";
    lsysContext.strokeStyle = "#000000";
    lsysContext.font = "20px Arial";
}

main()