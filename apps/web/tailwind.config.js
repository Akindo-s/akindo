const tokens = require("../../packages/ui/tailwind-tokens");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    // Shared components live outside this app, so they have to be listed
    // explicitly or none of their utility classes get generated. Scoped to the
    // source folders so the glob doesn't crawl packages/ui/node_modules.
    "../../packages/ui/*.{js,jsx,ts,tsx}",
    "../../packages/ui/{components,screens,icons}/**/*.{js,jsx,ts,tsx}",
  ],
  // Same preset as apps/mobile. It resolves to nativewind's web build here
  // (NATIVEWIND_OS is unset), which is what makes className work on
  // react-native-web components.
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Fuente compartida con apps/mobile. Ver packages/ui/tailwind-tokens.js.
      fontFamily: tokens.fontFamilyWeb(),
    },
  },
  plugins: [],
}
