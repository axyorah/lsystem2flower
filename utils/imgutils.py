#!/usr/bin/env python3

import numpy as np
from PIL import Image
import cv2 as cv
import io
import os
import base64

import tensorflow as tf
from tensorflow.keras.models import load_model

def b64image2array(image_b64):
    image_data = image_b64.split(",")[1]
    image_data = image_data.replace(" ", "+") # <-- !!!!! xD
    image_bytes = base64.b64decode(image_data)
    image_PIL = Image.open(io.BytesIO(image_bytes))
    image_array = np.array(image_PIL)

    return image_array

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

def edges2generated(generator, edges):
    # scale and add fake batch dimension
    tensor = (edges / 127.5) - 1
    tensor = np.expand_dims(tensor, 0)    
    tensor = tf.cast(tensor, dtype=tf.float32)
        
    # generate in train mode:
    # batch norm layers don't behave well in test mode for generative nets
    #(in test mode normalization is done as a moving average over population of imgs)
    generator.trainable = True # <-- !
    generated = generator(tensor, training=True) # (1,256,256,3) float32 [-1, 1]
    
    return generated

def generated2postprocessed(image, canvas_sz):
    canvas_w, canvas_h = canvas_sz
    
    # convert to uint8 without batch dim
    postprocessed = ((image.numpy()[0] + 1.) * 127.5).astype(np.uint8) # uint8 [0, 255]

    # adjust to have the same size/dims as received canvas
    postprocessed = cv.resize(postprocessed, (canvas_w, canvas_h))
    postprocessed = np.concatenate(
        [postprocessed, 255*np.ones((canvas_h, canvas_w, 1), dtype=np.uint8)], 
        axis=2
    ) # add alpha channel
    return postprocessed

def postprocessed2encoded(image):
    return ",".join([str(ch) for ch in image.ravel()])