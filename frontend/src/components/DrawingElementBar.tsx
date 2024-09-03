import React, { Dispatch, SetStateAction, useState } from 'react';
import { FaMinus, FaRegCircle, FaRegSquare } from 'react-icons/fa';
import { PiCursorFill } from 'react-icons/pi';

export function DrawingElementBar({onSelectElement}: Readonly<{onSelectElement: Dispatch<SetStateAction<string>>}>) {

  const [selectedOption, setSelectedOption] = useState('none');

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
    onSelectElement(event.target.value)
  };

  return (
    <div className="flex justify-center ">
      <div className="mt-5 border rounded-lg shadow-xl">
        <div className='flex gap-x-5 my-3 mx-3 '>
        <input
          type="radio"
          name="drawing"
          value="none"
          checked={selectedOption === 'none'}
          onChange={handleOptionChange}
          className="hidden"
          id="none"
        />
        <label htmlFor="none" className={selectedOption === 'none' ? "cursor-pointer bg-blue-200 p-2 rounded-md": "cursor-pointer p-2 hover:bg-blue-50 rounded-md"}>
          <PiCursorFill color={selectedOption === 'none' ? 'black' : 'grey'}/>
        </label>

        <input
          type="radio"
          name="drawing"
          value="line"
          checked={selectedOption === 'line'}
          onChange={handleOptionChange}
          className="hidden"
          id="line"
        />
        <label htmlFor="line" className={selectedOption === 'line' ? "cursor-pointer bg-blue-200 p-2 rounded-md": "cursor-pointer p-2 hover:bg-blue-50 rounded-md"}>
          <FaMinus color={selectedOption === 'line' ? 'black' : 'grey'} />
        </label>

        <input
          type="radio"
          name="drawing"
          value="rectangle"
          checked={selectedOption === 'rectangle'}
          onChange={handleOptionChange}
          className="hidden"
          id="rectangle"
        />
        <label htmlFor="rectangle" className={selectedOption === 'rectangle' ? "cursor-pointer bg-blue-200 p-2 rounded-md": "cursor-pointer p-2 hover:bg-blue-50 rounded-md"}>
          <FaRegSquare color={selectedOption === 'rectangle' ? 'black' : 'grey'} />
        </label>

        <input
          type="radio"
          name="drawing"
          value="ellipse"
          checked={selectedOption === 'ellipse'}
          onChange={handleOptionChange}
          className="hidden"
          id="ellipse"
        />
        <label htmlFor="ellipse" className={selectedOption === 'ellipse' ? "cursor-pointer bg-blue-200 p-2 rounded-md": "cursor-pointer p-2 hover:bg-blue-50 rounded-md"}>
          <FaRegCircle color={selectedOption === 'ellipse' ? 'black' : 'grey'} />
        </label>

        </div>
        {/* <input
          type="radio"
          name="drawing"
          value="circle"
          checked={selectedOption === 'circle'}
          onChange={handleOptionChange}
          className="hidden"
          id="circle"
        />
        <label htmlFor="circle" className="cursor-pointer">
          <FaCircle color={selectedOption === 'circle' ? 'black' : 'grey'} />
        </label> */}
      </div>
    </div>
  );
}
