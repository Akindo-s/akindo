import { _login } from "@/lib/auth";
import LoginForm from "@akindo/ui/screens/login";

export const metadata = {
  title: "Iniciar Sesión",
  description: "Accede a la plataforma de comercio mayorista más exclusiva.",
};

export default function LoginPage() {
  return <LoginForm login={_login} />;
}
