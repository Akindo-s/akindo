import { Stack } from "expo-router";
import { View } from "react-native";

export default function RootLayout() {
 
  return (
        
        <Stack screenOptions={{ headerShown: false,contentStyle:{padding:10,backgroundColor:'red'} }} />

      
  );
}