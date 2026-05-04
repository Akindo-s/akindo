import {API_URL} from "@/lib/api/constants"

export async function registrarCliente(datos) {
  const response = await fetch(`${API_URL}/clientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (e) {
      // Ignorar si no es JSON... pero no deberia de no ser JSON eh cuidado
    }
    const message = errorData.detail || 'Error al registrar cliente';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return response.json();
}

export async function registrarDistribuidor(datos) {
  const response = await fetch(`${API_URL}/distribuidores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (e) {
      // Ignorar si no es JSON
    }
    const message = errorData.detail || 'Error al registrar distribuidor';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return response.json();
}

export async function login(datos) {
  const response = await fetch(`/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (e) {
      // Ignorar si no es JSON
    }
    const message = errorData.error || 'Credenciales inválidas';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return response.json();
}
