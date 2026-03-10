# SorteoApp Docker & Tunnel Setup

Este repositorio contiene una pequeña aplicación web para gestionar un sorteo
de hackers entre dos equipos. Para facilitar su despliegue y acceso público se
puede Dockerizar y exponer mediante un túnel de Cloudflare.

## Docker

1. **Construir la imagen** desde la raíz del proyecto:
   ```bash
   docker build -t sorteoapp .
   ```

2. **Ejecutar contenedor**:
   ```bash
   docker run -d -p 3000:3000 --name sorteo sorteoapp
   ```
   La aplicación quedará disponible en `http://localhost:3000`.

3. Para detener/limpiar:
   ```bash
   docker stop sorteo && docker rm sorteo
   ```

## Exponer con Cloudflared

1. Instala `cloudflared` siguiendo la [documentación oficial](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/).

2. Puedes ejecutar `cloudflared` de forma interactiva con `cloudflared login` (se abrirá un navegador y pedirá tu cuenta). Si prefieres no iniciar sesión manualmente, puedes configurar el túnel directamente con un archivo de credenciales y/o token:
   - Crea un túnel en tu cuenta de Cloudflare (por ejemplo desde la interfaz web de Cloudflare Access) y descarga el archivo de credenciales JSON asociado.
   - Guarda ese fichero en el host donde correrá el contenedor, por ejemplo `/etc/cloudflared/sorteo.json`.
   - Alternativamente, puedes usar un token de servicio (API token) y escribirlo en el archivo `~/.cloudflared/config.yml`.

   Ejemplo mínimo de `config.yml` sin login interactivo:
   ```yaml
   tunnel: TUNNEL_ID          # ID proporcionado en el fichero de credenciales
   credentials-file: /etc/cloudflared/sorteo.json
   ingress:
     - hostname: sorteo.example.com
       service: http://localhost:3000
     - service: http_status:404
   ```
   Ajusta rutas y nombres según tu entorno. No necesitas ejecutar `cloudflared login` si ya tienes
   el archivo de credenciales.

3. Crea (si no lo hiciste) un túnel y nómbralo, por ejemplo `sorteo`:
   ```bash
   cloudflared tunnel create sorteo
   ```

4. Inicia el túnel apuntando al contenedor Docker en el puerto 3000:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

   Alternativamente puedes usar un nombre de servicio y config:
   ```yaml
   tunnel: <TUNNEL_ID>
   credentials-file: /root/.cloudflared/<TUNNEL_ID>.json
   ingress:
     - hostname: sorteo.example.com
       service: http://localhost:3000
     - service: http_status:404
   ```
   y luego ejecutas `cloudflared tunnel run sorteo`.

5. El comando mostrará una URL pública (`https://xxxx.cloudflare-tunnel.com`) que
   redirige a tu aplicación.

> **Nota:** El contenedor debe estar corriendo para que el túnel funcione, ya que
> `cloudflared` simplemente crea una conexión segura hacia `localhost:3000`.

## Resumen

- La aplicación guarda su estado en `participants.json` y arranca con `node server.js`.
- Dockerfile y `.dockerignore` permiten construir la imagen ligera.
- `cloudflared` expone la aplicación sin necesidad de abrir puertos en el firewall.

¡Listo! Con estos pasos tendrás tu SorteoApp desplegada en un contenedor y accesible
públicamente mediante Cloudflare Tunnel.  
Ajusta nombres de host y config según tu dominio/entorno.

---

## Tunnel desde Docker automático

La imagen ahora incluye `cloudflared` y un script de arranque (`entrypoint.sh`) que
puede crear y ejecutar el túnel sin intervención manual. Para usarlo basta con pasar
un token de API o montar un directorio con las credenciales.

Ejemplo de ejecución con Docker Compose (único comando necesario):
```bash
# crea un archivo .env con CLOUDFLARED_API_TOKEN si usas token
# luego arranca todo con:
docker compose up -d
```

(Compose monta participants.json y .cloudflared automáticamente, y expone
el puerto 3000.)

- Si el fichero `/etc/cloudflared/tunnel.json` existe (por montaje) el script no volverá
a crear un túnel nuevo; si no existe y se provee `CLOUDFLARED_API_TOKEN` se generará
uno automáticamente. El ID del túnel se coloca en el mismo fichero y puede ser usado
por el `config.yml` adjunto.

El contenedor ejecuta simultáneamente el servidor Node y `cloudflared tunnel run`.
Los logs del contenedor mostrarán la URL pública asignada por Cloudflare.
