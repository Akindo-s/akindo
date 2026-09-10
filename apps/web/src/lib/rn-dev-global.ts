// Metro injects `__DEV__` as a global automatically; Turbopack doesn't.
// React Native packages (react-native-web included) reference the bare
// identifier at module-eval time, so it must exist before anything else
// in the RN/nativewind import chain runs. Must stay the first import in
// any entry point that touches that chain (see layout.tsx).
if (typeof (globalThis as any).__DEV__ === "undefined") {
  (globalThis as any).__DEV__ = process.env.NODE_ENV !== "production";
}
