import { useState, InputHTMLAttributes } from "react";
import { EyeIcon } from "./icons/AuthIcons";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
  Icono?: React.ComponentType<{ className?: string }> | null;
  label?: string;
  type?: string;
  name?: string;
}

export function Input({ placeholder, Icono, label, type = "text", name, className = "", ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={`flex flex-col gap-1 w-full text-left ${className}`}>
      {label && (
        <label className="text-xs font-medium text-stone-600 select-none">
          {label}
        </label>
      )}
      <div className="flex flex-row items-center bg-[#FCF8F4] border border-[#E8DEC1]/60 rounded-xl px-3 h-fit focus-within:border-[#DAA520] transition-colors gap-3 w-full">
        {Icono && (
          <Icono className="text-stone-700 w-5 h-5 flex-shrink-0" />
        )}
        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          name={name}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-stone-800 text-xs  placeholder-stone-400 outline-none w-full py-1"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-stone-500 hover:text-stone-700 flex-shrink-0 outline-none cursor-pointer"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
