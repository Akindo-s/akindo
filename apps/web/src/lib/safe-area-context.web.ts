// Shim used only by the Turbopack `resolveAlias` in next.config.ts.
//
// react-native-safe-area-context ships web-safe builds per-file
// (SafeAreaView.web.js, NativeSafeAreaProvider.web.js) but its package
// entry (index.js -> SafeAreaContext.js) reaches them through extensionless
// relative imports (`./NativeSafeAreaProvider`), which Turbopack resolves to
// the native (Fabric) file instead of the `.web` one. This re-implements the
// same context/hook/view wiring, pointing explicitly at the web build.
import * as React from "react";
import { StyleSheet, View } from "react-native";
// @ts-expect-error no types for this deep import
import { NativeSafeAreaProvider } from "react-native-safe-area-context/lib/module/NativeSafeAreaProvider.web.js";

type Insets = { top: number; bottom: number; left: number; right: number };
type Frame = { x: number; y: number; width: number; height: number };

const SafeAreaInsetsContext = React.createContext<Insets | null>(null);
const SafeAreaFrameContext = React.createContext<Frame | null>(null);

export function SafeAreaProvider({
  children,
  initialMetrics,
  initialSafeAreaInsets,
  style,
  ...others
}: any) {
  const parentInsets = React.useContext(SafeAreaInsetsContext);
  const parentFrame = React.useContext(SafeAreaFrameContext);
  const [insets, setInsets] = React.useState<Insets | null>(
    initialMetrics?.insets ?? initialSafeAreaInsets ?? parentInsets ?? null
  );
  const [frame, setFrame] = React.useState<Frame>(
    initialMetrics?.frame ?? parentFrame ?? { x: 0, y: 0, width: 0, height: 0 }
  );

  const onInsetsChange = React.useCallback((event: any) => {
    const { frame: nextFrame, insets: nextInsets } = event.nativeEvent;
    setFrame((cur) => (nextFrame ? nextFrame : cur));
    setInsets((cur) =>
      !cur ||
      nextInsets.bottom !== cur.bottom ||
      nextInsets.left !== cur.left ||
      nextInsets.right !== cur.right ||
      nextInsets.top !== cur.top
        ? nextInsets
        : cur
    );
  }, []);

  return React.createElement(
    NativeSafeAreaProvider,
    { style: [styles.fill, style], onInsetsChange, ...others },
    insets != null
      ? React.createElement(
          SafeAreaFrameContext.Provider,
          { value: frame },
          React.createElement(SafeAreaInsetsContext.Provider, { value: insets }, children)
        )
      : null
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });

export function useSafeAreaInsets(): Insets {
  const insets = React.useContext(SafeAreaInsetsContext);
  if (insets == null) {
    throw new Error(
      "No safe area value available. Make sure you are rendering `<SafeAreaProvider>` at the top of your app."
    );
  }
  return insets;
}

const defaultEdges = { top: "additive", left: "additive", bottom: "additive", right: "additive" } as const;

export const SafeAreaView = React.forwardRef<any, any>(({ style = {}, mode, edges, ...rest }, ref) => {
  const insets = useSafeAreaInsets();
  const edgesRecord = edges == null ? defaultEdges : edges;
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const add = (inset: number, current: number, key: keyof typeof edgesRecord) =>
    edgesRecord[key] === "off" ? current : edgesRecord[key] === "maximum" ? Math.max(current, inset) : current + inset;

  const appliedStyle =
    mode === "margin"
      ? {
          marginTop: add(insets.top, flatStyle.marginTop ?? flatStyle.marginVertical ?? flatStyle.margin ?? 0, "top"),
          marginRight: add(insets.right, flatStyle.marginRight ?? flatStyle.marginHorizontal ?? flatStyle.margin ?? 0, "right"),
          marginBottom: add(insets.bottom, flatStyle.marginBottom ?? flatStyle.marginVertical ?? flatStyle.margin ?? 0, "bottom"),
          marginLeft: add(insets.left, flatStyle.marginLeft ?? flatStyle.marginHorizontal ?? flatStyle.margin ?? 0, "left"),
        }
      : {
          paddingTop: add(insets.top, flatStyle.paddingTop ?? flatStyle.paddingVertical ?? flatStyle.padding ?? 0, "top"),
          paddingRight: add(insets.right, flatStyle.paddingRight ?? flatStyle.paddingHorizontal ?? flatStyle.padding ?? 0, "right"),
          paddingBottom: add(insets.bottom, flatStyle.paddingBottom ?? flatStyle.paddingVertical ?? flatStyle.padding ?? 0, "bottom"),
          paddingLeft: add(insets.left, flatStyle.paddingLeft ?? flatStyle.paddingHorizontal ?? flatStyle.padding ?? 0, "left"),
        };

  return React.createElement(View, { style: [style, appliedStyle], ...rest, ref });
});
