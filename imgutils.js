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

const getGauss4D = function (sigma, sz) {
    return tf.tidy(() => {
        let kernel = getGauss2D(sigma, sz);
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