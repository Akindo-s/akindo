"use client";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function ProgressBar({ currentStep, totalSteps, labels = [] }: ProgressBarProps) {
  const percent = Math.round(((currentStep) / totalSteps) * 100);

  return (
    <div className="w-full flex flex-col gap-2 mb-4">
      {/* Labels */}
      {labels.length > 0 && (
        <div className="flex justify-between px-0.5">
          {labels.map((label, i) => (
            <span
              key={i}
              className={`text-[10px] font-semibold uppercase tracking-wider transition-colors duration-300 ${
                i < currentStep
                  ? "text-[#DAA520]"
                  : i === currentStep
                  ? "text-[#DAA520]"
                  : "text-stone-300"
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Track */}
      <div className="relative w-full h-2 bg-stone-100 rounded-full overflow-hidden">
        {/* Animated fill */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            width: `${percent}%`,
            background: "linear-gradient(90deg, #F0D275 0%, #DAA520 60%, #C1901D 100%)",
            boxShadow: "0 0 8px 1px rgba(218,165,32,0.45)",
          }}
        />
        {/* Shimmer overlay */}
        <div
          className="absolute top-0 left-0 h-full rounded-full opacity-60 animate-[shimmer_1.8s_infinite]"
          style={{
            width: `${percent}%`,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
        />
      </div>

      {/* Step dots */}
      <div className="flex justify-between px-0.5">
        {Array.from({ length: totalSteps + 1 }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-500 ease-out ${
              i <= currentStep
                ? "bg-[#DAA520] scale-125 shadow-[0_0_6px_2px_rgba(218,165,32,0.4)]"
                : "bg-stone-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
