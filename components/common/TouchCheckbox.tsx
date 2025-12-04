"use client";

interface TouchCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function TouchCheckbox({
  id,
  checked,
  onChange,
  label,
}: TouchCheckboxProps) {
  return (
    <div className="flex items-center space-x-3 p-3 sm:p-4 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer">
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
          suppressHydrationWarning
        />
        <div
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
            checked
              ? "bg-blue-500 border-blue-500"
              : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-500"
          }`}
          onClick={() => onChange(!checked)}
        >
          {checked && (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <label
        htmlFor={id}
        className="flex-1 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none"
      >
        {label}
      </label>
    </div>
  );
}
