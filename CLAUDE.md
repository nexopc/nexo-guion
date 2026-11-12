# NEXO Guion — Especificación para Claude Code

App Android para anotar ideas y escribir guiones de video (para Cristóbal y los clientes de su agencia / NEXO PC). Todo se guarda en el celular (offline) y los guiones se exportan en PDF para mandarlos por WhatsApp.

Idioma de la app: **español (Colombia)**. El usuario está aprendiendo: explica cada paso, por partes y con ejemplos, antes de ejecutar comandos.

> **Cambios aprobados por Cristóbal (nov. 2026) que reemplazan partes de este documento:**
> - **Stack:** PWA (HTML/CSS/JS sin framework, carpeta `www/`) + **Capacitor 7** para el APK de Android. El APK lo compila GitHub Actions (`.github/workflows/apk-android.yml`) y la web del iPhone se publica en GitHub Pages (`web-iphone.yml`). Ya no se usa Expo.
> - **Datos:** `localStorage` (clave `nexo-guion-db`). Una escena guarda sus filas **en orden** (`rows`), mezclando tipos: `per` (persona y diálogo), `pla` (plano) y `cam` (posición de cámara). Esto reemplaza las listas separadas de Persona y Plano.
> - **Colores por acción (fijos):** amarillo = idea, cian = crear/agregar, naranja = persona, azul = plano, rosado = cámara, morado = PDF, verde = WhatsApp, rojo = borrar. No hay botón "Guardar": todo se guarda solo.
> - **Marca:** colores del logo, cian #03BDDE y rojo #F0101C (no el azul #2563EB).
> - **Recordatorios:** se exportan al calendario del celular como archivo `.ics` (funciona sin servidor en Android e iPhone).
> - **Huella:** se reemplaza por un PIN opcional de 4 dígitos.
> - **Firma del APK:** llave fija guardada solo en los secretos de GitHub `FIRMA_JKS` (PKCS12 en base64) y `FIRMA_CLAVE`; nunca subirla al repo. No cambiarla: si cambia, Android obliga a desinstalar y se pierden los datos.
> - **Modo Grabar:** la hoja se vuelve de solo lectura con un ✓ grande por plano.

---

## 1. Stack técnico (obligatorio)

| Necesidad | Herramienta |
|---|---|
| Framework | React Native + **Expo** (SDK más reciente) + TypeScript |
| Navegación | expo-router |
| Base de datos local | expo-sqlite (+ drizzle-orm opcional) |
| Estado | zustand |
| PDF | expo-print (HTML → PDF) |
| Compartir por WhatsApp | expo-sharing (abre el menú de compartir de Android con el PDF) |
| Dibujo con el dedo | react-native-svg + react-native-gesture-handler (guardar trazos como SVG/JSON) |
| Huella / PIN | expo-local-authentication + expo-secure-store (PIN de respaldo) |
| Recordatorios | expo-notifications (notificaciones locales programadas) |
| Respaldo | expo-file-system + expo-document-picker (exportar/importar .json) |
| Imágenes (logos) | expo-image-picker |
| APK | EAS Build, perfil `preview` con `buildType: "apk"` |

No usar backend ni nube en la v1.

---

## 2. Modelo de datos

```
Cliente
 ├─ id, nombre, logoUri, whatsapp, redes {instagram, tiktok, facebook, youtube}
 ├─ colorPrimario, colorSecundario
 └─ plan (texto: el plan/paquete que tiene contratado con la agencia)

Video (guion)  → pertenece a Cliente
 ├─ id, clienteId, titulo, objetivo (vender/enseñar/entretener/confianza)
 ├─ redes: ["tiktok_reels_9_16", "youtube_16_9"]   (multi)
 ├─ estado: idea | guion | grabado | editado | publicado
 ├─ fechaGrabacion?, fechaEntrega?   (con recordatorio)
 ├─ gancho, problema, solucion, llamadoAccion   (estructura G-P-S-C)
 └─ creadoEn, actualizadoEn

Escena  → pertenece a Video (ordenable)
 ├─ id, videoId, orden, nombre
 ├─ lugar: interior | exterior  + detalle libre
 ├─ momentoDia: mañana | tarde | noche + libre
 ├─ ambiente: tranquilo | tenso | divertido | emocional | épico + libre
 ├─ luz: natural | lámpara | ring light | mixta + libre
 ├─ sonidoAmbiente (libre), objetos (libre), musica (libre)
 ├─ textoPantalla (libre), efectoFilmora (libre)
 └─ mapaDibujo (trazos SVG/JSON)

Persona  → pertenece a Escena (lista dinámica: P1, P2, P3… con botón +)
 └─ id, escenaId, orden, nombreRol, ropaApariencia, queHaceDonde, dialogo

Plano  → pertenece a Escena (lista dinámica con botón +)
 ├─ id, escenaId, orden
 ├─ tipo: general | entero | medio | primer plano | detalle
 ├─ angulo: normal | picado | contrapicado | cenital
 ├─ posicionCamara (libre), movimiento: fija | paneo | travelling | zoom | en mano
 └─ duracionSeg (número)

IdeaRapida
 └─ id, texto, clienteId?, creadoEn, convertidaEnVideoId?

Plantilla
 └─ id, nombre, tipo: video | escena, contenido (JSON)

Gancho
 └─ id, tipo, plantilla, ejemplo, esPropio (bool)
```

