**HERO V03:** La página usa un modelo humano 3D animado real (GLB, CC0) en lugar de la figura procedural. Sigue las instrucciones de `HERO_V03_INSTRUCCIONES.md`. Es necesario subir `public/models/runner-sam.glb` para una ejecución fiable.

# FMM NUTRICIÓN — V01

Web de Fernando Matallanos. Estética brutalista premium, colores azul marino y blanco roto, corredor de partículas WebGL, servicios de nutrición deportiva online, artículos científicos y formulario de contacto.

## Estado y decisiones aprobadas

- Páginas: Inicio, Servicios, Artículos (con categorías y buscador), Contacto.
- Inicio: HERO interactivo, **inmediatamente después** los 3 artículos más recientes, sección sobre Fernando, servicio, FAQ y CTA.
- Fernando Matallanos: graduado en Nutrición y Psicología. Nutrición personalizada orientada a deporte y composición corporal. No inventar más titulaciones ni atribuciones.
- Un único servicio integral, 100 % online y sin precios visibles.
- Correo: `fmmnutricion98@gmail.com`.
- Los artículos se gestionan **directamente en GitHub** con archivos Markdown.
- Los tres artículos de ejemplo: DHA, vitamina D y creatina. Todos llevan etiqueta de **borrador de demostración pendiente de revisión profesional**.
- Sin analítica, botones para compartir, índices dinámicos ni herramientas adicionales no aprobadas.
- Dominio inicial gratuito de Vercel; sin despliegue efectuado todavía.

## Importante: logotipo original

La imagen del logotipo fue compartida en el mensaje de ChatGPT pero sus bytes **no se pudieron extraer automáticamente como un archivo fuente** en este entorno.

El sitio tiene un espacio preparado que se sustituye automáticamente por el logotipo oficial en cuanto se añada este archivo:

`public/assets/fmm-logo-oficial.png`

Usar el logotipo original exacto (mejor PNG transparente de alta calidad), **no recrear ni modificar el diseño**. Mientras no esté, se visualiza el wordmark temporal `FMM. NUTRICIÓN`.

## Archivos y estructura

```text
fmm-nutricion/
├─ api/contact.js                 # Endpoint de Vercel: notificación + confirmación
├─ content/articulos/             # Archivos Markdown editables desde GitHub
│  ├─ dha-deporte.md
│  ├─ vitamina-d-deporte.md
│  └─ creatina-rendimiento.md
├─ public/assets/                # Favicon y póster de respaldo del corredor
├─ scripts/build.mjs             # Genera todas las páginas estáticas
├─ scripts/dev.mjs               # Servidor local de previsualización
├─ src/runner.js                 # Corredor animado 3D: WebGL nativo
├─ src/site.js                   # Navegación, filtros, formulario y animaciones
├─ src/styles.css                # Diseño y responsive
├─ package.json
├─ vercel.json
└─ .env.example
```

La animación 3D usa **WebGL nativo**, sin bibliotecas externas: proyecta partículas en 3D y modela un corredor articulado de forma procedural. En móviles reduce el número de partículas y cambia la cámara. Si WebGL no está disponible o el usuario pide reducir movimiento, aparece un póster vectorial generado localmente. El HERO responde al cursor y al desplazamiento (dispersión), con composición inicial de las partículas. **La naturalidad anatómica y la fluidez deben validarse en un navegador con GPU antes de aprobar la versión definitiva.**

## Ver la web en local

Requisitos: Node.js 20 o superior.

```bash
npm run build
npm run dev
```

Abre `http://localhost:4321`. El servidor local muestra un error explicativo si intentas enviar el formulario porque las funciones serverless solo se ejecutan en Vercel con las credenciales correspondientes.

El proyecto no necesita instalar paquetes para compilar las páginas estáticas. Para desplegar las funciones del formulario, Vercel instalará automáticamente `nodemailer` como dependencia de `package.json`.

## Subir a GitHub

