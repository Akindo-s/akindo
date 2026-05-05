"use client";

interface QuantityStepperProps {
  value: number;
  min?: number;
  suffix?: string;
  disabled?: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
}

export default function QuantityStepper({
  value,
  min = 1,
  suffix = "pz",
  disabled = false,
  onDecrease,
  onIncrease,
}: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-[#D7CCBA] bg-[#F7F1E7]">
      <button
        type="button"
        className="h-9 w-9 text-3xl leading-none text-stone-700 disabled:opacity-50"
        onClick={onDecrease}
        disabled={disabled || value <= min}
        aria-label="Disminuir cantidad"
      >
        -
      </button>
      <span className="min-w-16 px-1 text-center text-lg font-medium text-stone-800">
        {value}
        <span className="ml-1 text-xs text-stone-500">{suffix}</span>
      </span>
      <button
        type="button"
        className="h-9 w-9 text-3xl leading-none text-stone-700 disabled:opacity-50"
        onClick={onIncrease}
        disabled={disabled}
        aria-label="Aumentar cantidad"
      >
        +
      </button>
    </div>
  );
}
