import React, { useState, useEffect, useRef } from 'react';
import rough from "roughjs";
import * as Y from "yjs";
import { WebrtcProvider } from 'y-webrtc';
import { v4 as uuidv4 } from 'uuid';
import { DrawingElementBar } from './DrawingElementBar';

const generator = rough.generator();
const ydoc = new Y.Doc();

function distance(a: any, b: any) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

function isWithinElement(x: number, y:number, element: any) {
  
  if(element.toArray().length < 1) return;
  console.log(element.toArray()[0])
  const {elementType, x1, x2, y1, y2} = element.toArray()[0] 
  if (elementType === "rectangle") {
    const minX = Math.min(x1, x2)
    const maxX = Math.max(x1, x2)
    const minY = Math.min(y1, y2)
    const maxY = Math.max(y1, y2)

    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  } else if (elementType === "line") {
    const a = { x: x1, y: y1}
    const b = { x: x2, y: y2} 
    const c = { x, y }
    const offset = distance(a, b) - (distance(a, c) + distance(b, c))
    return Math.abs(offset) < 1
    
  } else if (elementType === "circle") {
      const a = 1
  }
}

function getElementAyPosition(x: number, y:number, elements: any) {
  return elements.toArray().find((element: any) => isWithinElement(x,y,element))
}

