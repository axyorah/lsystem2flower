# L-Systems Flowerified

Build a self-similar stick-figure fractal by following the rules of L-Systems grammar, and "flowerify" the result with the help of pix2pix magic!

gif:

## Contents
- [Background](#background)
  - [L-Systems](#lsystems)
  - [pix2pix](#pix2pix)
- [Getting Started](#gettingstarted)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
- [How it all works](#implementation)
- [Acknowledgments](#acknowledgments)

## Background <a name="background"></a>
### L-Systems <a name="lsystems"></a>
Despite what you've been taught in Calculus class, many real-life systems do not become smoother and simpler as you zoom in, but, quite the opposite, retain their complexity on various scales. The coastline of Britain (a classic example) looks just as squiggly on the world map as it does on the regional map. The "degree" of squiggliness at different scales somehow remains the same-ish. Similarly, when you look on a picture of a circulatory system, as you zoom-in, on each scale you are presented with a similar pattern of bigger vessels branching into smaller ones, and smaller vessels branching into even smaller ones, and so on.

You might imagine, that if you'd want to describe such [fractal](https://en.wikipedia.org/wiki/Fractal) systems mathematically, the description would be infinitely complex. And it might as well be true for the most general case. But luckily there's an entire class of **perfectly self-similar** fractals: these beasts still boast a remarkable complexity of shapes and forms, and yet their mathematical description is delightfully simple!

In 1968 [Aristid Lindenmayer](https://en.wikipedia.org/wiki/Aristid_Lindenmayer) devised a formal mathematical language to encode the self-similar objects, and grammatical rules to specify how these objects evolve as they "grow". The formalism became known as the [L-System](https://en.wikipedia.org/wiki/L-system). Initially, the L-System consists only of a seed. This initial state is known as the "axiom". On each step the state of the L-System is updated according to "production rules", which describe how each symbol needs to be modified when the system passed on to the next stage.

E.g., suppose we have the following system:
```
Asiom: X
Rules:
  X -> F[-X]+X
  F -> FF
```
This means that each time we encounter a seed `X` we are replacing it by a "branch" `F`, and on top of it - two new seeds: one facing to the left `-X` and one facing to the right `+X`. Additionally, each time we encounter a branch `F` - we replace it by double itself `FF`. In this scheme `[` means that we make a record of where we are and which direction we're facing, and `]` means that we go back to the last recorded position/direction. Following these rules the system will grow as shown on the figure below:

<img width=400 src="imgs/lsystem-example.png">

### pix2pix <a name="pix2pix"></a>

## Getting Started <a name="gettingstarted"></a>

Clone the contents of this repo to your local machine:
```
$ git clone https://github.com/axyorah/lsystem2flower.git
``` 

### Prerequisites <a name="prerequisites"></a>
This project is written partially in `javascript` (the L-System part) and partially in `python3` (the pix2pix part), so to get things running we'd need to take care of the dependencies of both sides.

First, you need to have [python3](https://www.python.org/) and [node.js](https://nodejs.org/en/) installed on your machine.

Once `node.js` is installed, we can use `npm` to sort `javascript` dependencies listed in `static/package.json`.`Javascript` part relies on [Turtle graphics](https://en.wikipedia.org/wiki/Turtle_graphics) and corresponding [npm package](https://www.npmjs.com/package/turtle-canvas). To get the `npm` package run the following in your shell: 
```bash
$ cd static
$ npm install
$ cd ..
```

Once `python` is installed, we can use `pip3` to take care of the dependencies listed in `requirements.txt`: [numpy](https://numpy.org/), [tensorflow](https://www.tensorflow.org/), [opencv-python](https://pypi.org/project/opencv-python/), [pillow](https://pillow.readthedocs.io/en/stable/), [flask](https://flask.palletsprojects.com/en/1.1.x/), and [wtforms](https://wtforms.readthedocs.io/en/2.3.x/). You can either install them separately by running:
```bash
$ python -m pip install <package>
```
... or install them all in bulk by running:
```bash
$ python -m pip install -r requirements.txt
```

### Setup <a name="setup"></a>
Once dependencies are resolved you can start tickering with L-Systems and flowerification by running:
```
$ python app.py
```

This will start the `Flask` server. When you see the notification in your terminal that the server is up, in your browser go to `http://localhost:5000` and have fun!

## How it all works <a name="implementation"></a>
**TLDR**: `Javascript` client takes care of all the interactive bits and does the math behind the L-systems, 
while `python` `Flask` server does all the number crunching related to pix2pix - preprocessing, generating and postprocessing. After postprocessing flowerified generator output is sent back to `js` client for rendering. 

### L-System <a name="lsystem-impl"></a>
L-System implementation is pretty straightforward. If you're interested you can check the code in `static/lsystem.js`. Below I'll mostly describe pix2pix implementation.

### Pix2pix <a name="pix2pix-impl"></a>
Tensorflow saved model for L-System flowerification (generator only) is stored in `tfsaved_model`. The colab notebook that you can use to rebuild/retrain the model is at `utils/edges2flower.ipynb` (**<<< ADD!!! >>>**). Here are some model details, in case if you want to do a similar project yourself:

#### Dataset
I used [Oxford Flowers Dataset](https://www.robots.ox.ac.uk/~vgg/data/flowers/102/index.html) with 8189 images split over 102 flower categories.

**A**-part of the pix2pix input comprised of original dataset images cropped in the middle into a square shape and resized to 256x256 pixels.

To get the **B**-part of the pix2pix input the same images were passed through [Canny edge detector](https://en.wikipedia.org/wiki/Canny_edge_detector), [dilated](https://en.wikipedia.org/wiki/Dilation_(morphology)) and [eroded](https://en.wikipedia.org/wiki/Erosion_(morphology)). 

The resulting combined image would look something like this:

<img src="imgs/pix2pix_inpt_ab.png">

#### Generator
The generator architecture is **mostly** the same as in [tensorflow pix2pix tutorial](https://www.tensorflow.org/tutorials/generative/pix2pix):
- base architecture is a modified U-Net
- each block in the encoder is Conv -> Batchnorm -> LeakyReLU
- each block in the decoder is (2x bilinear resize + Conv) -> Batchnorm -> +/- Dropout -> ReLU
- there are skip connections between the encoder and decoder
- weights are clipped to be in the [-1,1] range 

In decoder I use (2x bilinear resize + Conv) instead of ConvTranspose, because it results in somewhat "smoother"-looking images. Weights are regularly clipped to avoid `NaN`s. If you're training on GPU, CUDA will deal with `NaN`s gracefully, and you will not notice that something is wrong with the model until you run inference on CPU...

#### Discriminator
Again, discriminator architecture is mostly the same as in [tensorflow pix2pix tutorial](https://www.tensorflow.org/tutorials/generative/pix2pix):
- base is a PatchGAN
- each block is Conv -> Batchnorm -> LeakyReLU
- the shape of the output layer in (batch_size, 13, 13, 1)
- discriminator receives two inputs: photorealisic flower as **A**-part and black flower edge on white background as **B**-part.

#### Training
Optimizers and losses are the same as in [tensorflow pix2pix tutorial](https://www.tensorflow.org/tutorials/generative/pix2pix). The entire model was trained for 50 epochs.

### L-System preprocessing for pix2pix <a name="preparation"></a>
Raw L-System drawing looks a bit too regular and edgy - it clearly doesn't have the same distribution as real flower edges, that were used to train pix2pix generator. To make the drawing look a bit more like the images that the model was trained on, the drawing goes through dilation, Gaussian blur, erosion and Canny edge detector. All the preprocessing is done in `python` on the `flask` server side. You can check the preprocessing functions in `app.py`.

## Acknowledgments <a name="acknowledgments"></a>
boostrap
turtle
tensorflow tutorials