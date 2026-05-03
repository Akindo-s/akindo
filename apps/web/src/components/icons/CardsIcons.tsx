import { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

export function AddCardIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={`icon ${className}`}
      {...props}
    >
      <path fill={color} d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h10v-2H4v-6h18V6c0-1.11-.89-2-2-2m0 4H4V6h16zm4 9v2h-3v3h-2v-3h-3v-2h3v-3h2v3z" />
    </svg>
  );
}

export function CreditCardIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={`icon ${className}`}
      {...props}
    >
      <path fill={color} d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2m-1 14H5c-.55 0-1-.45-1-1v-5h16v5c0 .55-.45 1-1 1m1-10H4V6h16z" />
    </svg>
  );
}

export function CreditCardOffIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={`icon ${className}`}
      {...props}
    >
      <path fill={color} d="M21.19 21.19L2.81 2.81a.996.996 0 0 0-1.41 0C1 3.2 1 3.83 1.39 4.22l.84.84c-.14.28-.22.6-.22.94L2 18c0 1.11.89 2 2 2h13.17l2.61 2.61c.39.39 1.02.39 1.41 0s.39-1.03 0-1.42M4 12V8h1.17l4 4zm2.83-8H20c1.11 0 2 .89 2 2v12c0 .34-.08.66-.23.94L14.83 12H20V8h-9.17z" />
    </svg>
  );
}

export function TwotoneCreditCardIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={`icon ${className}`}
      {...props}
    >
      <path fill={color} d="M4 12h16v6H4zm0-6h16v2H4z" opacity=".3"/>
      <path fill={color} d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2m0 14H4v-6h16zm0-10H4V6h16z" />
    </svg>
  );
}
