//import * as tf from '@tensorflow/tfjs';

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

//    Modules
const turtle = new TURTLE("canvas-lsys");
const lsys = new LSystem(turtle, lsysCanvas, lsysContext);

//    Vars
const MAX_ITERS = 8;
lsysContext.font = "20px Arial";
lsysContext.fillStyle = "black";

//    Path to pix2pix Generator
//    assumming http server is serving at port 8181:
//    $ http-server . -p 8181
const path = "http://localhost:8181/web_model/model.json"; //http://localhost:8181/
let generator;

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
    axiomLabel.innerHTML = `Axiom: <code>'${lsys.axiom}'</code>`;
}

const mkRandColor = function () {
    let r = Math.floor(Math.random() * 255 );
    let g = Math.floor(Math.random() * 255 );
    let b = Math.floor(Math.random() * 255 );

    return `rgb(${r},${g},${b})`;
}

// --- PIX2PIX GENERATOR (promise) ---
const loadGeneratorFromJson = async function() {
    generator = await tf.loadGraphModel(path);
}

// --- IMG PREPROCESSING (for generator) ---
const imagify = function (img) {
    /*
    convert l-system from canvas into an image that looks similar
    to images that generator was trained on
    (flowers passed through Canny filter with some dilation/erosions)
    */
    // prepare erosion/dilation kernels
    let iters = 3;
    let anchor = new cv.Point(-1,-1);
    let erosion_size = 3;
    let dilation_size = 3;
    
    let erosion_kernel = new cv.Mat();
    let dilation_kernel = new cv.Mat();

    erosion_kernel = cv.getStructuringElement(
        morph_shape,
        new cv.Size(2 * erosion_size + 1, 2 * erosion_size + 1)
    );
    dilation_kernel = cv.getStructuringElement(
        morph_shape,
        new cv.Size(2 * dilation_size + 1, 2 * dilation_size + 1)
    );

    // blur/erode/dilate
    cv.dilate(
        img, img, dilation_kernel, anchor, iters);//, 
        //cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    cv.blur(img, img, new cv.Size(3,3));
    cv.erode(
        img, img, erosion_kernel, anchor, iters);//, 
        //cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

    // run canny edge detector to make fake img similar to 
    // what the generator was trained on
    let edge = new cv.Mat();
    cv.Canny(img, edge, 150, 150, 3, false);
    cv.bitwise_not(edge, edge);

    // convert to 3-channel img
    let edge3 = new cv.Mat();
    cv.cvtColor(edge, edge3, cv.COLOR_GRAY2RGB);

    cv.imshow("canvas-pix2pix", edge3);
    return edge3;
};

const img2tensor = function (img) {
    return tf.tensor3d(img.data, [img.rows, img.cols, img.channels()])
}

const preprocessTensor = function (tensor) {
    return tf.tidy(() => {
        tensor = tf.cast(tensor, 'float32')
        tensor = tensor.resizeBilinear([256, 256]);
        tensor = tensor.div(tf.tensor([127.5])).add(tf.tensor([-1.]));
        tensor = tensor.expandDims(0);
        return tensor;
    });
}

const deprocessTensor = function (tensor) {
    return tf.tidy(() => {
        tensor = tensor.squeeze(0);
        tensor = tensor.add(tf.tensor([1.])).div(tf.tensor([2.]));
        tensor = tensor.resizeBilinear([lsysCanvas.height, lsysCanvas.width]);
        return tensor;
    });    
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
    tf.tidy(() => {
        // get lsystem image
        let src = cv.imread("canvas-lsys");
        // preprocess for generator
        let imagified = imagify(src);
        let tensor = img2tensor(imagified);
        let preprocessed = preprocessTensor(tensor);
        // generate
        let generated = generator.predict(preprocessed); // <-- NaN...
        //let generated = generator.apply(preprocessed, {'training': true}); //<-- only for LayersModel

        // display
        let deprocessed = deprocessTensor(generated);
        tf.browser.toPixels(deprocessed, pix2pixCanvas);
    });    
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
    loadGeneratorFromJson();
    
    lsysContext.fillStyle = "#FFFFFF";
    lsysContext.strokeStyle = "#000000";
}

main()