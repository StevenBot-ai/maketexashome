"use client";

import { useState } from "react";

interface SliderQuestionProps {
  name: string;
  label: string;
  lowLabel: string;
  highLabel: string;
}

export function SliderQuestion({ name, label, lowLabel, highLabel }: SliderQuestionProps) {
  const [value, setValue] = useState(3);

  return (
    <div className="mb-8">
      <label htmlFor={name} className="block text-lg font-medium mb-2">
        {label}
      </label>
      <input
        type="range"
        id={name}
        name={name}
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-sm text-gray-500 mt-1">
        <span>{lowLabel}</span>
        <span className="font-semibold">{value}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