1. Crea un repositorio privado o público llamado, por ejemplo, `fmm-nutricion`.
2. Sube el contenido de **esta carpeta**, no solo `dist/`. Los archivos ignorados aparecen en `.gitignore`.
3. La fuente de los artículos está en `content/articulos/`; cambia cualquiera de sus `.md` desde la interfaz de GitHub.
4. Publica los cambios en la rama conectada con Vercel para generar una nueva versión.

También puedes hacerlo con la terminal:

```bash
git init
git add .
git commit -m "FMM Nutrición: primera versión"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/fmm-nutricion.git
git push -u origin main
```

Sustituye `TU-USUARIO` por tu cuenta. No se ha creado el repositorio real ni se ha realizado un `push` desde ChatGPT.

## Conectar con Vercel

1. Vercel → **Add New → Project** → importar repositorio de GitHub.
2. Configurar como Framework **Other** (el archivo `vercel.json` incluye el comando de build y carpeta).
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Deploy. Vercel asignará una URL `*.vercel.app`.
6. Validar navegación, artículos, layout móvil, animación WebGL en GPU y formularios en la URL definitiva.

Este prototipo lleva `<meta name="robots" content="noindex,nofollow">` en todas las páginas para evitar que los contenidos provisionales aparezcan en buscadores. Antes del lanzamiento público, revisar contenido, páginas legales y cambiar esta directiva en `scripts/build.mjs` si se decide indexarlo.

## Conectar el formulario a Gmail

La cuenta remitente y receptora prevista es `fmmnutricion98@gmail.com`. No hace falta publicarla como variable de entorno de cliente: el envío se gestiona de manera privada desde `/api/contact.js` en Vercel.

**Nunca pongas contraseñas de Gmail en GitHub, archivos del sitio o el navegador.**

1. En la cuenta de Google, activar la verificación en dos pasos.
2. Si la cuenta lo permite, crear una **contraseña de aplicación** para el SMTP. Esto no es la contraseña habitual de Gmail.
3. En Vercel → Project Settings → Environment Variables configurar:

```dotenv
GMAIL_USER=fmmnutricion98@gmail.com
GMAIL_APP_PASSWORD=TU_CONTRASENA_DE_APLICACION
CONTACT_TO=fmmnutricion98@gmail.com
PUBLIC_SITE_URL=https://TU-PROYECTO.vercel.app
```

4. Volver a desplegar después de introducir las variables.
5. Realizar una consulta de prueba y comprobar que llegan dos correos: notificación a Fernando y acuse al visitante.

**Precaución:** si Google no ofrece contraseñas de aplicación para esta cuenta, habrá que usar un proveedor SMTP autorizado. Las versiones de prueba de Vercel tendrán un dominio distinto: `PUBLIC_SITE_URL` restringe los envíos al dominio indicado y podría impedir probarlos en previews temporales. No guardar nunca las credenciales en `.env.example` ni en código.

La función incluye validación de campos, límites de tamaño, honeypot y una limitación de intentos sencilla en memoria. Para una web pública con tráfico o abuso, valorar protección antispam gestionada y seguimiento de errores. Las funciones serverless no garantizan una limitación persistente por IP.

## Gestión manual de artículos

Los tres borradores están en `content/articulos/` y se editan con texto Markdown (`.md`). Cada archivo comienza con metadatos, por ejemplo:

```yaml
---
title: Título del nuevo artículo
slug: nuevo-articulo
category: Nutrición deportiva
date: 2026-12-01
readingTime: 5
cover: dha
excerpt: Resumen breve del contenido.
author: Fernando Matallanos
published: false
provisional: true
---
```

- Pon `published: false` para trabajar en el artículo sin mostrarlo en la web.
- Cuando Fernando lo revise y apruebe, cambia a `published: true` (publicación **manual**, sin programación automática).
- La página principal muestra automáticamente los tres más recientes según el campo `date`, siempre que tengan `published: true`.
- Categorías y buscador se generan automáticamente a partir de los metadatos.
- Sintaxis de contenido: títulos `##`, subtítulos `###`, negrita `**...**`, enlaces, listas, citas `>` y tablas Markdown.
- `cover` admite los estilos `dha`, `vitamina` y `creatina`. Pueden añadirse nuevas ilustraciones desde `scripts/build.mjs` y estilos de `src/styles.css`.
- Al revisar los artículos, sustituir `author: Redacción de demostración` por autoría auténtica, y `provisional: false` si procede (la etiqueta visual de demo también deberá adaptarse en las plantillas).