export function DrawingCanvas() {
  const [action, setAction] = useState('none');
  const [localElements, setLocalElements] = useState<any[]>([]);
  const [selectedElement, setSelectedElement] = useState("selection");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<any>(null);
  const provider = useRef<any>(null);
  const awareness = useRef<any>(null);


  const ystrokes = ydoc.getArray('strokes');
  

  useEffect(() => {
    // Refer to: https://www.youtube.com/watch?v=Dkn72yYEqNk by Y community

    // Retrieve session ID from URL parameters
    const params = new URLSearchParams(window.location.search);
    const sessionParamId = params.get('session');
    function getRandomValueFromArray(arr:string[]) {
      const randomIndex = Math.floor(Math.random() * arr.length);
      return arr[randomIndex];
    }
    
    
    if (sessionParamId) {
      setSessionId(sessionParamId);
    }

    if (sessionId) {
      provider.current = new WebrtcProvider(sessionId, ydoc);
      const canvass = document.getElementById("canvas") as HTMLCanvasElement;
      const roughCanvas = rough.canvas(canvass);
      const usernames = [
        "PixelPainter",
        "ArtisticAce",
        "CanvasWizard",
        "SketchyScribe",
        "CreativeBrush",
        "AbstractArtist",
        "ColorCrafters",
        "DesignDynamo",
        "InkImpressionist",
        "BrushMaster",
        "ShadeShifter",
        "PalettePro",
        "DoodleDesigner",
        "GraphiteGuru",
        "CharcoalChic"
      ];
      const colorHexValues = [
        "#FF5733",  // Fiery Red
        "#33FF57",  // Vibrant Green
        "#3357FF",  // Bright Blue
        "#FF33A6",  // Hot Pink
        "#FF8F33",  // Orange
        "#33FFF2",  // Aqua Blue
        "#D433FF",  // Electric Purple
        "#FFD433",  // Sunflower Yellow
        "#33FF8F",  // Mint Green
        "#FF3333",  // Bold Red
        "#33A6FF",  // Sky Blue
        "#FF33D4",  // Fuchsia
        "#75FF33",  // Lime Green
        "#FF5733",  // Coral
        "#3357FF"   // Royal Blue
      ];
      awareness.current = provider.current.awareness
      
      if (awareness){
        console.log("awareness")
        awareness.current.setLocalStateField('user', {name: getRandomValueFromArray(usernames), color: getRandomValueFromArray(colorHexValues)})
        awareness.current.on('update', (event:any) => {

          const context = canvass.getContext("2d");
          context?.clearRect(0, 0, canvass.width, canvass.height);
        
          // Redraw all elements
          ystrokes.toArray().forEach((strokeArray: any) => {
            strokeArray.toArray().forEach((stroke: any) => {
              roughCanvas.draw(stroke.roughElement);
            });
          });
        
          localElements.forEach(localElement => roughCanvas.draw(localElement.roughElement));
          
          // Draw remote cursors
          awareness.current.getStates().forEach((state:any, clientID:any) => {
            if (clientID === awareness.current.clientID) {
              return;
            }
            const pos = state.pos;
            if (!pos) {
              return;
            }
            if (context){
              context.beginPath();
              context.arc(pos.x, pos.y, 5, 0, 2 * Math.PI);
              context.fillStyle = state.user.color;
              context.fill();
            }
            
          });
        });
      }
      
      // Draw remote strokes
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
        provider.current.destroy();
        awareness.current = null;
      };
    }
  }, [ydoc, sessionId, ystrokes]);

  const handleMouseDown = (event: React.MouseEvent, selectedElement: any) => {
    // Below calculation helps in correcting the mouse pointer that is getting offset due to other components
    
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;
    if (awareness.current){

      awareness.current.setLocalStateField('pos', { x: clientX, y: clientY })
      // console.log(awareness.getStates())

      
    }
    if (selectedElement == "selection"){
      
      const element = getElementAyPosition(clientX, clientY, ystrokes)
      if (element) {
        setAction("moving")
        setSelectedElementId(element)
      }
    } else {
      setAction('drawing');
    
    const id = localElements.length - 1
    const element = createElement(id, clientX, clientY, clientX, clientY, selectedElement);
    setLocalElements([element]);
    }
    
    
  };

  function updateElements(id:number, x1: number, y1: number, x2: number, y2: number, elementType: string) {
    console.log(localElements)
    const updatedElement = createElement(id, x1, y1, x2, y2, elementType);
      const elementCopy = [...localElements];
      elementCopy[id] = updatedElement;
      setLocalElements(elementCopy);

      const canvass = document.getElementById("canvas") as HTMLCanvasElement;
      const context = canvass.getContext("2d");
      const roughCanvas = rough.canvas(canvass);
      context?.clearRect(0, 0, canvass.width, canvass.height);
      

      ystrokes.toArray().forEach((strokeArray: any) => {
        strokeArray.toArray().forEach((stroke: any) => {
          roughCanvas.draw(stroke.roughElement);
        });
      });
      localElements.forEach(localElement => roughCanvas.draw(localElement.roughElement));
  }

  function handleMouseMove(event: React.MouseEvent, selectedElement: any) {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;
    if (awareness.current){
          console.log("hwllo")
          awareness.current.setLocalStateField('pos', { x: clientX, y: clientY })
          // console.log(awareness.getStates())
          console.log("hii")
          
        } 
        
    if (action === "drawing") {
      const index = localElements.length - 1;
      const { x1, y1 } = localElements[index];
      updateElements(index, x1, y1, clientX, clientY, selectedElement)
      // const updatedElement = createElement(index, x1, y1, clientX, clientY, selectedElement);
      // const elementCopy = [...localElements];
      // elementCopy[index] = updatedElement;
      // setLocalElements(elementCopy);

      // const canvass = document.getElementById("canvas") as HTMLCanvasElement;
      // const context = canvass.getContext("2d");
      // const roughCanvas = rough.canvas(canvass);
      // context?.clearRect(0, 0, canvass.width, canvass.height);
      

      // ystrokes.toArray().forEach((strokeArray: any) => {
      //   strokeArray.toArray().forEach((stroke: any) => {
      //     roughCanvas.draw(stroke.roughElement);
      //   });
      // });

      // localElements.forEach(localElement => roughCanvas.draw(localElement.roughElement));
    } else if(action === "moving") {
      if (selectedElementId){
        console.log(selectedElementId.toArray()[0])
        const {elementType, id, x1, x2, y1, y2} = selectedElementId.toArray()[0] 
        // const { elementType, id, x1, x2, y1, y2 } = selectedElementId;
        console.log(elementType)
        const width = x2 - x1;
        const height = y2 - y1;
        updateElements(id, clientX, clientY, clientX + width, clientY + height, elementType)
      }
      
    }
  
    

  };

  const handleMouseUp = () => {
    if (selectedElementId){
      const {id} = selectedElementId.toArray()[0] 
      // ystrokes.toArray().forEach((strokeArray: any) => {
      //   return strokeArray.toArray().fliter((stroke: any) => {
      //     stroke.id != id
      //   });
      // });
      ydoc.transact(() => {
        const currentPath = new Y.Array();
        currentPath.push(localElements);
        ystrokes.delete(id)
        ystrokes.insert(id, [currentPath]);
      });

    }else{
      ydoc.transact(() => {
        const currentPath = new Y.Array();
        currentPath.push(localElements);
        ystrokes.push([currentPath]);
      });
    }
    console.log(ystrokes.toArray().length)
    
    setAction("none");
    setSelectedElementId(null)
    setLocalElements([]);

  };


function createSession() {
  // TODO: Refactor code for a better approach
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('session', newSessionId);
    window.history.replaceState(null, '', currentUrl.toString());
    navigator.clipboard.writeText(currentUrl.toString());
    alert(`Session created! Share this URL: ${currentUrl.toString()}`);
};

  function createElement(id:number, x1: number, y1: number, x2: number, y2: number, elementType: string) {
    let roughElement;

    switch (elementType) {
      case "line":
        roughElement = generator.line(x1, y1, x2, y2);
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

    return {id,  x1, y1, x2, y2, elementType, roughElement };
  }

  return (
    <>
    <div className='flex justify-between mt-5 mx-5'>
      <span></span>
      <DrawingElementBar onSelectElement={setSelectedElement} />
      <button onClick={createSession} className='my-2 px-2 bg-violet-400 text-white rounded-md'>Share</button>
    </div>
      
      <canvas id="canvas" width={window.innerWidth} height={window.innerHeight}
        onMouseDown={(e) => handleMouseDown(e, selectedElement)}
        onMouseMove={(e) => handleMouseMove(e, selectedElement)}
        onMouseUp={handleMouseUp}
      />
    </>
  );
}
