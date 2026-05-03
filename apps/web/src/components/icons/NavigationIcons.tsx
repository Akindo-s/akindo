import { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

export function MoreVertIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2m0 2c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2m0 6c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2"/>
    </svg>
  );
}

export function StorefrontIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="m21.9 8.89l-1.05-4.37c-.22-.9-1-1.52-1.91-1.52H5.05c-.9 0-1.69.63-1.9 1.52L2.1 8.89c-.24 1.02-.02 2.06.62 2.88c.08.11.19.19.28.29V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6.94c.09-.09.2-.18.28-.28c.64-.82.87-1.87.62-2.89m-2.99-3.9l1.05 4.37c.1.42.01.84-.25 1.17c-.14.18-.44.47-.94.47c-.61 0-1.14-.49-1.21-1.14L16.98 5zM13 5h1.96l.54 4.52c.05.39-.07.78-.33 1.07c-.22.26-.54.41-.95.41c-.67 0-1.22-.59-1.22-1.31zM8.49 9.52L9.04 5H11v4.69c0 .72-.55 1.31-1.29 1.31c-.34 0-.65-.15-.89-.41a1.42 1.42 0 0 1-.33-1.07m-4.45-.16L5.05 5h1.97l-.58 4.86c-.08.65-.6 1.14-1.21 1.14c-.49 0-.8-.29-.93-.47c-.27-.32-.36-.75-.26-1.17M5 19v-6.03c.08.01.15.03.23.03c.87 0 1.66-.36 2.24-.95c.6.6 1.4.95 2.31.95c.87 0 1.65-.36 2.23-.93c.59.57 1.39.93 2.29.93c.84 0 1.64-.35 2.24-.95c.58.59 1.37.95 2.24.95c.08 0 .15-.02.23-.03V19z"/>
    </svg>
  );
}

export function HomeIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M10 19v-5h4v5c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-7h1.7c.46 0 .68-.57.33-.87L12.67 3.6c-.38-.34-.96-.34-1.34 0l-8.36 7.53c-.34.3-.13.87.33.87H5v7c0 .55.45 1 1 1h3c.55 0 1-.45 1-1"/>
    </svg>
  );
}

export function AllInboxIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M21 3H3v11h18zm-2 6h-4c0 1.62-1.38 3-3 3s-3-1.38-3-3H5V5h14zm-4 7h6v5H3v-5h6c0 1.66 1.34 3 3 3s3-1.34 3-3"/>
    </svg>
  );
}

export function AccountCircleIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6m0 14c-2.03 0-4.43-.82-6.14-2.88a9.95 9.95 0 0 1 12.28 0C16.43 19.18 14.03 20 12 20"/>
    </svg>
  );
}

export function ArrowBackIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`icon ${className}`} {...props}>
      <path fill={color} d="M20 11H7.83l5.59-5.59L12 4l-8 8l8 8l1.41-1.41L7.83 13H20z"/>
    </svg>
  );
}

export function ShoppingCartIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2s-.9-2-2-2M1 3c0 .55.45 1 1 1h1l3.6 7.59l-1.35 2.44C4.52 15.37 5.48 17 7 17h11c.55 0 1-.45 1-1s-.45-1-1-1H7l1.1-2h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A.996.996 0 0 0 20.01 4H5.21l-.67-1.43a.99.99 0 0 0-.9-.57H2c-.55 0-1 .45-1 1m16 15c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2s2-.9 2-2s-.9-2-2-2"/>
    </svg>
  );
}

export function NotificationsIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M12 6.5c-2.49 0-4 2.02-4 4.5v6h8v-6c0-2.48-1.51-4.5-4-4.5" opacity=".3"/>
      <path fill={color} d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2m6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5z"/>
    </svg>
  );
}

export function FilterIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A.998.998 0 0 0 18.95 4H5.04c-.83 0-1.3.95-.79 1.61"/>
    </svg>
  );
}

export function SearchIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14"/>
    </svg>
  );
}

export function VoiceIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3m5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.42 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72z"/>
    </svg>
  );
}

export function NotListedLocationIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M12 2c-4.2 0-8 3.22-8 8.2c0 3.18 2.45 6.92 7.34 11.22c.38.33.95.33 1.33 0C17.55 17.12 20 13.38 20 10.2C20 5.22 16.2 2 12 2m.01 14c-.59 0-1.05-.47-1.05-1.05c0-.59.47-1.04 1.05-1.04c.59 0 1.04.45 1.04 1.04c0 .58-.44 1.05-1.04 1.05m2.51-6.17c-.63.93-1.23 1.21-1.56 1.81c-.08.14-.13.26-.16.49c-.05.39-.36.68-.75.68h-.03c-.44 0-.79-.38-.75-.82c.03-.27.09-.57.25-.84c.41-.73 1.18-1.16 1.63-1.8c.48-.68.21-1.94-1.14-1.94c-.61 0-1.01.32-1.26.7c-.19.29-.57.39-.89.25c-.42-.18-.6-.7-.34-1.07C10.03 6.55 10.88 6 12 6c1.23 0 2.08.56 2.51 1.26c.36.61.58 1.73.01 2.57"/>
    </svg>
  );
}

export function AddLocationIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M20 1v3h3v2h-3v3h-2V6h-3V4h3V1zm-8 12c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2m2-9.75V7h3v3h2.92c.05.39.08.79.08 1.2c0 3.32-2.67 7.25-8 11.8c-5.33-4.55-8-8.48-8-11.8C4 6.22 7.8 3 12 3c.68 0 1.35.08 2 .25"/>
    </svg>
  );
}

export function EditLocationIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M13.95 13H9V8.05l5.61-5.61A8.2 8.2 0 0 0 12 2c-4.2 0-8 3.22-8 8.2c0 3.32 2.67 7.25 8 11.8c5.33-4.55 8-8.48 8-11.8c0-1.01-.16-1.94-.45-2.8zM11 11h2.12l6.16-6.16l-2.12-2.12L11 8.88zM19.29.59l-1.42 1.42l2.12 2.12l1.42-1.42z"/>
    </svg>
  );
}

export function LocationIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 9.5a2.5 2.5 0 0 1 0-5a2.5 2.5 0 0 1 0 5"/>
    </svg>
  );
}
