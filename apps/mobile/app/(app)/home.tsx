import { _logout } from "@/utils/auth";
import { Pressable, Text, View } from "react-native";

export default function Index() {
  return (
    // esto es para testing solamente
    <View
      
    >
      <Text>Si estas biendo esto andamos valiendo cola... jajasalu2</Text>
      <Pressable onPress={_logout} className="w-20- h-40 bg-blue-500">
        <Text>Cerrar sesion</Text>
      </Pressable>
    </View>
  );
}
