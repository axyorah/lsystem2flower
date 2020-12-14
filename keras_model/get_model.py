#!/usr/bin/env python3

import tensorflow as tf

OUTPUT_CHANNELS = 3

def downsample(filters, size, apply_batchnorm=True):
    initializer = tf.random_normal_initializer(0., 0.02)

    result = tf.keras.Sequential()
    result.add(
        tf.keras.layers.Conv2D(filters, size, strides=2, padding='same',
                             kernel_initializer=initializer, use_bias=False))

    if apply_batchnorm:
        result.add(tf.keras.layers.BatchNormalization())

    result.add(tf.keras.layers.LeakyReLU())

    return result

def smooth_upsample(filters, k_size, init_filters, init_size, apply_dropout=False):
    initializer = tf.random_normal_initializer(0., 0.02)

    inpt = tf.keras.layers.Input(shape=(init_size, init_size, init_filters))

    x = inpt
    x = tf.image.resize_with_pad(x, init_size*2, init_size*2)
    x = tf.keras.layers.Conv2D(
        filters, k_size, strides=1,        
        padding='same',
        kernel_initializer=initializer,
        use_bias=False)(x)
    x = tf.keras.layers.BatchNormalization()(x)
    if apply_dropout:
        x = tf.keras.layers.Dropout(0.5)(x)
    x = tf.keras.layers.ReLU()(x)

    return tf.keras.Model(inputs=[inpt], outputs=[x])

def last(init_filters, init_size):
    initializer = tf.random_normal_initializer(0., 0.02)
    
    inpt = tf.keras.layers.Input(shape=(init_filters, *init_size))
    
    last_layer = tf.keras.layers.Conv2DTranspose(
        OUTPUT_CHANNELS, 4,
        strides=2,
        padding='same',
        kernel_initializer=initializer,
        activation='tanh') # (bs, 256, 256, 3)
    
    return tf.keras.models.Model(inputs=[inpt], outputs=[last_layer(inpt)])

def Generator():
    inputs = tf.keras.layers.Input(shape=[256,256,3])

    down_stack = [
        downsample(64, 4, apply_batchnorm=False), # (bs, 128, 128, 64)
        downsample(128, 4, apply_batchnorm=False), # (bs, 64, 64, 128) 
        downsample(256, 4, apply_batchnorm=False), # (bs, 32, 32, 256)
        downsample(512, 4, apply_batchnorm=False), # (bs, 16, 16, 512)
        downsample(512, 4, apply_batchnorm=False), # (bs, 8, 8, 512)
        downsample(512, 4, apply_batchnorm=False), # (bs, 4, 4, 512)
        downsample(512, 4, apply_batchnorm=False), # (bs, 2, 2, 512)
        downsample(512, 4, apply_batchnorm=False), # (bs, 1, 1, 512)
    ]

    # 3rd param is a sum of prev ele of `up` stack + 
    # skip-connection sibling from `down` stack (which has same same dims)
    # => 3rd param is 2x 1st param of prev
    # (for every element except for the first)
    up_stack = [
        smooth_upsample(512, 4, 512, 1, apply_dropout=True), # (bs, 2, 2, 1024)
        smooth_upsample(512, 4, 1024, 2, apply_dropout=True), # (bs, 4, 4, 1024)
        smooth_upsample(512, 4, 1024, 4, apply_dropout=True), # (bs, 8, 8, 1024)
        smooth_upsample(512, 4, 1024, 8), # (bs, 16, 16, 1024)
        smooth_upsample(256, 4, 1024, 16), # (bs, 32, 32, 512)
        smooth_upsample(128, 4, 512, 32), # (bs, 64, 64, 256)
        smooth_upsample(64, 4, 256, 64), # (bs, 128, 128, 128)
    ]

    x = inputs

    # Downsampling through the model
    skips = []
    for down in down_stack:
        x = down(x)
        skips.append(x)

    skips = reversed(skips[:-1])

    # Upsampling and establishing the skip connections
    for up, skip in zip(up_stack, skips):
        x = up(x)
        x = tf.keras.layers.Concatenate()([x, skip])

    x = last(128,(128,128))(x)

    return tf.keras.Model(inputs=inputs, outputs=x)

def Discriminator():
    initializer = tf.random_normal_initializer(0., 0.02)

    inp = tf.keras.layers.Input(shape=[256, 256, 3], name='input_image')
    tar = tf.keras.layers.Input(shape=[256, 256, 3], name='target_image')

    x = tf.keras.layers.concatenate([inp, tar]) # (bs, 256, 256, channels*2)

    down1 = downsample(64, 4, False)(x) # (bs, 128, 128, 64)
    down2 = downsample(128, 4)(down1) # (bs, 64, 64, 128)
    down3 = downsample(256, 4)(down2) # (bs, 32, 32, 256)
    down4 = downsample(256, 4)(down3) # (bs, 16, 16, 256)
    
    last = tf.keras.layers.Conv2D(
        1, 4, strides=1,
        kernel_initializer=initializer)(down4) # (bs, 13, 13, 1)

    return tf.keras.Model(inputs=[inp, tar], outputs=last)