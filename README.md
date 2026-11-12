# NEXO Guion

App para anotar ideas y escribir guiones de video de **NEXO PC** y los clientes de la agencia.
Funciona **100 % sin internet**: todo se guarda en el celular.

> Excelencia digital, confianza real.

## Cómo instalarla

| Celular | Cómo |
|---|---|
| **Android** | Abre [Releases](https://github.com/nexopc/nexo-guion/releases/latest), descarga `nexo-guion.apk` y ábrelo. La primera vez Android pide permiso para "instalar apps de fuentes desconocidas": acéptalo solo para tu navegador. |
| **iPhone** | Abre en **Safari** https://nexopc.github.io/nexo-guion/ → botón **Compartir** → **Agregar a inicio**. Ábrela una vez con internet; después funciona en modo avión. |

## Colores de los botones (memoria visual)

| Color | Acción |
|---|---|
| 🟡 Amarillo | Idea rápida |
| 🔵 Cian | Crear / agregar |
| 🟠 Naranja | Persona y diálogo |
| 🔷 Azul | Plano |
| 🩷 Rosado | Cámara |
| 🟣 Morado | PDF |
| 🟢 Verde | Mandar por WhatsApp |
| 🔴 Rojo | Borrar |

## Cómo se actualiza

1. Se cambia el código en la carpeta `www/` y se sube a `main`.
2. GitHub compila solo el APK nuevo (pestaña **Actions** → "APK Android") y publica la web del iPhone.
3. En la app: **Ajustes → Buscar actualizaciones**.

Antes de publicar una versión nueva, sube el número en `www/version.json` y en `www/sw.js` (`VERSION`).

## Estructura

```
www/            ← la app (HTML, CSS y JavaScript comentado en español)
  app.js        ← toda la lógica
  app.css       ← estilos y colores por acción
  sw.js         ← permite abrir la app sin internet (iPhone / web)
android/        ← proyecto Android (Capacitor) que envuelve la carpeta www
.github/workflows/  ← compilación automática del APK y de la web
```

## Llave de firma (importante)

El APK se firma siempre con la misma llave para que cada versión nueva se instale **encima** de la anterior sin borrar los guiones.
La llave **no está en el repositorio**: GitHub la arma con dos secretos en
**Settings → Secrets and variables → Actions**:

| Secreto | Valor |
|---|---|
| `FIRMA_CLAVE` | La clave de firma (archivo `CLAVE-FIRMA-NEXO-GUION.txt`) |
| `FIRMA_JKS` | El texto largo del archivo `FIRMA_JKS.txt` |

Guarda los dos archivos en un lugar seguro. Si se pierden, habría que desinstalar la app (importa tu respaldo después).

## Respaldo

Ajustes → **Exportar respaldo** crea un archivo `.json`. Guárdalo en Drive o mándatelo por WhatsApp **cada semana**.
Si desinstalas la app o borras los datos del navegador, solo ese archivo recupera tus guiones.

## Probar en el computador

```bash
npm run probar
```

Luego abre http://localhost:8080
