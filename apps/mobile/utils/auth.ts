import {login,registrarCliente,RegistrarClienteDatos} from "@akindo/shared/auth";
import storage from "./session";

interface Storage{
    save(key:string,value:string):Promise<void>,
    delete(key:string):Promise<void>,
}

export async function _login(email:string,password:string):Promise<void>{
    const {access_token,tipo_usuario} = await login({email:email,password:password});
    if (!access_token) throw Error("No response in login action");

    // Equivalente movil de `createSesion` en web: alla son cookies httpOnly,
    // aca AsyncStorage. El nucleo compartido no conoce ninguno de los dos.
    await storage.multiSet([
        ["token",access_token],
        ["tipo_usuario",tipo_usuario],
    ]);
}

/** Cierra la sesion. Contraparte de `_login`, espejo del `_logout` de web. */
export async function _logout():Promise<void>{
    await storage.multiRemove(["token","tipo_usuario"]);
}

export async function _registerClient(data:RegistrarClienteDatos):Promise<void>{
    const response = await registrarCliente(data);
    if (!response) throw Error("No response in register client action");
    console.log(response);
    // storage.setItem('token',response.data.token); 
}
