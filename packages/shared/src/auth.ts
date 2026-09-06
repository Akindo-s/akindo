import { API_URL } from "./constants";

export interface RegistrarClienteDatos {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
}

export interface RegistrarDistribuidorDireccion {
  calle: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
}

export interface RegistrarDistribuidorDatos {
  nombre: string;
  email: string;
  password: string;
  telefono: string | null;
  rfc: string;
  nombre_negocio: string;
  direccion: RegistrarDistribuidorDireccion;
}

export interface LoginDatos {
  email: string;
  password: string;
}

interface ApiErrorBody {
  detail?: unknown;
  error?: unknown;
}

async function extraerMensajeError(response: Response, fallback: string): Promise<string> {
  let errorData: ApiErrorBody = {};
  try {
    errorData = await response.json();
  } catch (e) {
    // Ignorar si no es JSON... pero no deberia de no ser JSON eh cuidado
  }
  const message = errorData.detail ?? errorData.error ?? fallback;
  return typeof message === "string" ? message : JSON.stringify(message);
}

export async function registrarCliente(datos: RegistrarClienteDatos): Promise<unknown> {
  const response = await fetch(`${API_URL}/clientes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    throw new Error(await extraerMensajeError(response, "Error al registrar cliente"));
  }

  return response.json();
}

export async function registrarDistribuidor(datos: RegistrarDistribuidorDatos): Promise<unknown> {
  const response = await fetch(`${API_URL}/distribuidores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    throw new Error(await extraerMensajeError(response, "Error al registrar distribuidor"));
  }

  return response.json();
}

export async function login(datos: LoginDatos): Promise<unknown> {
  const response = await fetch(`/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    throw new Error(await extraerMensajeError(response, "Credenciales inválidas"));
  }

  return response.json();
}
