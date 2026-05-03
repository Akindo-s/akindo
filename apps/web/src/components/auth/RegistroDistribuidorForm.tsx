"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registrarDistribuidor } from "@/lib/api/auth";

export default function RegistroDistribuidorForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const nombre = formData.get("nombre") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const telefono = formData.get("telefono") as string;
    const rfc = formData.get("rfc") as string;
    const nombre_negocio = formData.get("nombre_negocio") as string;
    
    // Direccion
    const calle = formData.get("calle") as string;
    const ciudad = formData.get("ciudad") as string;
    const estado = formData.get("estado") as string;
    const codigo_postal = formData.get("codigo_postal") as string;

    if (!nombre || !email || !password || !rfc || !nombre_negocio || !calle || !ciudad || !estado || !codigo_postal) {
      setError("Todos los campos marcados con * son requeridos");
      setLoading(false);
      return;
    }

    const datos = {
      nombre,
      email,
      password,
      telefono: telefono || undefined,
      rfc,
      nombre_negocio,
      direccion: {
        calle,
        ciudad,
        estado,
        codigo_postal
      }
    };

    try {
      await registrarDistribuidor(datos);
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error en el registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
      <h2>Registro de Distribuidor</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label htmlFor="nombre">Nombre *</label>
        <input type="text" id="nombre" name="nombre" required style={{ padding: '0.5rem' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label htmlFor="email">Email *</label>
        <input type="email" id="email" name="email" required style={{ padding: '0.5rem' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label htmlFor="password">Password *</label>
        <input type="password" id="password" name="password" required style={{ padding: '0.5rem' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label htmlFor="telefono">Teléfono (opcional)</label>
        <input type="text" id="telefono" name="telefono" style={{ padding: '0.5rem' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label htmlFor="rfc">RFC *</label>
        <input type="text" id="rfc" name="rfc" required style={{ padding: '0.5rem' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label htmlFor="nombre_negocio">Nombre del Negocio *</label>
        <input type="text" id="nombre_negocio" name="nombre_negocio" required style={{ padding: '0.5rem' }} />
      </div>

      <fieldset style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', border: '1px solid #ccc' }}>
        <legend>Dirección</legend>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="calle">Calle *</label>
          <input type="text" id="calle" name="calle" required style={{ padding: '0.5rem' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="ciudad">Ciudad *</label>
          <input type="text" id="ciudad" name="ciudad" required style={{ padding: '0.5rem' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="estado">Estado *</label>
          <input type="text" id="estado" name="estado" required style={{ padding: '0.5rem' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="codigo_postal">Código Postal *</label>
          <input type="text" id="codigo_postal" name="codigo_postal" required style={{ padding: '0.5rem' }} />
        </div>
      </fieldset>

      <button type="submit" disabled={loading} style={{ padding: '0.5rem', marginTop: '1rem' }}>
        {loading ? "Registrando..." : "Registrar"}
      </button>
    </form>
  );
}
