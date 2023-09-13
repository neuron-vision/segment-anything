// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.
const fs = require('fs');

// development config
const { merge } = require("webpack-merge");
const commonConfig = require("./common");

module.exports = merge(commonConfig, {
  mode: "development",
  devServer: {
    https: {
      key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('cert.pem'),
      // If you want browsers to accept your self-signed certificate automatically:
      // ca: fs.readFileSync('path/to/cert.pem')
    },    
    hot: true, // enable HMR on the server
    open: true,
    // These headers enable the cross origin isolation state
    // needed to enable use of SharedArrayBuffer for ONNX 
    // multithreading. 
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
  devtool: "cheap-module-source-map",
});
