# RoboTutor Kids — Versión en la nube (sin laptop)

La app en el celular se conecta a un servidor en internet. Tu laptop **no** tiene que estar encendida.

## Opción recomendada: Render.com (gratis)

### Paso 1 — Crear cuenta

1. Entra a https://render.com y regístrate (puedes usar GitHub o email).

### Paso 2 — Subir el proyecto a GitHub (si aún no está)

```powershell
cd C:\Users\Admin\Projects\robottutor-kids
git add .
git commit -m "RoboTutor Kids listo para nube"
```

Crea un repositorio en https://github.com/new y súbelo:

```powershell
git remote add origin https://github.com/TU_USUARIO/robottutor-kids.git
git push -u origin main
```

### Paso 3 — Desplegar en Render

1. En Render: **New +** → **Blueprint**
2. Conecta tu repositorio `robottutor-kids`
3. Render leerá `render.yaml` automáticamente
4. En **Environment Variables**, agrega:
   - `GEMINI_API_KEY` = tu clave de Google AI Studio
5. Clic en **Apply** / **Deploy**

Espera 3–5 minutos. Copia la URL pública, por ejemplo:

`https://robottutor-kids-api.onrender.com`

### Paso 4 — Probar el servidor

Abre en el navegador:

`https://TU-URL.onrender.com/api/health`

Debe mostrar: `"ok": true` y `"geminiConfigured": true`

### Paso 5 — Generar APK con la URL de la nube

1. Copia `cloud-api-url.txt.example` a `cloud-api-url.txt`
2. Pega tu URL de Render (sin `/` al final)
3. Ejecuta:

```powershell
npm run apk:cloud
```

Instala `RoboTutorKids-Cloud.apk` en el Android. **No necesitas configurar IP** — ya apunta a la nube.

---

## Opción manual (sin GitHub)

1. Render → **New +** → **Web Service**
2. **Deploy from Git URL** o sube el ZIP del proyecto
3. Runtime: **Docker**
4. Dockerfile path: `./Dockerfile`
5. Variable de entorno: `GEMINI_API_KEY`
6. Deploy → copia la URL

---

## Plan gratis de Render

- El servidor puede “dormir” tras ~15 min sin uso
- La primera petición tras dormir tarda ~30–60 segundos (normal en plan free)
- Para escuelas con muchos alumnos, considera plan de pago

---

## Claves de Google AI Studio (importante)

En [Google AI Studio → Claves de API](https://aistudio.google.com/apikey):

1. Usa **una sola clave** en Render: la de **«asistente para niños»** (o crea una nueva solo para escuela).
2. **No** pongas la clave en la APK independiente para muchos alumnos: todos comparten el mismo cupo y verás error 429.
3. Las dos claves del mismo proyecto (**Default Gemini Project**) comparten **el mismo límite** — crear otra clave **no duplica** la capacidad.
4. Con **Nivel gratuito** el cupo es bajo (aprox. 5–15 preguntas por minuto según modelo). Varios niños a la vez saturan Gemini.
5. Para uso escolar estable: en la clave, **Configurar la facturación** (Tier 1). Sigue siendo barato por uso y sube mucho el límite (cientos de peticiones/minuto).
6. En Render, variable recomendada: `GEMINI_MODEL=gemini-2.5-flash-lite` (mejor cupo gratuito que `gemini-2.0-flash`).

Después de cambiar `GEMINI_API_KEY` o `GEMINI_MODEL` en Render → **Save** → **Manual Deploy**.

## Seguridad

- La API key **solo** vive en Render (variables de entorno), nunca en la APK
- Revoca y renueva la clave si la compartiste en público

---

## Regenerar APK

Si cambias de URL:

```powershell
# Edita cloud-api-url.txt
npm run apk:cloud
```
