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
    let morph_shape = cv.MORPH_ELLIPSE;
    
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

const getGauss2D = function (sigma, sz) {
    return tf.tidy(() => {
        let w = 2 * sz + 1;
        let x,y;
    
        let vals = [];
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < w; j++) {
                x = j - sz;
                y = i - sz;
                vals.push(
                    1. / (2. * Math.PI * sigma) * 
                    Math.exp(-(x * x + y * y)/(2. * sigma * sigma))
                );                                 
            }
        }
        let kernel = tf.tensor2d(vals, [w,w], dtype='float32');
    
        // normalize to ensure that kernell sums up to 1
        let sm = kernel.sum();
        kernel = kernel.div(sm);
    
        return kernel;
    });    
}

const getSobelX2D = function () {
    return tf.tidy(() => {
        let kernel = tf.tensor2d(
            [1,0,-1,2,0,-2,1,0,-1], [3,3], dtype='float32'
        )
        return kernel;
    }); 
}

const getSobelY2D = function () {
    return tf.tidy(() => {
        let kernel = tf.tensor2d(
            [1,2,1,0,0,0,-1,-2,-1], [3,3], dtype='float32'
        )
        return kernel;
    });
}

const getGauss4D = function (sigma, sz) {
    return tf.tidy(() => {
        let kernel = getGauss2D(sigma, sz);
        kernel = tf.expandDims(kernel, 2);
        kernel = tf.expandDims(kernel, 3);
    
        kernel = tf.tile(kernel, [1,1,3,1]);    
        return kernel;
    });
}

const getSobelX4D = function () {    
    return tf.tidy(() => {
        let kernel = getSobelX2D();
        kernel = tf.expandDims(kernel, 2);
        kernel = tf.expandDims(kernel, 3);
    
        kernel = tf.tile(kernel, [1,1,3,1]);    
        return kernel;
    });
}

const getSobelY4D = function () {
    return tf.tidy(() => {
        let kernel = getSobelY2D();
        kernel = tf.expandDims(kernel, 2);
        kernel = tf.expandDims(kernel, 3);
    
        kernel = tf.tile(kernel, [1,1,3,1]);    
        return kernel;
    });
}

const tfblur = function (tensor, sigma, sz) {
    return tf.tidy(() => {
        let kernel = getGauss4D(sigma, sz);
        let blured = tf.depthwiseConv2d(tensor, kernel, [1,1], 'same');
        blured = tf.clipByValue(blured, 0., 1.);
        return blured;
    });
}

const tfedges = function (tensor) {
    return tf.tidy(() => {
        let xkernel = getSobelX4D();
        let ykernel = getSobelY4D();

        let xtensor = tf.depthwiseConv2d(tensor, xkernel, [1,1], 'same');
        let ytensor = tf.depthwiseConv2d(tensor, ykernel, [1,1], 'same');

        let combined = tf.sqrt(xtensor.square().add(ytensor.square()));

        return combined;
    });
}

const tfLoadTensor = function () {
    return tf.tidy(() => {
        //let img = lsysContext.getImageData(0,0,lsysCanvas.widht, lsysCanvas.height);
        let rgba = tf.browser.fromPixels(lsysCanvas, numChannels=4); // [500,450,4]
        
        // all data is in alpha channel -> store it in a single layer
        let gray = rgba.max(2); // [500,450]

        // convert to 3D img
        return tf.stack([gray, gray, gray], 2); // [500,450,3]
    });
}

const tfGetPreprocessed = function () {
    return tf.tidy(() => {
        // load
        let inpt = tfLoadTensor();

        // init preprocess -> to [0,1]
        inpt = inpt.div(255.);
 
        // dilate contour
        inpt = tf.maxPool(inpt, 3, 1, 'same');

        // blur
        inpt = tfblur(inpt, 1, 3);

        // invert
        inpt = inpt.mul(tf.tensor(2.)); // sharpen edges
        let max = tf.max(inpt);
        inpt = max.add(inpt.mul(tf.tensor(-1))); // maxval - tensor

        // erode contour
        inpt = tf.maxPool(inpt, 3, 1, 'same');

        //detect edges cheaply
        inpt = tfedges(inpt);
        inpt = inpt.mul(tf.tensor(2.)); // sharpen edges
        inpt = tf.clipByValue(inpt, -1., 1.);

        // proper preprocess: rescale to [-1,+1], cvt to 4D tensor
        inpt = inpt.
            mul(tf.tensor(2.)).
            add(tf.tensor(-1.)).
            mul(tf.tensor(-1.));        
        inpt = tf.maxPool(inpt, 2, 1, 'same');

        inpt = inpt.resizeBilinear([256, 256]);
        inpt = tf.expandDims(inpt, 0);

        return inpt;
    });
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
        tensor = tfblur(tensor, 1, 3);
        return tensor;
    });    
}