#!/usr/bin/env python3

import flask
from flask import Flask, request, render_template
from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField

import numpy as np
from PIL import Image
import cv2 as cv
import io
import os
import base64

import tensorflow as tf
from tensorflow.keras.models import load_model

PB_MODEL_DIR = "./tfsaved_model/"
SECRET_KEY = os.urandom(16)

app = Flask(__name__)    

class SubmitImage(FlaskForm):
    submit = SubmitField('Submit')

def imagify(img):
    h,w,c = img.shape
    
    morph_shape = cv.MORPH_ELLIPSE
    erosion_size = 3
    dilation_size = 3
    
    erosion_element = cv.getStructuringElement(
            morph_shape, 
            (2 * erosion_size + 1, 2 * erosion_size + 1),
            (erosion_size, erosion_size))
    
    dilation_element = cv.getStructuringElement(
            morph_shape,
            (2 * dilation_size + 1, 2 * dilation_size + 1),
            (dilation_size, dilation_size))
    
    # blur/erode/dilate
    img = cv.erode(img, erosion_element)
    img = cv.blur(img, (3,3))
    img = cv.dilate(img, dilation_element)
    img = cv.blur(img, (3,3))
    img = cv.erode(img, erosion_element)
    img = cv.dilate(img, dilation_element)
    
    # run canny edge detector to make fake img similar to 
    # what the generator was trained on
    layer = cv.Canny(img[:,:,0], 150,150) 
    layer = cv.bitwise_not(layer)
    img = np.stack([layer,layer,layer], axis=2)
    
    return img

def canvas2edges(png4):
    # all info is in the last alpha channel - let's get it
    edges = np.stack([png4[:,:,-1],png4[:,:,-1],png4[:,:,-1]], axis=2)

    # all info is reversed..
    edges = cv.bitwise_not(edges)

    # resize for pix2pix
    edges = cv.resize(edges, (256, 256))

    # make it look more real-ish
    imagified  = imagify(edges)

    cv.imwrite("imgs/img_received.jpg", edges)
    cv.imwrite("imgs/img_imagified.jpg", imagified)
    
    return imagified

def edges2generated(edges):
    # scale and add fake batch dimension
    tensor = (edges / 127.5) - 1
    tensor = np.expand_dims(tensor, 0)    
    tensor = tf.cast(tensor, dtype=tf.float32)
        
    # generate in train mode:
    # batch norm layers don't behave well in test mode for generative nets
    #(in test mode normalization is done as a moving average over population of imgs)
    generator.trainable = True # <-- !
    generated_raw = generator(tensor, training=True) # float32 [-1, 1]
    
    #generated_img = generated_raw.numpy()[-1] * 0.5 + 0.5 # float32 [0, 1]
    generated_img = ((generated_raw.numpy()[-1] + 1.) * 127.5).astype(np.uint8) # uint8 [0, 255]
    
    return generated_img

def b64image2array(image_b64):
    image_data = image_b64.split(",")[1]
    image_data = image_data.replace(" ", "+") # <-- !!!!! xD
    image_bytes = base64.b64decode(image_data)
    image_PIL = Image.open(io.BytesIO(image_bytes))
    image_array = np.array(image_PIL)

    return image_array

@app.route("/", methods=["GET", "POST"])
def index():
    form = SubmitImage()
    return render_template("index.html", form=form)

@app.route("/flowerify", methods=["GET", "POST"])
def flowerify():
    # get raw base64 encoded img
    canvas_b64 = request.values["data"]

    # decode/preprocess
    canvas_array = b64image2array(canvas_b64)
    edges = canvas2edges(canvas_array)

    # pix2pix!
    generated = edges2generated(edges)

    # adjust to have the same size/dims as received img
    canvas_h, canvas_w = canvas_array.shape[:2]
    generated = cv.resize(generated, (canvas_w, canvas_h)) # same size as in meta
    generated = np.concatenate(
        [generated, 255*np.ones((canvas_h, canvas_w, 1), dtype=np.uint8)], 
        axis=2
    ) # add alpha channel

    # encode as flat string of int's...
    #(I'm doing it this way because somehow base64 encoding  
    # is not decoded correctly on the client side...)
    generated_flatstr = ",".join([str(ch) for ch in generated.ravel()])

    # encode as base64 (doesn't work! >.<)
    # supposedly it means: `image mode=RGBA size=500x450` 
    #meta = "iVBORw0KGgoAAAANSUhEUgAAAfQAAAHCCAYAAAAZ9Ts6AAAgAElEQVR4Xuzd"
    #b64_head = canvas_b64.split(",")[0] # "data:image/png;base64"
    #generated_b64 = \
    #    b64_head + "," + meta + \
    #    base64.b64encode(generated.tobytes()).decode("utf-8")

    print(f"Image received: shape: {canvas_array.shape} min: {canvas_array.min()} max: {canvas_array.max()}")  
    print(f"Image generated: shape: {generated.shape} min: {generated.min()} max: {generated.max()}")

    return generated_flatstr


if __name__ == "__main__":
    Flask.secret_key = SECRET_KEY
    
    generator = load_model(PB_MODEL_DIR)

    app.run(host="0.0.0.0")