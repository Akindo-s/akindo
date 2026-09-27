const tokens = require("../../packages/ui/tailwind-tokens");

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "../../packages/ui/*.{js,jsx,ts,tsx}",
        "../../packages/ui/{components,screens,icons}/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            // Fuente compartida con apps/web. Ver packages/ui/tailwind-tokens.js.
            // Aca cada peso es una familia propia: React Native ignora
            // font-weight en fuentes custom.
            fontFamily: tokens.fontFamilyNativo(),
        },
    },
    plugins: [],
}
