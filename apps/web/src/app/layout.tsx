import type { Metadata } from "next";
import {Plus_Jakarta_Sans} from 'next/font/google'
import "./globals.css";
const plus_jakarta_sans = Plus_Jakarta_Sans(
  {
    weight:["200",'300','400',"500",'600','700',"800"],
    style:'normal'
  }
)

export const metadata: Metadata = {
  title: {
    default: "Akindo",
    template: "%s | Akindo",
  },
  description: "Akindo Marketplace",
};

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
      <body suppressHydrationWarning className=" min-h-screen w-full md:w-[calc(100lvw-1.68%)] flex flex-col   overflow-y-auto">
      {children}
    </body>
    </html>
  );
}
