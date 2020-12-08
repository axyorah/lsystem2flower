#!/usr/bin/env python3

import flask
from flask import Flask
from flask import render_template
from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField

import numpy as np
from PIL import Image
import io
import os

import tensorflow as tf
from tensorflow.keras.models import load_model
from keras.preprocessing.image import img_to_array
from keras.utils.generic_utils import CustomObjectScope

PB_MODEL_DIR = "./tfsaved_model/"
SECRET_KEY = os.urandom(16)

app = Flask(__name__)    

class SubmitImage(FlaskForm):
    submit = SubmitField('Submit')

@app.route("/flowerify", methods=["GET", "POST"])
def upload():
    """
    html template should be in `./templates/` dir
    must(!) use form that inherits from `FlaskForms`, 
        which at least has `submit` field
    """
    form = SubmitImage()
    return render_template("index.html", form=form)


if __name__ == "__main__":
    Flask.secret_key = SECRET_KEY
    
    model = load_model(PB_MODEL_DIR)

    app.run(host="0.0.0.0")