Regla de llenado: todos los campos de lista se eligen con **chips/listas para tocar + campo de texto libre extra**.

---

## 3. Pantallas

```
[Inicio]
 ├─ Botón GRANDE "💡 Nueva idea" → escribe y guarda en 1 toque
 ├─ Ideas recientes (convertir idea → video)
 └─ Guiones recientes

[Clientes] → lista → [Cliente] (datos + plan + sus videos)
 └─ [Video]
     ├─ Resumen arriba: "3 escenas · 4 personas · 9 planos · 45 s" (automático)
     ├─ Estado (selector) + fechas de grabación/entrega
     ├─ Bloques G-P-S-C (con botón para elegir del banco de ganchos)
     ├─ Escenas (arrastrar para reordenar, duplicar, borrar) [+ Escena]
     └─ Botones: Exportar PDF · Duplicar · Guardar como plantilla

[Escena]
 ├─ Lugar, momento, ambiente, luz, sonido, objetos, música, texto, efecto
 ├─ Personas [+ Persona]
 ├─ Planos [+ Plano]
 └─ Mapa de la escena (lienzo para dibujar con el dedo: deshacer, borrar, 3 colores)

[Buscar/Filtrar] → por cliente, estado y red social
[Ganchos] → banco inicial + agregar propios
[Plantillas] → mis plantillas de video y de escena
[Ajustes] → bloqueo con huella/PIN, exportar/importar respaldo, datos de NEXO PC (logo)
```

---

## 4. PDF (tarjetas visuales)

- Encabezado: logo de NEXO PC + logo y nombre del cliente (con los colores de marca del cliente).
- Resumen del video: título, redes y formato, duración total, n.º de escenas, personas y planos, estado.
- Estructura G-P-S-C en 4 tarjetas.
- Por cada escena: una tarjeta con el ambiente y las personas, el **dibujo del mapa** y una tarjeta por plano (tipo, ángulo, cámara, movimiento, duración).
- Diseño claro y minimalista, para leer en el celular.
- Al terminar: botón "Mandar por WhatsApp" → expo-sharing con el PDF (si el cliente tiene WhatsApp, mostrar su número para elegirlo rápido).

---

## 5. Diseño visual

- **Claro y minimalista**: fondo blanco o gris muy claro, tarjetas con bordes redondeados y sombras suaves.
- Un color de acento (NEXO PC; colores por definir; usar azul #2563EB mientras tanto).
- Botones grandes, se debe poder usar con una mano.
- Íconos: @expo/vector-icons.

---

## 6. Datos iniciales

**Banco de ganchos** (el usuario puede agregar más):

| Tipo | Plantilla | Ejemplo |
|---|---|---|
| Error | "Deja de [hacer X]…" | Deja de comprar PC sin ver esto |
| Pregunta | "¿Sabías que [dato]?" | ¿Sabías que tu PC se calienta por esto? |
| Resultado | "Así pasé de [A] a [B]" | Así pasé de 30 a 120 FPS |
| Lista | "[3] cosas que…" | 3 piezas que nunca debes ahorrar |
| Local | "En Quibdó nadie te dice…" | En Quibdó nadie te dice cuánto vale armar un PC gamer |
| Reto | "Armé un PC con [$X]" | Armé un PC gamer con 2 millones |

**Cliente de ejemplo:** NEXO PC (slogan: "Excelencia digital, confianza real").

---

## 7. Fases de desarrollo (hacer en orden, probar cada una en el celular con Expo Go)

| Fase | Qué se construye | Listo cuando… |
|---|---|---|
| 0 | Crear el proyecto Expo, la navegación y la base SQLite | La app abre en Expo Go |
| 1 | Idea rápida + inicio | Anoto una idea en menos de 5 segundos |
| 2 | Clientes (con logo, colores y plan) | Creo y edito clientes |
| 3 | Video + G-P-S-C + estados + resumen automático | Veo "X escenas · Y planos · Z s" |
| 4 | Escenas con personas y planos dinámicos (+) | Agrego P1, P2, P3 y varios planos |
| 5 | Mapa de la escena dibujado con el dedo | El dibujo se guarda y se vuelve a abrir |
| 6 | PDF con tarjetas + compartir por WhatsApp | Llega el PDF a un chat |
| 7 | Filtros, ganchos, plantillas, duplicar | Funcionan los filtros por cliente, estado y red |
| 8 | Fechas + recordatorios, huella/PIN, respaldo | Exporto, borro y vuelvo a importar sin perder nada |
| 9 | APK con EAS Build | Instalo el APK en mi Android |

Al terminar cada fase: explicar qué se hizo y cómo probarlo, y hacer un commit en git.

---

## 8. Reglas para Claude

- Código simple y comentado en español; nada de sobreingeniería.
- Antes de instalar paquetes, decir cuáles y para qué.
- Si algo no es realista o va a tardar mucho, decirlo directo y con números.
- Fuera de la v1 (no hacer todavía): nube o sincronización, dictado por voz, fotos de la cámara, varios usuarios, publicarla en Play Store.
