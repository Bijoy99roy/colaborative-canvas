// src/App.tsx
import React, { useRef, useState, useEffect } from 'react';
import rough from "roughjs";
import * as Y from "yjs";
import { WebrtcProvider } from 'y-webrtc';

const generator = rough.generator();

export function DrawingCanvas() {
  const ydoc = useRef(new Y.Doc()).current;
  const ystrokes = ydoc.getArray('strokes');

  const [drawing, setDrawing] = useState(false);
  const [localElements, setLocalElements] = useState<any[]>([]); 

  useEffect(() => {
    const provider = new WebrtcProvider("awesome1", ydoc);
    const canvass = document.getElementById("canvas") as HTMLCanvasElement;
    const context = canvass.getContext("2d");
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

  const handleMouseDown = (event: React.MouseEvent) => {
    setDrawing(true);
    const { clientX, clientY } = event;
    const element = createElement(clientX, clientY, clientX, clientY);
    setLocalElements([element]);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!drawing) return;
    const { clientX, clientY } = event;
    const index = localElements.length - 1;
    const { x1, y1 } = localElements[index];
    const updatedElement = createElement(x1, y1, clientX, clientY);
    console.log(localElements)
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

  function createElement(x1: number, y1: number, x2: number, y2: number) {
    const roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
    return { x1, y1, x2, y2, roughElement };
  }

  return (
    <canvas id="canvas" width={window.innerWidth} height={window.innerHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
};

