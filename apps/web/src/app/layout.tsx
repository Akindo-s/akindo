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
      className={`${plus_jakarta_sans.className}  w-full`}
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="MyWebSite" />
      </head>
      <body suppressHydrationWarning className="min-h-screen w-screen flex flex-col gap-4  overflow-y-auto">
      {children}
    </body>
    </html>
  );
}
