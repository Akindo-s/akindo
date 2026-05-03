import { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

export function BookmarkIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3l7 3V5c0-1.1-.9-2-2-2"/>
    </svg>
  );
}

export function BookmarkBorderIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3l7 3V5c0-1.1-.9-2-2-2m0 15l-5-2.18L7 18V5h10z"/>
    </svg>
  );
}

export function AnnouncementIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M4 4v13.17l.59-.59l.58-.58H20V4zm9 11h-2v-2h2zm0-4h-2V5h2z" opacity=".3"/>
      <path fill={color} d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m0 14H5.17l-.59.59l-.58.58V4h16zM11 5h2v6h-2zm0 8h2v2h-2z"/>
    </svg>
  );
}

export function AddShoppingCartIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M11 9h2V6h3V4h-3V1h-2v3H8v2h3zm-4 9c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2s-.9-2-2-2m10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2s2-.9 2-2s-.9-2-2-2m-9.83-3.25l.03-.12l.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.86-7.01L19.42 4h-.01l-1.1 2l-2.76 5H8.53l-.13-.27L6.16 6l-.95-2l-.94-2H1v2h2l3.6 7.59l-1.35 2.45c-.16.28-.25.61-.25.96c0 1.1.9 2 2 2h12v-2H7.42c-.13 0-.25-.11-.25-.25"/>
    </svg>
  );
}

export function CheckCircleOutlineIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M16.59 7.58L10 14.17l-3.59-3.58L5 12l5 5l8-8zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8s8 3.58 8 8s-3.58 8-8 8"/>
    </svg>
  );
}

export function GreaterThanIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} fillRule="evenodd" d="m6.5 17.5l8.25-5.5L6.5 6.5l1-1.5L18 12L7.5 19z"/>
    </svg>
  );
}

export function ImageNotSupportedIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="m21.9 21.9l-8.49-8.49l-9.82-9.82L2.1 2.1L.69 3.51L3 5.83V19c0 1.1.9 2 2 2h13.17l2.31 2.31zM5 18l3.5-4.5l2.5 3.01L12.17 15l3 3zm16 .17L5.83 3H19c1.1 0 2 .9 2 2z"/>
    </svg>
  );
}

export function SavingsIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="m19.83 7.5l-2.27-2.27c.07-.42.18-.81.32-1.15A1.498 1.498 0 0 0 16.5 2c-1.64 0-3.09.79-4 2h-5C4.46 4 2 6.46 2 9.5S4.5 21 4.5 21H10v-2h2v2h5.5l1.68-5.59l2.82-.94V7.5zM13 9H8V7h5zm3 2c-.55 0-1-.45-1-1s.45-1 1-1s1 .45 1 1s-.45 1-1 1"/>
    </svg>
  );
}

export function SettingsIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M19.14 12.94c.04-.3.06-.61.06-.94c0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6s3.6 1.62 3.6 3.6s-1.62 3.6-3.6 3.6"/>
    </svg>
  );
}

export function ShoppingBagIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2m-8 4c0 .55-.45 1-1 1s-1-.45-1-1V8h2zm2-6c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2m4 6c0 .55-.45 1-1 1s-1-.45-1-1V8h2z"/>
    </svg>
  );
}

export function SupportAgentIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M21 12.22C21 6.73 16.74 3 12 3c-4.69 0-9 3.65-9 9.28c-.6.34-1 .98-1 1.72v2c0 1.1.9 2 2 2h1v-6.1c0-3.87 3.13-7 7-7s7 3.13 7 7V19h-8v2h8c1.1 0 2-.9 2-2v-1.22c.59-.31 1-.92 1-1.64v-2.3c0-.7-.41-1.31-1-1.62"/>
      <circle cx="9" cy="13" r="1" fill={color}/>
      <circle cx="15" cy="13" r="1" fill={color}/>
      <path fill={color} d="M18 11.03A6.04 6.04 0 0 0 12.05 6c-3.03 0-6.29 2.51-6.03 6.45a8.07 8.07 0 0 0 4.86-5.89c1.31 2.63 4 4.44 7.12 4.47"/>
    </svg>
  );
}

export function ContactMailIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M21 8V7l-3 2l-3-2v1l2.72 1.82a.5.5 0 0 0 .55 0zm1-5H2C.9 3 0 3.9 0 5v14c0 1.1.9 2 2 2h20c1.1 0 1.99-.9 1.99-2L24 5c0-1.1-.9-2-2-2M8 6c1.66 0 3 1.34 3 3s-1.34 3-3 3s-3-1.34-3-3s1.34-3 3-3m6 12H2v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1zm7.5-6h-7c-.28 0-.5-.22-.5-.5v-5c0-.28.22-.5.5-.5h7c.28 0 .5.22.5.5v5c0 .28-.22.5-.5.5"/>
    </svg>
  );
}

