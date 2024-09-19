import React, { useState, useEffect, useRef } from 'react';
import rough from "roughjs";
import * as Y from "yjs";
import { WebrtcProvider } from 'y-webrtc';
import { v4 as uuidv4 } from 'uuid';
import { DrawingElementBar } from './DrawingElementBar';
import { DrawingSideBar } from './DrawingSideBar';

//TODO: Fix all the types 

const generator = rough.generator();
const ydoc = new Y.Doc();

function distance(a: any, b: any) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

function nearPoint(x: number, y: number, x1: number, y1: number, name: string) {
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
}

function positionWithinElement(x: number, y:number, element: any) {
  
  if(element.toArray().length < 1) return;
  const {elementType, x1, x2, y1, y2} = element.toArray()[0] 
  if (elementType === "rectangle") {
    const topLeft = nearPoint(x, y, x1, y1, "tl")
    const topRight = nearPoint(x, y, x2, y1, "tr")
    const bottomLeft = nearPoint(x, y, x1, y2, "bl")
    const bottomRight = nearPoint(x, y, x2, y2, "br")

    const inside =  x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
    return topLeft ?? topRight ?? bottomLeft ?? bottomRight ?? inside;
  } else if (elementType === "line") {
    const a = { x: x1, y: y1}
    const b = { x: x2, y: y2} 
    const c = { x, y }
    const offset = distance(a, b) - (distance(a, c) + distance(b, c))
    const start = nearPoint(x, y, x1, y1, "start")
    const end = nearPoint(x, y, x2, y2, "end")
    const inside =  Math.abs(offset) < 1  ? "inside" : null

    return start ?? end ?? inside
    
  } else if (elementType === "ellipse") {
    const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const distance = Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2));

    const topLeft = nearPoint(x, y, x1 -  (x2 - x1), y1 + (y1 - y2), "tl")
    const topRight =  nearPoint(x, y, x2, y1 - (y2 - y1), "tr")
    const bottomLeft = nearPoint(x, y, x1 - (x2 - x1), y2, "bl")
    const bottomRight = nearPoint(x, y, x2, y2, "br")

    const inside =  distance <= radius  ? "inside" : null;
    
    return topLeft ?? topRight ?? bottomLeft ?? bottomRight ?? inside;
  }
}

function getElementAyPosition(x: number, y:number, elements: any) {
  return elements.toArray()
  .map((element: any) => ({stroke:element, position: positionWithinElement(x,y,element)}))
  .find((element: any)=> element.position !== null);
}

