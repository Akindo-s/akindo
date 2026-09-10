import "@/lib/rn-dev-global";
import "@akindo/ui/nativewind-init";

import type { Metadata } from "next";
import {Plus_Jakarta_Sans} from 'next/font/google'
import "./globals.css";
const plus_jakarta_sans = Plus_Jakarta_Sans(
  {
    weight:["200",'300','400',"500",'600','700',"800"],
    style:'normal',
    subsets:['latin'],
    // Se expone como variable CSS para que tailwind.config.js la use como
    // fontFamily. Sin eso, los componentes de packages/ui se quedan con el
    // stack por defecto de react-native-web, que no hereda del <html>.
    variable:'--font-jakarta'
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
      className={`${plus_jakarta_sans.variable} ${plus_jakarta_sans.className}  w-full`}
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="Akindo" />
        {/* Metro defines `__DEV__` for React Native code; Turbopack doesn't.
            Client chunks from packages/ui evaluate independently of this
            layout, so it has to be set synchronously before any bundle runs. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `globalThis.__DEV__=${process.env.NODE_ENV !== "production"};`,
          }}
        />
      </head>
      <body suppressHydrationWarning className=" min-h-screen w-full md:w-[100lvw] flex flex-col   overflow-y-auto">
      {children}
    </body>
    </html>
  );
}
