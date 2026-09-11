import type { NextConfig } from "next";
import { withExpo } from "@expo/next-adapter";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const nextConfig: NextConfig = withExpo({
  async rewrites() {
    if (!apiUrl) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },

  transpilePackages: ["react-native", "react-native-web", "expo", "@akindo/ui", "@expo/html-elements"],

  turbopack: {
    resolveAlias: {
      "react-native": "react-native-web",
      "react-native/Libraries/Image/AssetRegistry":
        "react-native-web/dist/cjs/modules/AssetRegistry",
      "react-native-svg": "react-native-svg/lib/module/elements.web.js",
      "react-native-safe-area-context": "./src/lib/safe-area-context.web.ts",
      // packages/ui pins native files through its exports map ("./*": "./*.ts"),
      // so the `.web` twins are unreachable without pointing at them explicitly.
      "@akindo/ui/router": "@akindo/ui/router.web",
      "@akindo/ui/image-picker": "@akindo/ui/image-picker.web",
    },
    resolveExtensions: [
      ".web.js",
      ".web.jsx",
      ".web.ts",
      ".web.tsx",
      ".tsx",
      ".ts",
      ".jsx",
      ".js",
      ".json",
    ],
  },

  webpack: (config:any) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react-native$": "react-native-web",
      "react-native/Libraries/Image/AssetRegistry":
        "react-native-web/dist/cjs/modules/AssetRegistry",
    };
    config.resolve.extensions = [
      ".web.js",
      ".web.jsx",
      ".web.ts",
      ".web.tsx",
      ...config.resolve.extensions,
    ];
    return config;
  },
});

export default nextConfig;


