import   {_login } from "@/utils/auth";
import LoginForm from "@akindo/ui/screens/login";

export default function LoginScreen(){
  return(
    <LoginForm login={_login}/>
  )
}