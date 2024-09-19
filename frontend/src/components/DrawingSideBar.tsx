export function DrawingSideBar({onSelectBackgroundColor, changeStyle}:{readonly onSelectBackgroundColor: React.Dispatch<React.SetStateAction<string>>, changeStyle: (key:string)=>void}) {
    return <div className="flex flex-col w-44 shadow-lg rounded-lg p-5 border bg-white">
        <div className="flex gap-x-2">
            <button className="w-5 h-5 bg-blue-700 cursor-pointer" onClick={()=>{
                // onSelectBackgroundColor("blue")
                changeStyle("blue")
            }}>
            
            </button>
            <button className="w-5 h-5 bg-red-600 cursor-pointer" onClick={()=>{
                // onSelectBackgroundColor("red")
                changeStyle("red")
            }}>
                
            </button>
            <button className="w-5 h-5 bg-yellow-300 cursor-pointer" onClick={()=>{
                // onSelectBackgroundColor("yellow")
                changeStyle("yellow")
            }}>
                
            </button>
        </div>
    </div>
}