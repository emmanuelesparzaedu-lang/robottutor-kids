# RoboTutor Kids

Asistente virtual educativo seguro para niños de primaria y secundaria, con personalización de robot y chat protegido usando **Gemini API** de Google.

## Tecnologías

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **IA:** SDK oficial `@google/genai`
- **Seguridad:** Validación antes y después de Gemini + `safetySettings` restrictivos

## Estructura del proyecto

```
robottutor-kids/
├── client/                 # React + Vite
│   └── src/components/     # RobotFace, ChatBox, etc.
├── server/                 # Express + Gemini
│   ├── index.js
│   ├── geminiClient.js
│   ├── childSafety.js
│   └── validators.js
├── package.json            # Scripts raíz
└── README.md
```

## Requisitos

- Node.js 18 o superior
- API key de Google AI Studio: https://aistudio.google.com/apikey

## Instalación

### 1. Clonar o abrir el proyecto

```bash
cd C:\Users\Admin\Projects\robottutor-kids
```

### 2. Instalar dependencias

```bash
npm run install:all
```

O manualmente:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y agrega tu API key:

```bash
copy server\.env.example server\.env
```

Edita `server/.env`:

```env
GEMINI_API_KEY=tu_api_key_real_aqui
PORT=3001
GEMINI_MODEL=gemini-2.0-flash
```

**Nunca** pongas la API key en el frontend.

### 4. Ejecutar en desarrollo

Desde la raíz del proyecto:

```bash
npm run dev
```

Esto inicia:

- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:5173 (proxy `/api` → backend)

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Cliente + servidor en paralelo |
| `npm run dev:server` | Solo backend |
| `npm run dev:client` | Solo frontend |
| `npm run build` | Build de producción del cliente |
| `npm run start` | Servidor en producción |

## Funciones principales

- Robot animado con SVG (color, ojos, boca, antenas, expresiones)
- Chat educativo con modos: Matemáticas, Ciencias, Inglés, Lectura, Cuentos, Adivinanzas, Tareas
- Selector de grado escolar
- Panel para adultos (PIN por defecto: `1234`)
- Borrar conversación
- Personalización guardada en `localStorage`

## Seguridad infantil

1. **Antes de Gemini:** filtro de palabras/temas peligrosos, datos personales, temas bloqueados por el adulto.
2. **En Gemini:** `safetySettings` en todas las categorías de daño.
3. **Después de Gemini:** validación de longitud y contenido de la respuesta.

## Escalado para escuela (nuevo)

El backend ahora incluye protección para uso masivo:

- **Rate limit por alumno/IP** (`RATE_LIMIT_PER_MIN`)
- **Cache temporal de respuestas** (`CHAT_CACHE_TTL_MS`, `CHAT_CACHE_MAX_ITEMS`)
- **Cola y límite de concurrencia** para no saturar Gemini (`MAX_CONCURRENT_GEMINI`, `MAX_QUEUE_WAIT_MS`)
- **Reintentos automáticos con backoff** ante 429/5xx (`GEMINI_MAX_RETRIES`)
- **Timeout configurable** de llamadas a Gemini (`GEMINI_TIMEOUT_MS`)

Configura estos parámetros en `server/.env` (ver `server/.env.example`).

Si algo es sensible, el niño ve:

> *"Ese tema es importante. Por seguridad, háblalo con tu maestro, mamá, papá o un adulto de confianza."*

## Preparado para base de datos

La arquitectura separa `client/` y `server/`. Puedes añadir después:

- **Supabase:** historial de chats, perfiles de alumnos
- **Firebase:** autenticación de maestros/padres

## Panel de adultos

- Grado del alumno
- Temas permitidos
- Palabras/temas bloqueados
- Modo estricto para niños pequeños
- Historial local (localStorage)

## APK independiente (recomendada — ya generada) 📱

**Archivo:** `RoboTutorKids-Independiente.apk`

- No necesitas laptop encendida
- No necesitas Render ni servidor
- Solo **internet** (WiFi o datos) en el celular/tablet
- Incluye: chat, voz 🎤, lectura 🔊, cambiar nombre del robot

Regenerar:

```powershell
npm run apk:standalone
```

> La API key va dentro de la APK (modo educativo). Para uso público masivo, usa la versión con servidor en Render (`DEPLOY-NUBE.md`).

## Play Store (release firmado) ✅

Ya puedes generar artefactos de publicación:

```powershell
npm run apk:playstore
```

Salida en la raíz del proyecto:

- `RoboTutorKids-PlayStore.aab`  ← este es el archivo para Google Play Console
- `RoboTutorKids-PlayStore.apk`  ← APK release para pruebas

El script crea y usa un **upload keystore** en `release-keys/` (haz backup seguro).

---

## Versión en la nube (sin laptop) ☁️

**Guía completa:** [DEPLOY-NUBE.md](./DEPLOY-NUBE.md)

Resumen:
1. Despliega el servidor en [Render.com](https://render.com) (gratis) usando `render.yaml`
2. Agrega `GEMINI_API_KEY` en el panel de Render
3. Copia la URL → `cloud-api-url.txt`
4. Genera la APK: `npm run apk:cloud` → instala `RoboTutorKids-Cloud.apk`

La tablet solo necesita **internet**; tu PC puede estar apagada.

---

## APK Android (modo local / WiFi)

### Generar la APK

```powershell
npm run apk
```

La APK se guarda en: `RoboTutorKids.apk` (raíz del proyecto)

### Usar la APK en celular/tablet

1. **Inicia el servidor** en tu PC (misma red WiFi que el dispositivo):

```powershell
npm run mobile:server
```

2. **Instala** `RoboTutorKids.apk` en el Android (permite “orígenes desconocidos”).

3. Abre la app → **Panel Adultos** (PIN: `1234`) → configura la IP del servidor:
   - Ejemplo: `http://192.168.1.50:3001` (la IP que muestra el script al iniciar el servidor)

4. El alumno puede:
   - **Cambiar el nombre** del asistente debajo del robot
   - **Hablar** con el botón 🎤 (micrófono)
   - **Escuchar** respuestas con 🔊 Voz ON

### Audio

- **Micrófono:** reconocimiento de voz en español (Web Speech API)
- **Voz del robot:** lectura en voz alta de las respuestas (TTS)
- Permisos de micrófono solicitados al primer uso

## Licencia

Proyecto educativo — uso personal o escolar.

## iOS (preparado)

El proyecto queda preparado, pero el `.ipa` solo se puede compilar en **Mac con Xcode**.

Pasos rápidos en Mac:

1. Copia el proyecto al Mac
2. `npm install && npm install --prefix client`
3. `cd client && npm run build`
4. `npx cap add ios && npx cap sync ios && npx cap open ios`
5. En Xcode: configurar Signing/Team y luego `Archive` para App Store

Detalle: `IOS-BUILD.md`
