#!/usr/bin/env python3

from flask import Flask, request, render_template
import os

from utils.imgutils import b64image2array, canvas2edges, edges2generated, \
    generated2postprocessed, postprocessed2encoded

from keras_model.get_model import Generator

KERAS_WEIGHTS = "./keras_model/weights_50nybn/"
SECRET_KEY = os.urandom(16)

app = Flask(__name__)    

def load_generator(weight_dir):
    generator = Generator()
    for i,layer in enumerate(generator.layers):
        if layer.get_weights():
            layer_name = os.path.join(weight_dir, f"layer_{i}.h5")
            layer.load_weights(layer_name)
    return generator

@app.route("/", methods=["GET", "POST"])
def index():
    return render_template("index.html")

@app.route("/flowerify", methods=["GET", "POST"])
def flowerify():
    # get raw base64 encoded img
    canvas_b64 = request.values["data"]

    # decode/preprocess 
    canvas_array = b64image2array(canvas_b64)
    edges = canvas2edges(canvas_array)

    # pix2pix!
    generated = edges2generated(generator, edges)

    # postprocess/encode
    # adjust to have the same size/dims as received img
    canvas_h, canvas_w = canvas_array.shape[:2]
    postprocessed = generated2postprocessed(generated, (canvas_w, canvas_h))    

    # encode as flat string of int's...
    #(somehow base64 encoding is not decoded correctly on the client side...)
    encoded = postprocessed2encoded(postprocessed)

    print(f"Image received: shape: {canvas_array.shape} min: {canvas_array.min()} max: {canvas_array.max()}")  
    print(f"Image generated: shape: {generated.shape} min: {generated.numpy().min()} max: {generated.numpy().max()}")
    print(f"Image postprocessed: shape: {postprocessed.shape} min {postprocessed.min()} max: {postprocessed.max()}")

    return encoded


if __name__ == "__main__":
    Flask.secret_key = SECRET_KEY
    
    generator = load_generator(KERAS_WEIGHTS)

    app.run(host="0.0.0.0")