import {login,registrarCliente,RegistrarClienteDatos} from "@akindo/shared/auth";
import type { ResultadoLogin } from "@akindo/ui/screens/login";
import { guardarSesion, borrarSesion } from "./session";

interface Storage{
    save(key:string,value:string):Promise<void>,
    delete(key:string):Promise<void>,
}

/** Mismo contrato que el `_login` de web: el error viaja como valor. */
export async function _login(email:string,password:string):Promise<ResultadoLogin>{
    try {
        const {access_token,tipo_usuario} = await login({email:email,password:password});
        if (!access_token) return { ok:false, error:"No se recibio el token de la API" };

        // Equivalente movil de `createSesion` en web: alla son cookies httpOnly,
        // aca AsyncStorage. El nucleo compartido no conoce ninguno de los dos.
        // `guardarSesion` ademas avisa al layout, que vuelve a pintar el Header.
        await guardarSesion(access_token,tipo_usuario);
        return { ok:true };
    } catch (error) {
        return { ok:false, error: error instanceof Error ? error.message : "Ocurrio un error al iniciar sesion" };
    }
}

/** Cierra la sesion. Contraparte de `_login`, espejo del `_logout` de web. */
export async function _logout():Promise<void>{
    await borrarSesion();
}

export async function _registerClient(data:RegistrarClienteDatos):Promise<void>{
    const response = await registrarCliente(data);
    if (!response) throw Error("No response in register client action");
    // storage.setItem('token',response.data.token); 
}
