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

El posicionamiento se centra en necesidades reales: diseño web para PyMEs de Argentina, sistemas a medida e integración de sistemas, y ayuda de un programador para mejorar o terminar un proyecto. Cada servicio tiene una URL propia, explica cuándo contratarlo y enlaza alternativas relevantes. La home identifica a Leandro García como consultor, diseñador y desarrollador, con atención remota en Argentina.

El JSON-LD vincula Organization, Person, WebSite y WebPage con identificadores estables. Cada servicio declara Service y su proveedor; los casos declaran CreativeWork sin atribuir autorías o resultados no confirmados. Las preguntas de la home generan FAQPage a partir de las mismas respuestas visibles: este marcado describe el contenido y no promete resultados enriquecidos para este tipo de negocio.

`robots.txt` permite explícitamente OAI-SearchBot y conserva la regla general de acceso. La política de entrenamiento de otros rastreadores no se cambia con una regla específica. El HTML estático, los enlaces y los datos verificables son la base para búsquedas y respuestas con IA. No se agrega `llms.txt` como supuesto requisito: Google indica que no se necesitan archivos especiales ni un schema específico para aparecer en sus funciones de IA. Consultar [Google: funciones de IA y sitios web](https://developers.google.com/search/docs/appearance/ai-features) y [OpenAI: rastreadores](https://developers.openai.com/api/docs/bots).

Después de publicar, comprobar también en Cloudflare que el firewall, los desafíos y las políticas de bots no impidan el acceso de buscadores y rastreadores verificados. Un Allow en robots.txt no anula restricciones de la infraestructura. No modificar esas políticas sin revisar primero las reglas y los registros de acceso.

Para medir: enviar el sitemap a Google Search Console y Bing Webmaster Tools, inspeccionar las tres páginas de servicios y registrar consultas, impresiones, clics y contactos. Comparar los períodos de 30 y 90 días sin asumir que una búsqueda manual representa el ranking de todos los usuarios. La configuración externa y la publicación son pasos posteriores; el build no registra cuentas ni envía URLs a esos servicios.

La siguiente mejora editorial es confirmar el aporte personal en MatchVybe y documentar intervenciones y resultados reales de cada proyecto. Agregar enlaces a perfiles profesionales de Leandro cuando estén disponibles y verificados; mantener nombre, marca y sitio consistentes. No inventar reseñas, clientes, dirección física, años de experiencia ni perfiles externos para completar el schema.

Cada página tiene título, descripción, canonical, vista previa social y datos estructurados. `robots.txt` permite el rastreo y apunta a `/sitemap-index.xml`. Las páginas de servicios y casos están en el HTML generado y funcionan sin JavaScript.

Para conectar servicios opcionales de Google, copiar `.env.example` a `.env` y completar:

- `PUBLIC_GOOGLE_SITE_VERIFICATION`: contenido del meta de verificación HTML de Search Console. Una propiedad de dominio también puede verificarse mediante un registro DNS de Cloudflare.
- `PUBLIC_GA_MEASUREMENT_ID`: identificador de un flujo GA4, con formato `G-XXXXXXXXXX`. La integración registra `contact_click` con el canal de contacto.

Son valores públicos incorporados al HTML al ejecutar `npm run prepare:pages`; no usar claves privadas. Sin estos valores no se carga la integración correspondiente. El workflow de validación no modifica la salida ya guardada en la raíz.

Después de publicar, verificar la propiedad en Search Console, enviar `https://lgdesign.com.ar/sitemap-index.xml` e inspeccionar la home y una página de servicio. Revisar indexación después del lanzamiento y comparar impresiones, consultas y clics a los 30 y 90 días. Confirmar en GA4 que un clic real en WhatsApp o correo dispara el evento configurado.

## Publicación en GitHub Pages

El repositorio conserva el origen actual de Pages: rama `master`, carpeta `/(root)`. La versión publicada se guarda en la raíz y GitHub Pages la actualiza al mergear o hacer push a `master`. No se requiere cambiar Pages a GitHub Actions.

Antes de preparar un cambio para el PR, ejecutar:

```sh
npm run prepare:pages
```

Este comando valida Astro, construye `dist/`, copia únicamente la salida generada a la raíz y verifica sus páginas y recursos. Incluir en el mismo commit las fuentes y la salida de publicación. `.site-output.json` identifica los archivos generados; solo esos archivos pueden retirarse al preparar una nueva versión. `.nojekyll` permite servir correctamente la carpeta `_astro`.

El workflow `.github/workflows/deploy.yml` comprueba los pull requests y los pushes a `master`; no escribe commits ni publica mediante otro origen. El deploy sigue a cargo de GitHub Pages desde la raíz de la rama.

Las fuentes editables están en `src/`. El `index.html` de la raíz es la página construida que verá el visitante. `CNAME` conserva `lgdesign.com.ar`. Los archivos anteriores que se reemplazan permanecen recuperables en el historial de Git.

Para incorporar medición o verificación de Google en la salida publicada, completar `.env` local y volver a ejecutar `npm run prepare:pages`; los identificadores públicos quedan incorporados al HTML. Los archivos `.env` nunca se incluyen en Git.

## Compatibilidad y recuperación

La home se genera como `dist/index.html`; `/index.html` continúa disponible con canonical hacia `https://lgdesign.com.ar/`. Se conservan las anclas `#home`, `#about`, `#services`, `#works` y `#contacts`. `/tablet/index.html` redirige a la home conservando el fragmento y descartando parámetros antiguos como `devicelock`; ofrece además un enlace visible si JavaScript está desactivado. Esta página y la página 404 tienen `noindex` y no se incluyen en el sitemap.

Los archivos originales de Adobe Muse, imágenes fuente y ZIP se preservan en el repositorio para recuperación. Astro toma la implementación nueva de `src/` y los archivos públicos de `public/`; el build no agrega scripts PHP ni ZIP a la salida generada. Los archivos históricos que ya existían en la raíz permanecen en el repositorio y pueden seguir disponibles en el hosting actual. La configuración DNS y los servicios externos no se modifican al construir localmente. Para volver a una versión anterior, republicar el commit o etiqueta conservado mediante el origen de Pages correspondiente.
