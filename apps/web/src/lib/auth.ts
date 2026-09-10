"use server";

import {login,registrarCliente,RegistrarClienteDatos} from "@akindo/shared/auth";
import { createSesion, destroySesion } from "./sesion";

interface Storage{
    save(key:string,value:string):Promise<void>,
    delete(key:string):Promise<void>,
}

export async function _login(email:string,password:string):Promise<void>{
    const {access_token,tipo_usuario} = await login({email:email,password:password});
    if (!access_token) throw Error("No response in login action");

    // El nucleo compartido no sabe de cookies: persistir la sesion es glue de web.
    await createSesion(access_token,tipo_usuario);
}

/** Cierra la sesion borrando las cookies. Reemplaza a la route handler `/api/auth/logout`. */
export async function _logout():Promise<void>{
    await destroySesion();
}

export async function _registerClient(data:RegistrarClienteDatos):Promise<void>{
    const response = await registrarCliente(data);
    if (!response) throw Error("No response in register client action");
    console.log(response);
    // storage.setItem('token',response.data.token); 
}