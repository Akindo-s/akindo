# Endpoints de Autenticación de Clientes Implementados

Se han implementado los endpoints de autenticación y gestión de perfil para los clientes, siguiendo un diseño REST purista y utilizando JWT para la seguridad.

## Resumen de Cambios

1.  **Infraestructura:**
    *   Se agregó la dependencia `python-jose[cryptography]` para manejar JWTs y `python-multipart` para subida de archivos.
    *   Se implementó `JWTProvider` para firmar y validar tokens.
    *   Se implementó `StorageAdapter` utilizando el SDK de Supabase para manejar la subida de imágenes de perfil.
    *   Se añadieron excepciones de dominio granulares (`ValidationException`, `ForbiddenException`, `TokenExpiredException`, `InvalidTokenException`, etc.) y se limpió el manejador global de excepciones para usar *logging* estructurado.
    *   Se crearon dependencias de autenticación (`get_current_user`, `get_current_cliente`) reutilizables.

2.  **Modelos y Schemas:**
    *   Se definieron schemas de Pydantic detallados para cada petición y respuesta (ej. `LoginRequest`, `TokenResponse`, `ClientePerfilResponse`, `ImagenPerfilResponse`, etc.), mapeados correctamente a los agregados y la base de datos.

3.  **Lógica de Negocio y Repositorios:**
    *   `AuthService` se actualizó para manejar el inicio de sesión (`login`), verificando credenciales, generando el JWT y emitiendo el evento de sesión.
    *   `ClienteService` implementa las funciones para consultar el perfil (`get_perfil`), actualizarlo parcialmente (`actualizar_perfil`), subir la imagen de perfil (`subir_imagen_perfil`), consultar direcciones, pedidos y el carrito.
    *   `UsuarioRepo` y `ClienteRepo` fueron extendidos para soportar actualizaciones parciales y consultas complejas de sub-recursos (aprovechando joins de PostgREST donde aplica).

4.  **Sistema de Eventos:**
    *   Se crearon nuevos eventos y suscriptores de auditoría:
        *   `ClienteInicioSesion`
        *   `ClientePerfilConsultado`
        *   `ClientePerfilActualizado`
        *   `ClienteImagenPerfilSubida`
    *   Todos fueron suscritos en el *event bus* en `main.py`.

5.  **Reestructuración REST (Routers):**
    *   `/auth`: Ahora solo contiene `POST /auth/token` para generar el JWT (login).
    *   `/clientes`: Agrupa los recursos del cliente:
        *   `POST /clientes`: Registro de un nuevo cliente (público).
        *   `GET /clientes/me`: Consulta de perfil propio (autenticado).
        *   `PATCH /clientes/me`: Actualización parcial del perfil (autenticado).
        *   `PUT /clientes/me/imagen-perfil`: Subida de imagen (autenticado).
        *   `GET /clientes/me/direcciones`: Consulta de direcciones (autenticado).
        *   `GET /clientes/me/pedidos`: Consulta de pedidos (autenticado).
        *   `GET /clientes/me/carrito`: Consulta del carrito (autenticado).

## Verificación

El servidor se ha probado y arranca correctamente, validando que todas las dependencias y routers están bien configurados. Los eventos se registran adecuadamente al inicio.
