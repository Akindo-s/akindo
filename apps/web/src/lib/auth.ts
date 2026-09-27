"use server";

import {login,registrarCliente,RegistrarClienteDatos} from "@akindo/shared/auth";
import type { ResultadoLogin } from "@akindo/ui/screens/login";
import { createSesion, destroySesion } from "./sesion";

interface Storage{
    save(key:string,value:string):Promise<void>,
    delete(key:string):Promise<void>,
}

/**
 * El error se devuelve, no se lanza: esto es una Server Action y en build de
 * produccion Next reemplaza el mensaje de una excepcion por uno generico, asi
 * que "Credenciales invalidas" no llegaba al formulario (en dev si).
 */
export async function _login(email:string,password:string):Promise<ResultadoLogin>{
    try {
        const {access_token,tipo_usuario} = await login({email:email,password:password});
        if (!access_token) return { ok:false, error:"No se recibio el token de la API" };

        // El nucleo compartido no sabe de cookies: persistir la sesion es glue de web.
        await createSesion(access_token,tipo_usuario);
        return { ok:true };
    } catch (error) {
        return { ok:false, error: error instanceof Error ? error.message : "Ocurrio un error al iniciar sesion" };
    }
}

/** Cierra la sesion borrando las cookies. Reemplaza a la route handler `/api/auth/logout`. */
export async function _logout():Promise<void>{
    await destroySesion();
}

export async function _registerClient(data:RegistrarClienteDatos):Promise<void>{
    const response = await registrarCliente(data);
    if (!response) throw Error("No response in register client action");
    // storage.setItem('token',response.data.token); 
}