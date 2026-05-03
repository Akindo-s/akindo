import { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

export function EmailIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 4l-8 5l-8-5V6l8 5l8-5z"/>
    </svg>
  );
}

export function PasswordIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48l1.3-.75l-.85-1.48H7v-1.5H5.3l.85-1.47L4.85 7L4 8.47L3.15 7l-1.3.75l.85 1.47H1v1.5h1.7l-.85 1.48zm6.7-.75l1.3.75l.85-1.48l.85 1.48l1.3-.75l-.85-1.48H15v-1.5h-1.7l.85-1.47l-1.3-.75L12 8.47L11.15 7l-1.3.75l.85 1.47H9v1.5h1.7zM23 9.22h-1.7l.85-1.47l-1.3-.75L20 8.47L19.15 7l-1.3.75l.85 1.47H17v1.5h1.7l-.85 1.48l1.3.75l.85-1.48l.85 1.48l1.3-.75l-.85-1.48H23z"/>
    </svg>
  );
}

export function LogInIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M9 2h9c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2v-2h2v2h9V4H9v2H7V4c0-1.1.9-2 2-2"/>
      <path fill={color} d="M10.09 15.59L11.5 17l5-5l-5-5l-1.41 1.41L12.67 11H3v2h9.67z"/>
    </svg>
  );
}

export function PersonAddIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <circle cx="9" cy="8" r="2" fill={color} opacity=".3"/>
      <path fill={color} d="M9 16c-2.7 0-5.8 1.29-6 2h12c-.22-.72-3.31-2-6-2" opacity=".3"/>
      <path fill={color} d="M9 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4m-6 4c.2-.71 3.3-2 6-2c2.69 0 5.78 1.28 6 2zm17-8V7h-2v3h-3v2h3v3h2v-3h3v-2zM9 12c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4m0-6c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2"/>
    </svg>
  );
}

export function EyeIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M12 6.5A9.77 9.77 0 0 0 3.18 12c1.65 3.37 5.02 5.5 8.82 5.5s7.17-2.13 8.82-5.5A9.77 9.77 0 0 0 12 6.5m0 10c-2.48 0-4.5-2.02-4.5-4.5S9.52 7.5 12 7.5s4.5 2.02 4.5 4.5s-2.02 4.5-4.5 4.5" opacity=".3"/>
      <path fill={color} d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5m0 13A9.77 9.77 0 0 1 3.18 12C4.83 8.63 8.21 6.5 12 6.5s7.17 2.13 8.82 5.5A9.77 9.77 0 0 1 12 17.5m0-10c-2.48 0-4.5 2.02-4.5 4.5s2.02 4.5 4.5 4.5s4.5-2.02 4.5-4.5s-2.02-4.5-4.5-4.5m0 7a2.5 2.5 0 0 1 0-5a2.5 2.5 0 0 1 0 5"/>
    </svg>
  );
}

export function AddAPhotoIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M3 4V1h2v3h3v2H5v3H3V6H0V4zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5s-5 2.24-5 5s2.24 5 5 5m-3.2-5c0 1.77 1.43 3.2 3.2 3.2s3.2-1.43 3.2-3.2s-1.43-3.2-3.2-3.2s-3.2 1.43-3.2 3.2"/>
    </svg>
  );
}
