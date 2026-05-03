import type { Metadata } from "next";
import {Plus_Jakarta_Sans} from 'next/font/google'
import "./globals.css";
const plus_jakarta_sans = Plus_Jakarta_Sans(
  {
    weight:["200",'300','400',"500",'600','700',"800"],
    style:'normal'
  }
)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plus_jakarta_sans.className}`}
    >
      <body className="min-h-screen w-screen flex flex-col gap-4 overflow-x-hidden overflow-y-auto">
      {children}
    </body>
    </html>
  );
}
