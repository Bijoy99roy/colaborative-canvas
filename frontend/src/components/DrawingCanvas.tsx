// src/App.tsx
import React, { useState, useEffect } from 'react';
import rough from "roughjs";
import * as Y from "yjs";
import { WebrtcProvider } from 'y-webrtc';
import { DrawingElementBar } from './DrawingElementBar';

const generator = rough.generator();
const ydoc = new Y.Doc()

export function DrawingCanvas() {
  
  const ystrokes = ydoc.getArray('strokes');

  const [drawing, setDrawing] = useState(false);
  const [localElements, setLocalElements] = useState<any[]>([]); 
  const [selectedElement, setSelectedElement] = useState("line")

  

  useEffect(() => {
    const provider = new WebrtcProvider("awesome1", ydoc);
    const canvass = document.getElementById("canvas") as HTMLCanvasElement;
    const roughCanvas = rough.canvas(canvass);

    // Draw the remote strokes
    ystrokes.observe(event => {
      event.changes.delta.forEach(item => {
        if (item.insert && Array.isArray(item.insert)) {
          item.insert.forEach((strokeArray: any) => {
            strokeArray.toArray().forEach((stroke: any) => {
              roughCanvas.draw(stroke.roughElement);
            });
          });
        }
      });
    });

    return () => {
      provider.destroy();
    };
  }, [ydoc, ystrokes]);

  const handleMouseDown = (event: React.MouseEvent, selectedElement:any) => {
    setDrawing(true);
    // Below calculation helps in correcting the mouse pointer that is getting offset due to other components
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;
    const element = createElement(clientX, clientY, clientX, clientY, selectedElement);
    setLocalElements([element]);
  };

  const handleMouseMove = (event: React.MouseEvent, selectedElement:any) => {
    if (!drawing) return;
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;
    const index = localElements.length - 1;
    const { x1, y1 } = localElements[index];
    const updatedElement = createElement(x1, y1, clientX, clientY, selectedElement);
    const elementCopy = [...localElements];
    elementCopy[index] = updatedElement;
    setLocalElements(elementCopy);

    // Draw only the updated element on the canvas
    const canvass = document.getElementById("canvas") as HTMLCanvasElement;
    const context = canvass.getContext("2d");
    const roughCanvas = rough.canvas(canvass);
    context?.clearRect(0, 0, canvass.width, canvass.height); 

    // Redraw all strokes from ystrokes
    ystrokes.toArray().forEach((strokeArray: any) => {
      strokeArray.toArray().forEach((stroke: any) => {
        roughCanvas.draw(stroke.roughElement);
      });
    });


    localElements.forEach(localElement => roughCanvas.draw(localElement.roughElement));
  };

  const handleMouseUp = () => {
    setDrawing(false);
    
    ydoc.transact(() => {
      const currentPath = new Y.Array();
      currentPath.push(localElements);
      ystrokes.push([currentPath]);
    });

    // Clear local elements as they are now synced
    setLocalElements([]);
  };

  function createElement(x1: number, y1: number, x2: number, y2: number, elementType: string) {
    let roughElement;

    switch (elementType) {
      case "line":
        roughElement = generator.line(x1, y1, x2, y2);
        console.log(roughElement)
        break;
      case "rectangle":
        roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
        break;
      case "circle":
        roughElement = generator.circle(x1, y1, Math.abs(x2 - x1));
        break;
      case "ellipse":
        
        roughElement = generator.ellipse(x1, y1, Math.abs(x2 - x1), Math.abs(y2 - y1));
        break;

      default:
        throw new Error(`Unknown element type: ${elementType}`);
    }
  
    return { x1, y1, x2, y2, roughElement };
  }


  return (
    <>
    <DrawingElementBar onSelectElement={setSelectedElement}/>
    <canvas id="canvas" width={window.innerWidth} height={window.innerHeight}
      onMouseDown={(e)=>handleMouseDown(e, selectedElement)}
      onMouseMove={(e)=>handleMouseMove(e, selectedElement)}
      onMouseUp={handleMouseUp}
    />
    </>
  );
};