**La v01 incorpora deliberadamente los tres artículos como demostración visible con aviso explícito.** No deben presentarse como artículos firmados o revisados por Fernando hasta que realmente lo haga. Las referencias a NIH, ISSN y publicaciones científicas se encuentran enlazadas al final de cada artículo.

## Fotografía, SEO y otros recursos

- La sección del servicio usa una imagen de Unsplash como recurso fotográfico de referencia a través de una URL pública. Debe comprobarse que carga y sustituirse por una imagen autorizada definitiva si procede.
- Ilustraciones de los artículos: SVG propios, generados por código y sin fotografías externas.
- Fuentes web: Manrope, DM Sans y Playfair Display; existen fuentes de sustitución.
- Sitio responsive con menú móvil, avisos de foco, `prefers-reduced-motion` y contraste visual.
- SEO técnico básico: títulos y descripciones. No hay analítica ni herramientas avanzadas porque no se solicitaron.

## Bloqueantes antes de lanzar a clientes

- [ ] Incorporar el logotipo oficial con el nombre exacto de archivo indicado.
- [ ] Fernando revisa, corrige y aprueba íntegramente los tres artículos, sus referencias y la autoría.
- [ ] Verificar datos legales del titular y sustituir los **borradores** de `/privacidad/` y `/aviso-legal/` por textos válidos para el caso concreto; revisar tratamiento de datos y política de conservación.
- [ ] Activar variables SMTP privadas, probar notificación y acuse sin exponer credenciales.
- [ ] Validar funcionamiento de la animación 3D real en escritorio y móvil con GPU y mejorar la anatomía/movimiento si fuera necesario.
- [ ] Comprobar accesibilidad, carga de recursos y navegación en dispositivos reales.
- [ ] Eliminar `noindex,nofollow` solo cuando se quiera indexar el contenido final.

## Diseño aprobado

Azul marino `#101D3A`, blanco roto `#F2F0E8`, alternancia de secciones, estilo brutalista premium con tipografía editorial. Los tres artículos ocupan exactamente la primera sección después del HERO. La presentación de Fernando permanece en Inicio, sin una página separada. El único servicio es nutrición deportiva online y no se muestran precios.

## V02 · HERO revisado (21/11/2026)

Se ha sustituido la figura articulada básica por una nube de puntos sobre superficies anatómicas de sección variable. Incluye cabeza y rostro, tórax y cintura de distintas anchuras, pelvis, muslos y pantorrillas con cambios de volumen, manos y pies; el corredor mantiene la interacción suave con el cursor y scroll.

- Ciclo anterior aproximado: 1,6 segundos. Nuevo ciclo: **6,6 segundos**, con una animación deliberadamente lenta.
- Más partículas para definir la silueta (alrededor de 12 700 escritorio / 5100 móvil), a costa de mayor carga de CPU. Se ejecuta solo cuando el HERO está visible.
- Movimiento de cámara reducido, menor oscilación vertical y dispersión más discreta.
- Se mantienen WebGL nativo, fallback SVG y la opción de movimiento reducido.

**Límite de fidelidad:** esta V02 sigue siendo una **escultura anatómica procedural**, no una malla corporal de escaneo 3D ni una animación de captura de movimiento real. Si la dirección de arte exige un corredor fotorrealista, el siguiente paso es sustituir el modelado procedural por una malla humana riggeada con una carrera animada por mocap y muestrear sus superficies para las partículas, conservando el estilo visual actual.

Para actualizar un repositorio V01 conectado a Vercel, basta con reemplazar `src/runner.js` con el de V02. No es necesario volver a crear el repositorio ni volver a importar el proyecto en Vercel.
