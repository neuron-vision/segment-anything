// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import React, { useContext, useEffect, KeyboardEvent } from "react";

import * as _ from "underscore";
import Tool from "./Tool";
import { modelInputProps } from "./helpers/Interfaces";
import AppContext from "./hooks/createContext";
import { ReactNotifications, Store } from 'react-notifications-component'
import 'react-notifications-component/dist/theme.css'

//import ImageDisplay from './ImageDisplay';
interface KeyboardListenerComponentProps {
  children: React.ReactNode;
}



const Stage = () => {



  const handleKeyDown = (event:KeyboardEvent) => {
    console.log('Key pressed:', event.key);
    if (event.key == '2'){
      console.log('2 removed the last click')
      if (get_clicks && get_clicks.length>1) {
        let newArray = get_clicks.slice(0, -1);
        console.log(newArray)
        setClicks(newArray);    
      } else {
        setClicks([])
      }
  
      Store.addNotification({
        title: "Removed last click",
        message: String(event.key),
        type: "success",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: {
          duration: 500,
          onScreen: true
        }
      });
      }
  
  };

  const {
    clicks: [get_clicks, setClicks],
    image: [image],
  } = useContext(AppContext)!;

  const getClick = (x: number, y: number): modelInputProps => {
    const clickType = 1;
    return { x, y, clickType };
  };

  // Get mouse position and scale the (x, y) coordinates back to the natural
  // scale of the image. Update the state of clicks with setClicks to trigger
  // the ONNX model to run and generate a new mask via a useEffect in App.tsx
  const handleMouseMove = _.throttle((e: any) => {
    let el = e.nativeEvent.target;
    const rect = el.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    const imageScale = image ? image.width / el.offsetWidth : 1;
    x *= imageScale;
    y *= imageScale;
    const new_click = getClick(x, y);
    if (new_click && new_click.x && new_click.y) {
      console.log("Got click ", new_click)
      if (get_clicks) {
        let newArray = [...get_clicks, new_click];
        setClicks(newArray);  
      } else {
        setClicks([new_click]);  
      }
    } else {
      console.log('Error no click found', new_click)
    }
  }, 15);

  const flexCenterClasses = "flex items-center justify-center";
  return (
    <>   
    <div className={`${flexCenterClasses} w-full h-full`} tabIndex={0} onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) =>  handleKeyDown(e)}>
      <ReactNotifications/>
      <div className={`${flexCenterClasses} relative w-[90%] h-[90%]`}>
        <Tool handleMouseMove={handleMouseMove} />
      </div>
    </div>
    </>
  );
};

export default Stage;
