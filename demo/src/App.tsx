// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import { InferenceSession, Tensor } from "onnxruntime-web";
import React, { useContext, useEffect, useState } from "react";
import "./assets/scss/App.scss";
import { handleImageScale } from "./components/helpers/scaleHelper";
import { modelScaleProps } from "./components/helpers/Interfaces";
import { onnxMaskToImage } from "./components/helpers/maskUtils";
import { modelData } from "./components/helpers/onnxModelAPI";
import Stage from "./components/Stage";
import AppContext from "./components/hooks/createContext";
const ort = require("onnxruntime-web");
/* @ts-ignore */
import npyjs from "npyjs";

// Define image, embedding and model paths
const IMAGE_PATH = "/assets/data/dogs.jpg";
const MODEL_DIR = "/model/sam_vit_b.onnx";


  // Decode a Numpy file into a tensor. 
  const loadNpyTensor = async (tensorFile: string, dType: string) => {
    let npLoader = new npyjs();
    const npArray = await npLoader.load(tensorFile);
    const tensor = new ort.Tensor(dType, npArray.data, npArray.shape);
    return tensor;
  };

interface ServerResponse {
  download_path: string;
}


function image_as_base64(img:HTMLImageElement):string{
  // Convert image to base64
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(img, 0, 0);
    const _image_as_base64 = canvas.toDataURL('image/jpeg'); // Change format if needed
    //const image_as_base64 = image_as_base64.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""); // remove MIME
    return _image_as_base64
    // Append to FormData and do whatever you need to with formData
    //const formData = new FormData();
    //formData.append('file', _image_as_base64);
    // ... perhaps send it somewhere with fetch or axios
  } else {
    return ''
  }
}

const EMBEDDER_URL: string = process.env.NODE_ENV_EMBEDER_URL || "NOT_FOUND~~!!!"

const App = () => {

  if (!AppContext) {
    // Handle the error. Perhaps return null, throw an error, or provide some defaults.
  }
  const {
    //@ts-ignore
    clicks: [clicks],
    //@ts-ignore
    image: [, setImage],
    //@ts-ignore
    maskImg: [, setMaskImg],
   //@ts-ignore
    last_feeds: [last_feeds, setLastFeeds]
  } = useContext(AppContext);

  const [model, setModel] = useState<InferenceSession | null>(null); // ONNX model
  const [tensor, setTensor] = useState<Tensor | null>(null); // Image embedding tensor

  // The ONNX model expects the input to be rescaled to 1024. 
  // The modelScale state variable keeps track of the scale values.
  const [modelScale, setModelScale] = useState<modelScaleProps | null>(null);

  // Initialize the ONNX model. load the image, and load the SAM
  // pre-computed image embedding
  useEffect(() => {
    // Initialize the ONNX model
    console.log(process.env)
    const initModel = async () => {
      try {
        if (MODEL_DIR === undefined) return;
        const URL: string = MODEL_DIR;
        const model = await InferenceSession.create(URL);
        setModel(model);
      } catch (e) {
        console.log(e);
      }
    };
    initModel();

    // Load the image
    const url = new URL(IMAGE_PATH, location.origin);
    loadImage(url);
  }, []);

  const loadImage = async (url: URL) => {
    try {
      const img = new Image();
      img.src = url.href;
      img.onload = async () => {
        const { height, width, samScale } = handleImageScale(img);
        setModelScale({
          height: height,  // original image height
          width: width,  // original image width
          samScale: samScale, // scaling factor for image which has been resized to longest side 1024
        });
        img.width = width; 
        img.height = height; 
        setImage(img);
        const formData = new FormData();
        formData.append('file', image_as_base64(img));
        formData.append('orig_url', String(url))
        const response_with_url = await fetch(EMBEDDER_URL, {
            method: 'POST',
            body: formData
        });
        const server_response: ServerResponse = await response_with_url.json();
        console.log('response_with_url', server_response)

        const download_path = server_response['download_path']

        // 1. Download the file from the URL
        const response = await fetch(download_path);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        //const blob = await response.blob();
        //console.log('blob', blob)
        // Create a hidden <a> element
        //const a = document.createElement('a');
        //document.body.appendChild(a);
        //a.style.display = 'none';

        // Use the blob to create an object URL
        //const url = window.URL.createObjectURL(blob);

        //a.href = download_path;
        //a.download = "cached.npy" //+download_path; // You can determine the filename, perhaps from content-disposition header

        //a.click();
        const tensor_f = await loadNpyTensor(download_path, 'float32')
        setTensor(tensor_f)

      }
    } catch (error) {
      console.log(error);
    }
  };


  // Run the ONNX model every time clicks has changed
  useEffect(() => {
    runONNX();
  }, [clicks]);

  const runONNX = async () => {
    try {
      if (
        model === null ||
        clicks === null ||
        tensor === null ||
        modelScale === null ||
        clicks.length == 0
      ) {
        console.log("Setting to null")
        setMaskImg(null);
        return;
      }
      else {
        // Preapre the model input in the correct format for SAM. 
        // The modelData function is from onnxModelAPI.tsx.
        console.log("Running model with clicks", clicks)
        const feeds = modelData({
          clicks,
          tensor,
          modelScale,
        });
        if (feeds === undefined) return;

        var to_save = {
          point_coords: feeds['point_coords'],
          point_labels: feeds['point_labels'],
          orig_im_size: feeds['orig_im_size'],
          mask_input: feeds['mask_input'],
          has_mask_input: feeds['has_mask_input'], 
        }
        var a = JSON.stringify(to_save)
        setLastFeeds(to_save)
        console.log('feeds', a.length)

        // Run the SAM ONNX model with the feeds returned from modelData()
        const results = await model.run(feeds);
        const output = results[model.outputNames[0]];
        // The predicted mask returned from the ONNX model is an array which is 
        // rendered as an HTML image using onnxMaskToImage() from maskUtils.tsx.
        setMaskImg(onnxMaskToImage(output.data, output.dims[2], output.dims[3]));
      }
    } catch (e) {
      console.log(e);
    }
  };

  return <Stage />;
};

export default App;
