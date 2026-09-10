import '../global.css';
import { Text, View } from "react-native";
import storage from '../utils/session';
import useRouter from '@akindo/ui/router';


export default function Index() {
  const token =  storage.getItem('token');
  const router = useRouter();
  token.then(t=>{
    console.log(t)
    if (t===null) {
      router.push("/(auth)/login");
    }
  else{
    router.push('/(app)/home')
  }
})
  return (
    <View
      
    >
      <Text>Si estas biendo esto andamos valiendo cola... jajasalu2</Text>
    </View>
  );
}
