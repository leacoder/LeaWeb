# Álvarez Propiedades · Demo

Demo independiente en Next.js + React + Tailwind. Home, buscador, filtros, favoritos locales y nueve fichas con galería y contacto simulado. Tres avisos reales de referencia, incorporados a pedido del usuario: Roasenda 1395 (3729), España 195 (3732) y Monseñor Piaggio 37 (3736). Fotos y datos consultados el 10/10/2026 en la web de Álvarez; los precios y disponibilidad deben confirmarse en la fuente enlazada. Las seis propiedades restantes son ficticias y están identificadas como muestra. No se inventan superficies cubiertas para los avisos que no las publican.

## Desarrollo

Requiere Node 22+.

```sh
cd demos/alvarez
npm ci
npm run dev
```

Abrir http://127.0.0.1:3100/demo/alvarezinmobiliaria/.

```sh
npm run build
npm run check
node scripts/preview.mjs
```

La vista previa sirve `out/` bajo la ruta real. La demo no realiza envíos: tanto el botón de WhatsApp como el formulario muestran una confirmación local. Solo los favoritos se conservan en localStorage; el formulario no almacena datos. Teléfonos y mapa son enlaces externos reales de la oficina.

El postbuild agrega alias planos para los segmentos RSC que Next.js exporta con carpetas anidadas en Windows (issue upstream #92339). Esto resuelve los 404 de prefetch en hosting estático; no requiere reglas especiales en el servidor. En plataformas donde ya son planos no hace cambios.

## Preparar GitHub Pages

```sh
npm run prepare:pages
```

Exporta a `out/` y copia únicamente los archivos de esta demo a `../../demo/alvarezinmobiliaria/`, con un manifiesto propio `.demo-output.json`. Elimina solo archivos obsoletos que pertenecían a ese manifiesto. La web Astro y su proceso de publicación permanecen independientes. La raíz del repositorio ya tiene `.nojekyll`, necesario para `_next/`.

Publicar las fuentes y la carpeta generada `demo/alvarezinmobiliaria/` mediante el proceso habitual de Pages. No hace falta un servidor Node. Ruta final: https://lgdesign.com.ar/demo/alvarezinmobiliaria/. Preparar no implica publicar: no se hizo push ni se modificó DNS.

El `basePath` está fijado en `next.config.ts`. Todas las rutas usan Next Link; los assets locales incluyen el prefijo. Para evolucionar al producto con Node, compilar con `DEMO_SERVER=1` y ejecutar Next en un servidor compatible; cambiar el catálogo mock por una fuente de datos, conectar los envíos y revisar metadatos antes de producción.

## No indexación y Basic Auth

- Todas las páginas heredan `noindex, nofollow, noarchive` en metadata.
- `public/robots.txt` de la demo bloquea todo si se sirve como raíz independiente. Bajo una subruta **el robot solo consulta el robots.txt raíz del dominio**; por eso se agregó `Disallow: /demo/alvarezinmobiliaria/` en los dos robots.txt de LG Design (fuente y salida), incluso en el grupo específico OAI-SearchBot.
- La demo no se agrega al sitemap de LG Design.
- El bloqueo de rastreo no garantiza borrar una URL ya indexada; noindex solo puede procesarse si el robot puede leerlo. Para privacidad real activar el proxy antes de compartir/publicar.
- GitHub Pages no ejecuta Basic Auth ni `.htaccess`. `deploy/auth-worker.mjs` y `deploy/wrangler.toml` preparan un Cloudflare Worker para el dominio con proxy habilitado. No está desplegado ni activo.

Configuración del proxy (cuenta/zona Cloudflare del propietario): habilitar el proxy del hostname, verificar que Pages funciona por HTTPS, instalar/configurar Wrangler y ejecutar desde `deploy/`:

```sh
wrangler secret put BASIC_AUTH_USER
wrangler secret put BASIC_AUTH_PASSWORD
wrangler deploy
```

Usar contraseña aleatoria, nunca committear credenciales. El Worker aplica Basic Auth a la página y a **todos** sus assets, añade X-Robots-Tag y Cache-Control privado, retira Authorization antes de consultar Pages y responde 503 si faltan secretos. Fuera de la demo deja pasar las solicitudes. Verificar 401 sin credenciales, 401 con credenciales incorrectas y 200 con las correctas, incluyendo assets y fichas, antes de compartir.

Límite: proteger el dominio con un proxy no hace privado el repositorio público ni garantiza impedir acceso directo al origen de GitHub Pages. Si se necesita confidencialidad completa, alojar la exportación en un origen privado protegido y evitar publicar las fuentes/artefactos sensibles en un repositorio público.

## Contenido y recursos

- `lib/data.ts`: tres avisos de referencia y seis propiedades mock, precios, características, fuentes y galerías propias.
- `components/`: interacciones; `app/`: páginas y diseño responsive.
- `public/images/`: fotos de referencia de Unsplash descargadas para no depender de peticiones de terceros en la demo. IDs: hero `photo-1600210492486-724fe5c67fb0`; living `photo-1600607687920-4e2a09cf159d`; house `photo-1600047509807-ba8f99d2cdde`; kitchen `photo-1600566753086-00f18fb6b3ea`; bedroom `photo-1616046229478-9901c5536a45`; patio `photo-1600607687939-ce8a6c25118c`. No corresponden a propiedades reales de Álvarez.
- Inter local (SIL Open Font License). `brand.svg` y `brand-light.svg`: reinterpretación vectorial del logo azul/naranja suministrado por el usuario, con tipografía convertida a trazados. Se generan con `node scripts/render-brand.mjs`, usando las dependencias fontkit y @fontsource/inter del repositorio padre. El SVG generado es independiente de esas herramientas y no necesita fuentes externas.
- `public/images/SOURCES.md`: procedencia y selección de las 18 fotografías reales de los tres avisos. La portada usa una fotografía ilustrativa de un living luminoso (Unsplash, recurso local `hero.webp`). Las fotos de muestra restantes siguen identificadas como ilustrativas.

Las consultas se mantienen mock intencionalmente, sin configurar un número WhatsApp.

## Verificación

Con la vista previa en el puerto 3100, ejecutar `node scripts/verify.mjs` (Chrome instalado). Cubre búsqueda, filtros combinados, precio, resultados vacíos, código, galería, WhatsApp simulado, formulario, favoritos persistentes, ordenamiento y navegación móvil; revisa overflow, imágenes y metadata en 320, 390, 768, 1024 y 1440 px. Las capturas se guardan en `test-results/` (ignorado).

Ejecutar `node scripts/verify-auth.mjs` para validar la lógica del proxy sin publicarlo. Esto no sustituye una verificación de su configuración real en Cloudflare.

Referencias de despliegue: [Next.js basePath](https://nextjs.org/docs/pages/api-reference/config/next-config-js/basePath), [Cloudflare Basic Auth](https://developers.cloudflare.com/workers/examples/basic-auth/), [Cloudflare Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/).
