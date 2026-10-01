# LG Design · Portfolio

Portfolio en español de Leandro García para presentar servicios de diseño y desarrollo digital. La nueva web usa Astro con generación estática, tipografías locales y contenido editable en Markdown. El dominio sigue siendo [lgdesign.com.ar](https://lgdesign.com.ar/).

## Desarrollo y validación

Requiere Node.js 22.19 o superior; el entorno de desarrollo y GitHub Actions usan Node.js 24. Las dependencias están fijadas en `package-lock.json`.

```sh
npm ci
npm run dev
```

La web de desarrollo abre en `http://127.0.0.1:4321`. Para comprobar la versión que se publicará:

```sh
npm run validate
npm run preview
```

`validate` ejecuta el verificador de Astro, las pruebas de consentimiento y medición, genera `dist/` y comprueba títulos, descripciones, canonical HTTPS, datos estructurados, sitemap, recursos, enlaces internos, anclas antiguas y contacto. También se puede ejecutar cada etapa con `npm run check`, `npm run verify:interactions`, `npm run build` y `npm run verify`. El build regenera automáticamente los logos y la imagen social a partir de sus fuentes vectoriales.

Los comandos usan un lanzador local que desactiva la telemetría de Astro sin escribir preferencias fuera del proyecto. La configuración precompila `picomatch` en el entorno de contenido de Vite para evitar la ejecución directa de su módulo CommonJS en Windows.

La revisión visual debe cubrir 320, 390, 768, 1024 y 1440 px, navegación por teclado, foco visible, zoom al 200 %, movimiento reducido y navegación sin JavaScript. Medir Lighthouse sobre la versión publicada o `preview`, con objetivo móvil de rendimiento ≥90 y accesibilidad/SEO ≥95. El script de verificación no sustituye esas mediciones.

Lighthouse está disponible como dependencia de desarrollo para auditar la home y una página representativa de servicio y proyecto. Usar el perfil móvil predeterminado sobre `preview`, un puerto de depuración aleatorio y Chrome headless con un perfil temporal separado. Guardar los informes JSON/HTML en `.lighthouse/`, excluido de Git. La [CLI oficial de Lighthouse](https://github.com/GoogleChrome/lighthouse) documenta los argumentos de auditoría; [Chrome Launcher](https://github.com/GoogleChrome/chrome-launcher) crea y limpia un perfil nuevo por ejecución.

## Editar contenido

- Los servicios se editan en `src/content/services/`; se publican como `/servicios/<nombre-del-archivo>/`.
- Los casos se editan en `src/content/projects/`; se publican como `/proyectos/<nombre-del-archivo>/`.
- La portada y biografía están en `src/pages/index.astro`; los canales de contacto y datos básicos están en `src/lib/site.ts`.
- Las imágenes de proyectos están en `src/assets/projects/` y se procesan durante el build.

La identidad vectorial está en `public/logo-light.svg`, `public/logo-dark.svg` y `public/favicon.svg`. La imagen para compartir tiene su fuente editable en `public/og-image.svg`. Después de modificarla, ejecutar `npm run social` para regenerar `public/og-image.png` a 1200 × 630 px antes del build. El mismo comando regenera las variantes del logo definidas en `scripts/render-social.mjs`. El render convierte los textos a trazados con Fontkit y los archivos WOFF2 locales de Inter e IBM Plex Mono; luego Sharp genera el PNG. Así el resultado es reproducible en Windows y Linux sin depender de las fuentes instaladas en el sistema.

Los campos del bloque inicial de cada Markdown se validan en `src/content.config.ts`. Para agregar un proyecto, duplicar un caso existente, elegir un nombre de archivo estable y completar título, descripción, cliente o producto, sector, imagen, texto alternativo, `featured`, `historical`, `published` y `order`. Después explicar el problema, el aporte personal, la solución y la entrega o resultado confirmado. `published` controla si se generan la página y los enlaces del caso; su valor predeterminado es `true`, por lo que conviene indicar `false` mientras se prepara contenido. `featured` controla su presencia en destacados y `order` el orden de presentación. Cambiar `historical` únicamente cuando corresponda al trabajo documentado. Los campos opcionales `website` (URL HTTPS) e `imageCaption` permiten enlazar el sitio público y precisar qué versión muestra la captura.

La selección visible contiene Librería 2001 y MatchVybe, en ese orden. Librería 2001 conserva la captura de la entrega histórica. MatchVybe describe el producto Vybe y sus funciones visibles en el sitio público, con una captura de su portada actual. Los otros cinco casos originales se conservan en Markdown con `published: false` y `featured: false`, sin rutas ni enlaces públicos. Antes del lanzamiento, confirmar el aporte personal de Leandro en MatchVybe, la biografía y la experiencia vigente. No inventar fechas, tecnologías, resultados cuantitativos ni testimonios.

## Diseño y movimiento

El plano de la portada es un SVG editable en `src/components/Blueprint.astro`, con cotas, guías de construcción y vistas de escritorio y móvil. Sus trazos se dibujan una sola vez al entrar. `Motion.astro` agrega entradas suaves al recorrer la página y una inclinación leve del plano al mover el mouse; `src/styles/motion.css` concentra las transiciones de botones, enlaces y tarjetas. El contenido permanece visible sin JavaScript, no hay bucles de animación permanentes y se respeta `prefers-reduced-motion`, incluso cuando cambia con la página abierta.

## SEO y medición

Cada página tiene título, descripción, canonical, vista previa social y datos estructurados. `robots.txt` permite el rastreo y apunta a `/sitemap-index.xml`. Las páginas de servicios y casos están en el HTML generado y funcionan sin JavaScript.

Para conectar servicios opcionales de Google, copiar `.env.example` a `.env` y completar:

- `PUBLIC_GOOGLE_SITE_VERIFICATION`: contenido del meta de verificación HTML de Search Console. Una propiedad de dominio también puede verificarse mediante un registro DNS de Cloudflare.
- `PUBLIC_GA_MEASUREMENT_ID`: identificador de un flujo GA4, con formato `G-XXXXXXXXXX`. La integración registra `contact_click` con el canal de contacto.

En GitHub Actions, definir estos valores como variables del repositorio con los mismos nombres. Son valores públicos incorporados al HTML; no usar claves privadas. Sin estos valores no se carga la integración correspondiente.

Después de publicar, verificar la propiedad en Search Console, enviar `https://lgdesign.com.ar/sitemap-index.xml` e inspeccionar la home y una página de servicio. Revisar indexación después del lanzamiento y comparar impresiones, consultas y clics a los 30 y 90 días. Confirmar en GA4 que un clic real en WhatsApp o correo dispara el evento configurado.

## Publicación en GitHub Pages

El workflow `.github/workflows/deploy.yml` valida cada push y pull request. La publicación es manual y requiere tanto una ejecución `workflow_dispatch` desde la rama predeterminada como la variable del repositorio `LG_DESIGN_READY_TO_PUBLISH=true`. Sin ambas condiciones solo se construye y valida la web.

Antes de habilitar la variable:

1. Completar proyectos recientes y confirmar la biografía, capturas y aporte personal con Leandro.
2. Aprobar la revisión visual y los checks de la versión final; probar WhatsApp y correo en dispositivos reales.
3. Conservar un commit o etiqueta recuperable de la web anterior.
4. En Settings → Pages, seleccionar **GitHub Actions** como origen. Confirmar el dominio personalizado `lgdesign.com.ar`, HTTPS y los registros vigentes de Cloudflare.
5. Definir las variables opcionales de Google; recién entonces marcar `LG_DESIGN_READY_TO_PUBLISH=true` y ejecutar el workflow manualmente.

El workflow publica únicamente `dist/`. La configuración usa el dominio personalizado sin prefijo del repositorio, según la [guía oficial de Astro para GitHub Pages](https://docs.astro.build/en/guides/deploy/github/).

## Compatibilidad y recuperación

La home se genera como `dist/index.html`; `/index.html` continúa disponible con canonical hacia `https://lgdesign.com.ar/`. Se conservan las anclas `#home`, `#about`, `#services`, `#works` y `#contacts`. `/tablet/index.html` redirige a la home conservando el fragmento y descartando parámetros antiguos como `devicelock`; ofrece además un enlace visible si JavaScript está desactivado. Esta página y la página 404 tienen `noindex` y no se incluyen en el sitemap.

Los archivos originales de Adobe Muse, imágenes fuente y ZIP se preservan en el repositorio para recuperación. Astro toma la implementación nueva de `src/` y los archivos públicos de `public/`; los originales, scripts PHP y ZIP no se copian al sitio publicado. La configuración DNS y los servicios externos no se modifican al construir localmente. Para volver a una versión anterior, republicar el commit o etiqueta conservado mediante el origen de Pages correspondiente.
