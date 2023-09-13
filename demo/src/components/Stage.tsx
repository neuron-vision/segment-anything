// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import React, { useContext, useEffect, KeyboardEvent } from "react";
import { useRef } from 'react';
import { Button, TextField } from '@mui/material';


import * as _ from "underscore";
import Tool from "./Tool";
import { modelInputProps, segmentsRows } from "./helpers/Interfaces";
import AppContext from "./hooks/createContext";
import { ReactNotifications, Store } from 'react-notifications-component'
import 'react-notifications-component/dist/theme.css'
import "./app.css"
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';


const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));


//import ImageDisplay from './ImageDisplay';
interface KeyboardListenerComponentProps {
  children: React.ReactNode;
}


function warn(message:string, title:string){
  Store.addNotification({
    title: title,
    type: "warning",
    insert: "top",
    message: message,
    container: "top-right",
    animationIn: ["animate__animated", "animate__fadeIn"],
    animationOut: ["animate__animated", "animate__fadeOut"],
    dismiss: {
      duration: 3000,
      onScreen: true
    }
  });
}



function inform(message:string, title:string){
  Store.addNotification({
    title: title,
    type: "success",
    insert: "top",
    message: message,
    container: "top-right",
    animationIn: ["animate__animated", "animate__fadeIn"],
    animationOut: ["animate__animated", "animate__fadeOut"],
    dismiss: {
      duration: 3000,
      onScreen: true
    }
  });
}

const Stage = () => {

  const text_name_ref = useRef()

  const {
    clicks: [get_clicks, setClicks],
    image: [image],
    last_feeds: [last_feeds, setLastFeeds],
    tableRows: [rows, setRows]  
   } = useContext(AppContext)!;

  const remove_last_click =()=>{
    if (get_clicks && get_clicks.length>1) {
      let newArray = get_clicks.slice(0, -1);
      console.log(newArray)
      setClicks(newArray);    
    } else {
      setClicks([])
    }    
  }
  const handleKeyDown = (event:KeyboardEvent) => {
    console.log('Key pressed:', event.key);
    if (event.key == '2'){
    } else if (event.key === "Enter"){
        /* @ts-ignore */
        const the_name = text_name_ref.current?.value
        if (the_name && the_name.length) {
          console.log('Enter was pressed', the_name)

          if (!get_clicks || get_clicks.length==0){
            warn("Please select points first", "No points were selected.")
            return
          }
          if (!last_feeds) {
            warn("No feeds were find to save", 'oops')
            return
          }

          const big_row: segmentsRows = {
            clicks: get_clicks,
            feed: last_feeds,
            name: the_name,
            id:the_name+"-"+rows.length,
            num_points:get_clicks.length
          } 
          setRows([...rows, big_row])
        }

    }
  
  };


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

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 300},
    { field: 'num_points', headerName: '#Points', width: 300 },
  ];


  return (
    <>   
      <ReactNotifications/>
      <Grid container spacing={2}
      columnSpacing={{ xs: 1, sm: 2, md: 3 }}
       tabIndex={0} 
       onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) =>  handleKeyDown(e)}>
      <Grid item xs={5}>
      <Item>
        <Button onClick={remove_last_click}> Pop last click </Button>
      </Item>
      </Grid>
      <Grid item xs={5}>
        <Item>
        <TextField id="standard-basic" label="save with name" variant="standard" inputRef={text_name_ref} />
        </Item>
        </Grid>

        <Grid item xs={9} >
        <Item className={`${flexCenterClasses} relative w-[90%] h-[90%]`}>
        <Tool handleMouseMove={handleMouseMove} />
        </Item>
        </Grid>

        <Grid item xs={12}>
        <Item> 
        <DataGrid
        rows={rows}
        columns={columns}
        pageSizeOptions={[10, 100]}
      />          
        </Item>
        </Grid>

      </Grid>

    </>
  );
};

export default Stage;
