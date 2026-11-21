# FMM Nutrición — HERO V03, modelo humano animado

## Qué cambia

- Se elimina el corredor procedural de esferas/cilindros.
- El cuerpo y los gestos se obtienen de una **malla humana 3D real con rig y animación**.
- Los puntos se distribuyen por área de triángulos sobre la malla original.
- Los puntos se deforman en cada fotograma según los huesos del modelo; no se renderiza el cuerpo sólido.
- Animación de carrera ralentizada a unos 6,7 segundos por ciclo.
- Interacción moderada con ratón/scroll; versión móvil con menos partículas y fotogramas.
- Modo de movimiento reducido: se conserva ilustración estática.

## Modelo utilizado

Run — Sam 3D Person, Animated (Innerscene, derivado de MakeHuman/MPFB), CC0:
https://www.innerscene.com/tools/library/3d-parts/run-sam-3d-person-animated-fa008c06

Para robustez y rendimiento, **descarga el GLB de la página oficial** y renómbralo a `runner-sam.glb`. El archivo original ronda 20 MB. Guárdalo en `public/models/runner-sam.glb`.

Si no existe, el código intentará descargar el modelo original de forma remota; este último recurso depende de la política CORS del proveedor y no se garantiza.

## Subir al GitHub existente

1. Reemplaza `src/runner.js` con el archivo de la V03.
2. Reemplaza `scripts/build.mjs` con el archivo de la V03.
3. Reemplaza `public/assets/runner-particles.svg` para eliminar el monigote también del fondo estático.
4. Sube `public/models/runner-sam.glb` con el archivo descargado del proveedor.
5. Haz commit. Vercel recompilará y copiará el modelo en `/models/runner-sam.glb`.

**No basta con cambiar solamente `runner.js`**, ya que la V03 usa importación ESM de Three.js y el build debe declarar su mapa de importación.

## Comprobaciones

- Abre la página en escritorio y espera la carga inicial del modelo (20 MB).
- El resultado debe mostrar una figura humana de puntos, con carrera lenta y sin partes geométricas artificiales.
- Verifica versión móvil y las preferencias del sistema de movimiento reducido.
- El código fuente y las nueve páginas generadas han superado revisión de sintaxis y compilación, pero **no se ha podido visualizar la animación del modelo definitivo en el entorno de pruebas**, porque no se pudo incorporar aquí el archivo GLB remoto.