export function FlightTakeoffIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M20.5 19h-17c-.55 0-1 .45-1 1s.45 1 1 1h17c.55 0 1-.45 1-1s-.45-1-1-1m1.57-9.36c-.22-.8-1.04-1.27-1.84-1.06L14.92 10L8.46 3.98a1.06 1.06 0 0 0-1.02-.25c-.68.19-1 .97-.65 1.58l3.44 5.96l-4.97 1.33l-1.57-1.24c-.25-.19-.57-.26-.88-.18l-.33.09c-.32.08-.47.45-.3.73l1.88 3.25c.23.39.69.58 1.12.47L21 11.48c.8-.22 1.28-1.04 1.07-1.84"/>
    </svg>
  );
}

export function InsertDriveFileIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8.83c0-.53-.21-1.04-.59-1.41l-4.83-4.83c-.37-.38-.88-.59-1.41-.59zm7 6V3.5L18.5 9H14c-.55 0-1-.45-1-1"/>
    </svg>
  );
}

export function GroupIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3s1.34 3 3 3m-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5S5 6.34 5 8s1.34 3 3 3m0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5m8 0c-.29 0-.62.02-.97.05c1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5"/>
    </svg>
  );
}

export function LockIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M20 8h-3V6.21c0-2.61-1.91-4.94-4.51-5.19A5.01 5.01 0 0 0 7 6v2H4v14h16zm-8 9c-1.1 0-2-.9-2-2s.9-2 2-2s2 .9 2 2s-.9 2-2 2M9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2z"/>
    </svg>
  );
}

export function RemoveIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M19 13H5v-2h14z"/>
    </svg>
  );
}

export function AddBusinessIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M15.36 9H3.64l-.6 3h12.92z" opacity=".3"/>
      <path fill={color} d="M2 4h15v2H2zm13 13h2v-3h1v-2l-1-5H2l-1 5v2h1v6h9v-6h4zm-6 1H4v-4h5zm-5.96-6l.6-3h11.72l.6 3z"/>
      <path fill={color} d="M20 18v-3h-2v3h-3v2h3v3h2v-3h3v-2z"/>
    </svg>
  );
}

export function AddCircleIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8s8-3.59 8-8s-3.59-8-8-8m5 9h-4v4h-2v-4H7v-2h4V7h2v4h4z" opacity=".3"/>
      <path fill={color} d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8"/>
    </svg>
  );
}

export function LocalShippingIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M3 15h.78c.55-.61 1.34-1 2.22-1s1.67.39 2.22 1H15V6H3z" opacity=".3"/>
      <path fill={color} d="M17 8V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18c-.55 0-1-.45-1-1s.45-1 1-1s1 .45 1 1s-.45 1-1 1m9-3H8.22c-.55-.61-1.33-1-2.22-1s-1.67.39-2.22 1H3V6h12zm3 3c-.55 0-1-.45-1-1s.45-1 1-1s1 .45 1 1s-.45 1-1 1m-1-6V9.5h2.5l1.96 2.5z"/>
    </svg>
  );
}

export function LogoutIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M5 5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7v-2H5zm16 7l-4-4v3H9v2h8v3z"/>
    </svg>
  );
}

export function MonitorWeightIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M13 8.5h1v1h-1zm-3 0h1v1h-1zm1.5 0h1v1h-1z" opacity=".3"/>
      <path fill={color} d="M5 19h14V5H5zm7-13c1.66 0 3 1.34 3 3s-1.34 3-3 3s-3-1.34-3-3s1.34-3 3-3" opacity=".3"/>
      <path fill={color} d="M12 12c1.66 0 3-1.34 3-3s-1.34-3-3-3s-3 1.34-3 3s1.34 3 3 3m1-3.5h1v1h-1zm-1.5 0h1v1h-1zm-1.5 0h1v1h-1z"/>
      <path fill={color} d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m0 16H5V5h14z"/>
    </svg>
  );
}

export function StraightenIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M19 12h-2V8h-2v4h-2V8h-2v4H9V8H7v4H5V8H3v8h18V8h-2z" opacity=".3"/>
      <path fill={color} d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2m0 10H3V8h2v4h2V8h2v4h2V8h2v4h2V8h2v4h2V8h2z"/>
    </svg>
  );
}

export function VerificadoIcon({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`icon ${className}`} {...props}>
      <path fill={color} d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2m4.24 16L12 15.45L7.77 18l1.12-4.81l-3.73-3.23l4.92-.42L12 5l1.92 4.53l4.92.42l-3.73 3.23z"/>
    </svg>
  );
}
