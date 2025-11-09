"use client";

interface TouchSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  formatValue?: (value: number) => string;
}

export function TouchSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  formatValue = (val) => `${val}`,
}: TouchSliderProps) {
  return (
    <div className="space-y-3 p-3 sm:p-4 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <div className="px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold min-w-[60px] text-center">
          {formatValue(value)}
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className={`touch-slider w-full h-2 sm:h-3 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            disabled ? "" : "slider-active"
          }`}
          style={{
            background: disabled
              ? undefined
              : `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${
                  ((value - min) / (max - min)) * 100
                }%, rgb(229, 231, 235) ${
                  ((value - min) / (max - min)) * 100
                }%, rgb(229, 231, 235) 100%)`,
          }}
        />
        <style jsx global>{`
          .touch-slider::-webkit-slider-thumb {
            appearance: none;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: rgb(59, 130, 246);
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
            transition: all 0.2s;
          }
          .touch-slider::-webkit-slider-thumb:hover {
            transform: scale(1.15);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
          }
          .touch-slider::-webkit-slider-thumb:active {
            transform: scale(1.25);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5);
          }
          .touch-slider::-moz-range-thumb {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: rgb(59, 130, 246);
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
            transition: all 0.2s;
          }
          .touch-slider::-moz-range-thumb:hover {
            transform: scale(1.15);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
          }
          .touch-slider::-moz-range-thumb:active {
            transform: scale(1.25);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5);
          }
          .touch-slider:disabled::-webkit-slider-thumb {
            background: rgb(156, 163, 175);
            cursor: not-allowed;
          }
          .touch-slider:disabled::-moz-range-thumb {
            background: rgb(156, 163, 175);
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  );
}

