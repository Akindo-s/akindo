import { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

export function StarIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={`icon ${className}`}
      {...props}
    >
      <path fill={color} d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

export function StarHalfIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={`icon ${className}`}
      {...props}
    >
      <path fill={color} d="m22 9.24l-7.19-.62L12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21L12 17.27L18.18 21l-1.63-7.03zM12 15.4V6.1l1.71 4.04l4.38.38l-3.32 2.88l1 4.28z" />
    </svg>
  );
}

export function StarPurpleIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={`icon ${className}`}
      {...props}
    >
      <path fill={color} d="m12 8.89l.94 3.11h2.82l-2.27 1.62l.93 3.01L12 14.79l-2.42 1.84l.93-3.01L8.24 12h2.82zM12 2l-2.42 8H2l6.17 4.41L5.83 22L12 17.31L18.18 22l-2.35-7.59L22 10h-7.58z" />
    </svg>
  );
}
