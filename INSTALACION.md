# 🎵 NEURØ — Guía de Instalación Completa

## Lo que vas a tener al final
- App de música AI desplegada en internet (gratis)
- Usuarios reales con registro y login
- Subida de audios e imágenes a la nube
- Likes y seguidores en tiempo real
- Base de datos en Firebase (Google)

---

## PASO 1 — Instala las herramientas en tu PC

### Node.js (necesario para todo)
1. Ve a **https://nodejs.org**
2. Descarga la versión **LTS** (la verde)
3. Instala con los valores por defecto
4. Verifica en terminal:
```bash
node --version   # debe mostrar v18 o superior
npm --version
```

---

## PASO 2 — Crea el proyecto React

Abre una terminal (CMD, PowerShell o Terminal en Mac):

```bash
# Crea el proyecto
npm create vite@latest neuro-app -- --template react
cd neuro-app

# Instala dependencias base
npm install

# Instala Firebase
npm install firebase
```

---

## PASO 3 — Copia los archivos del proyecto

Estructura de archivos que debes tener:
```
neuro-app/
├── src/
│   ├── App.jsx          ← copia App.jsx aquí
│   ├── firebase.js      ← copia firebase.js aquí
│   ├── main.jsx         ← ya existe, no tocar
│   └── hooks/
│       └── useFirebase.js  ← crea la carpeta hooks y copia aquí
├── index.html
└── package.json
```

---

## PASO 4 — Configura Firebase (gratis)

### 4.1 Crea el proyecto Firebase
1. Ve a **https://console.firebase.google.com**
2. Clic en **"Crear un proyecto"**
3. Nombre: `neuro-music` → continuar
4. Puedes desactivar Google Analytics → continuar
5. Espera que se cree

### 4.2 Activa Authentication
1. En el menú izquierdo: **Build → Authentication**
2. Clic **"Comenzar"**
3. En la pestaña **"Sign-in method"**
4. Activa **"Correo electrónico/contraseña"** → Guardar

### 4.3 Crea la base de datos Firestore
1. En el menú: **Build → Firestore Database**
2. Clic **"Crear base de datos"**
3. Selecciona **"Iniciar en modo de prueba"** (por ahora)
4. Elige la región más cercana (ej: `us-central1`)
5. Listo

### 4.4 Activa Storage (para audios e imágenes)
1. En el menú: **Build → Storage**
2. Clic **"Comenzar"**
3. **"Iniciar en modo de prueba"**
4. Elige la misma región que Firestore

### 4.5 Registra tu app web y obtén las credenciales
1. En la página principal del proyecto, clic en el ícono **`</>`** (Web)
2. Nombre de la app: `neuro-web`
3. **NO** actives Firebase Hosting todavía
4. Clic **"Registrar app"**
5. Verás un bloque de código con `firebaseConfig`, cópialo

### 4.6 Pega las credenciales en firebase.js
Abre `src/firebase.js` y reemplaza los valores:

```javascript
const firebaseConfig = {
  apiKey:            "AIzaSy...",           // ← tu valor real
  authDomain:        "neuro-music.firebaseapp.com",
  projectId:         "neuro-music",
  storageBucket:     "neuro-music.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123",
};
```

---

## PASO 5 — Configura las Reglas de Seguridad

### Firestore Rules
1. Ve a **Firestore → Rules**
2. Reemplaza el contenido con las reglas del archivo `firebase.rules`
3. Clic **"Publicar"**

### Storage Rules
1. Ve a **Storage → Rules**
2. Reemplaza con las reglas de Storage del mismo archivo
3. Clic **"Publicar"**

---

## PASO 6 — Prueba en local

```bash
npm run dev
```

Abre **http://localhost:5173** en tu navegador.
Prueba registrarte, subir un track, dar likes.

---

## PASO 7 — Despliega en internet (gratis con Vercel)

### Opción A — Vercel (recomendado, más rápido)

```bash
# Instala Vercel CLI
npm install -g vercel

# Despliega
vercel

# Te preguntará:
# - Set up and deploy? → Y
# - Which scope? → tu cuenta
# - Link to existing project? → N
# - Project name? → neuro-app
# - Directory: → ./
# - Override settings? → N

# Al terminar te da una URL como:
# https://neuro-app-tu-nombre.vercel.app
```

Para **actualizar** después de cambios:
```bash
vercel --prod
```

### Opción B — Netlify (también gratis)
```bash
npm run build
# Arrastra la carpeta /dist a netlify.com/drop
```

---

## PASO 8 — Dominio personalizado (opcional)

Si quieres usar **neuromusic.com** o similar:
1. Compra el dominio en Namecheap, GoDaddy, etc. (~$10/año)
2. En Vercel: **Settings → Domains → Add Domain**
3. Sigue las instrucciones para apuntar el DNS

---

## Límites del plan gratuito de Firebase

| Servicio       | Límite gratuito              |
|----------------|------------------------------|
| Authentication | 10,000 usuarios/mes          |
| Firestore      | 1 GB almacenado, 50k lecturas/día |
| Storage        | 5 GB almacenado, 1 GB/día descarga |

Más que suficiente para empezar. Cuando crezcas, el plan Blaze (pago por uso) es muy económico.

---

## Solución de errores comunes

### "Firebase: Error (auth/invalid-api-key)"
→ Las credenciales en `firebase.js` están mal. Vuelve a copiarlas desde Firebase Console.

### "Missing or insufficient permissions"
→ Las reglas de Firestore no están bien configuradas. Revisa el Paso 5.

### "cors error" al subir audio
→ Ve a Firebase Storage → Settings → CORS y agrega tu dominio.

### La app carga pero no muestra datos
→ Verifica que Firestore y Storage estén en la misma región.

---

## Contacto y soporte
Si tienes dudas, comparte el mensaje de error exacto y te ayudo a resolverlo.
