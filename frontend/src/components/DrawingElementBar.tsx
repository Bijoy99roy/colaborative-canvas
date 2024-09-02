import React, { Dispatch, SetStateAction, useState } from 'react';

export function DrawingElementBar({onSelectElement}: {onSelectElement: Dispatch<SetStateAction<string>>}) {

  const [selectedOption, setSelectedOption] = useState('none');

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
    onSelectElement(event.target.value)
  };

  return (
    <div className="flex justify-center">
      <div className="flex gap-2">
        <input
          type="radio"
          name="drawing"
          value="none"
          checked={selectedOption === 'none'}
          onChange={handleOptionChange}
        />
        <label>None</label>

        <input
          type="radio"
          name="drawing"
          value="line"
          checked={selectedOption === 'line'}
          onChange={handleOptionChange}
        />
        <label>Line</label>

        <input
          type="radio"
          name="drawing"
          value="rectangle"
          checked={selectedOption === 'rectangle'}
          onChange={handleOptionChange}
        />
        <label>Rectangle</label>

        <input
          type="radio"
          name="drawing"
          value="ellipse"
          checked={selectedOption === 'ellipse'}
          onChange={handleOptionChange}
        />
        <label>ellipse</label>

        <input
          type="radio"
          name="drawing"
          value="circle"
          checked={selectedOption === 'circle'}
          onChange={handleOptionChange}
        />
        <label>circle</label>
      </div>
    </div>
  );
}