export function DrawingCanvas() {
  const [action, setAction] = useState('none');
  const [localElements, setLocalElements] = useState<any[]>([]);
  const [selectedElement, setSelectedElement] = useState("selection");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const provider = useRef<any>(null);
  const awareness = useRef<any>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>("white");
  const [isMouseUp, setIsMouseUp] = useState<boolean>(true);


  const ystrokes: Y.Array<Y.Array<any>> = ydoc.getArray('strokes');
  

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
    setIsMouseUp(false)
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;
    if (awareness.current){

      awareness.current.setLocalStateField('pos', { x: clientX, y: clientY })


      
    }
    if (selectedElement == "selection"){
      
      const element = getElementAyPosition(clientX, clientY, ystrokes)
 
      if (element) {
        
        const offsetX = clientX - element.stroke.toArray()[0]["x1"]
        const offsetY = clientY - element.stroke.toArray()[0]["y1"]
 
        const updatedElement = {...element.stroke.toArray()[0], position:element.position, offsetX, offsetY}
        setSelectedElementId(updatedElement)
        setSelectedItem(updatedElement)
        if (element.position === "inside"){
          setAction("moving")
        } else {
          setAction("resize")
        }
        
      }
    } else {
      setAction('drawing');
    
    const id = ystrokes.toArray().length
    const element = createElement(id, clientX, clientY, clientX, clientY, selectedElement);
   
  
    ydoc.transact(() => {
      const currentPath = new Y.Array();
      currentPath.push([element]);
   
      ystrokes.push([currentPath]);
    });

    }
    
    
  };

  function updateElements(id:number, x1: number, y1: number, x2: number, y2: number, elementType: string) {

    const updatedElement = createElement(id, x1, y1, x2, y2, elementType);
      ydoc.transact(() => {
        const currentPath = new Y.Array();
        currentPath.push([updatedElement]);
        
        ystrokes.delete(id)
        ystrokes.insert(id, [currentPath]);
        
      });

      const canvass = document.getElementById("canvas") as HTMLCanvasElement;
      const context = canvass.getContext("2d");
      const roughCanvas = rough.canvas(canvass);
      context?.clearRect(0, 0, canvass.width, canvass.height);
      

      ystrokes.toArray().forEach((strokeArray: any) => {

        strokeArray.toArray().forEach((stroke: any) => {
          roughCanvas.draw(stroke.roughElement);

          if (selectedElement !== "selection") return
          if (context && stroke.roughElement.shape === "ellipse"){
              context.beginPath();
            context.arc( stroke.x1 + (stroke.x2 - stroke.x1),  stroke.y1  + (stroke.y1 - stroke.y2), 5, 0, 2 * Math.PI);
            context.stroke();  // Draw the first circle
            context.fillStyle = "#3357FF"
            context.fill();

            context.beginPath()
            context.arc(stroke.x2, stroke.y2, 5, 0, 2 * Math.PI);
            context.stroke();  // Draw the first circle
            context.fillStyle = "#3357FF"
            context.fill();

            context.beginPath()
            context.arc(stroke.x1 - (stroke.x2 - stroke.x1), stroke.y2, 5, 0, 2 * Math.PI);
            context.stroke();  // Draw the first circle
            context.fillStyle = "#3357FF"
            context.fill();

            context.beginPath()
            context.arc(stroke.x2  - 2 * (stroke.x2 - stroke.x1), stroke.y1   + (stroke.y1 - stroke.y2), 5, 0, 2 * Math.PI);
            context.stroke();  // Draw the first circle

            context.fillStyle = "#3357FF"
            context.fill();
          } else if (context && stroke.roughElement.shape === "line") {
            context.beginPath();
            context.arc( stroke.x1,  stroke.y1, 5, 0, 2 * Math.PI);
            context.stroke();  // Draw the first circle
            context.fillStyle = "#3357FF"
            context.fill();

            context.beginPath()
            context.arc(stroke.x2 , stroke.y2, 5, 0, 2 * Math.PI);
            context.stroke();  // Draw the first circle

            context.fillStyle = "#3357FF"
            context.fill();
          } else if(context && stroke.roughElement.shape === "rectangle") {

            context.fillStyle = "#3357FF";
            context.beginPath();
            context.arc(stroke.x1 ,  stroke.y1, 5, 0, 2 * Math.PI);
            context.fill();
            context.stroke();  // Draw the first circle
            context.closePath();

            context.beginPath();
            context.arc(stroke.x2, stroke.y2, 5, 0, 2 * Math.PI);
            context.fill();
            context.stroke();  // Draw the first circle  
            context.closePath();

            context.beginPath();
            context.arc(stroke.x1 , stroke.y2, 5, 0, 2 * Math.PI);
            context.fill();
            context.stroke();  // Draw the first circle
            context.closePath();

            context.beginPath();
            context.arc(stroke.x2, stroke.y1 , 5, 0, 2 * Math.PI);
            context.fill();
            context.stroke();  // Draw the first circle
            context.closePath();
          }

          
        });
      });
      localElements.forEach(localElement => roughCanvas.draw(localElement.roughElement));
  }

  function cursorForPosition(position: string) {
    switch (position) {
      case "tl":
      case "br":
      case "start":
      case "end":
        return "nwse-resize";
      case "tr":
      case "bl":
        return "nesw-resize";
      default:
        return "move"

    }

  }

  function resizeCoordinates(clientX: number, clientY: number, position: string, coordinates: any): {x1: number; y1: number; x2: number; y2: number}{
    const {x1, y1, x2, y2} = coordinates
    switch(position){
      case "tl":
      case "start":
        return {x1: clientX, y1: clientY , x2: x2, y2};
      case "tr":
        return {x1, y1: clientY, x2: clientX, y2};
      case "bl":
        return {x1: clientX, y1, x2, y2: clientY};
      case "br":
      case "end":
        return {x1, y1, x2: clientX, y2: clientY}
      default:
        throw new Error(`Unsupported position`);

    }

  }

  
  function handleMouseMove(event: React.MouseEvent, selectedElement: any) {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;
    console.log(clientX, clientY)

    if (awareness.current){

          awareness.current.setLocalStateField('pos', { x: clientX, y: clientY })

          
        } 
        
    if (selectedElement === "selection") {

      const eventElement = event.currentTarget as HTMLDivElement;
      const element = getElementAyPosition(clientX, clientY, ystrokes);
      // console.log(element.position)
      eventElement.style.cursor =  element ? cursorForPosition(element.position) : "default"
      
      
      
    }
    if (action === "drawing") {

      const index = ystrokes.toArray().length-1;
  
      
      

      const { x1, y1 } = ystrokes.toArray()[index].toArray()[0];
    
      updateElements(index, x1, y1, clientX, clientY, selectedElement)
      
 
    } else if(action === "moving") {
      if (selectedElementId){
       
        const {elementType, id, x1, x2, y1, y2, offsetX, offsetY} = selectedElementId
  
 
        const width = x2 - x1;
        const height = y2 - y1;
        const newX1 = clientX - offsetX;
        const newY1 = clientY - offsetY;
        updateElements(id, newX1, newY1, newX1 + width, newY1 + height, elementType)
      }
      
    } else if (action === "resize") {

      if (selectedElementId){

        let { elementType, id, position, x1, x2, y1, y2 } = selectedElementId;
        const coordinates: any = { x1, x2, y1, y2 };
        
        // Reassign x1, y1, x2, y2 without redeclaring them
        ({ x1, y1, x2, y2 } = resizeCoordinates(clientX , clientY, position, coordinates));
        console.log(clientX, clientY)
        console.log(`x1: ${x1} y1: ${y1}`)
        if (elementType === "ellipse") {
          switch(position){
            case "tl":
              updateElements(id, x1 + (x2 - x1)/2, y1 + (y2 - y1)/2, x2, y2, elementType);
              break;
            case "tr":
              updateElements(id, x1, y1 + (y2 - y1)/2, x2, y2, elementType);
              break;
            case "bl":
              updateElements(id, x1 + (x2 - x1)/2, y1, x2, y2, elementType);
              break
            default:
              updateElements(id, x1, y1, x2, y2, elementType);
              break
          }
          
        } else {
          updateElements(id, x1 , y1 , x2, y2, elementType);
        }
        
      }
    }
  
    

  };

  function changeStyle(color: string){
    setBackgroundColor(color)
    if (selectedItem){

      let { elementType, id, position, x1, x2, y1, y2 } = selectedItem;
      updateElements(id, x1 , y1 , x2, y2, elementType);
    }
  }

  function adjustElementCoordinates(element: any): {x1: number; y1: number; x2: number; y2: number} {
    const {x1, y1, x2, y2, elementType} = element;
    if(elementType === "rectangle") {
      const minX = Math.min(x1, x2)
      const maxX = Math.max(x1, x2)
      const minY = Math.min(y1, y2)
      const maxY = Math.max(y1, y2)
      return {x1: minX, y1: minY, x2: maxX, y2: maxY}
    } else if (elementType === "line") {
      if (x1 < x2 || (x1 === x2 && y1 < y2)) {
        return { x1, y1, x2, y2}
      } else {
        return {x1: x2, y1: y2, x2: x1, y2: y1}
      }
    }
    throw new Error(`Unsupported elementType: ${elementType}`);
  }

  const handleMouseUp = () => {
    setIsMouseUp(true)
    setAction("none");
    setSelectedElementId(null)
    setLocalElements([]);
    const index = ystrokes.toArray().length-1;
    if (index<0) return
    const { id, elementType } = ystrokes.toArray()[index].toArray()[0]
    if (action === "drawing") {
      const {x1, y1, x2, y2 } = adjustElementCoordinates(ystrokes.toArray()[index].toArray()[0])
 
      updateElements(id, x1, y1, x2, y2, elementType)
      

    }
    
    
    
    

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
        roughElement = generator.line(x1, y1, x2, y2, { stroke: "black"});
        break;
      case "rectangle":
        roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1, { fill: backgroundColor , fillStyle: "solid"});
        break;
      case "circle":
        roughElement = generator.circle(x1, y1, Math.abs(x2 - x1), { fill: backgroundColor , fillStyle: "solid"});
        break;
      case "ellipse":
        roughElement = generator.ellipse(x1, y1, 2 * Math.abs(x2 - x1), 2 * Math.abs(y2 - y1), { fill: backgroundColor , fillStyle: "solid"});
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
    <div className={`absolute top-[100px] left-[50px] z-[100] ${isMouseUp ? "" : "pointer-events-none"}`} >
          <DrawingSideBar onSelectBackgroundColor={setBackgroundColor} changeStyle={changeStyle}/>
        </div>
      <canvas className='-z-50' id="canvas" width={window.innerWidth} height={window.innerHeight}
        onMouseDown={(e) => handleMouseDown(e, selectedElement)}
        onMouseMove={(e) => handleMouseMove(e, selectedElement)}
        onMouseUp={handleMouseUp}
      >
        
      </canvas>
    </>
  );
}


