# Splash de marca — LG Design

La integración extiende la identidad existente: fondo azul `#071a2e`, marca clara `#edf3f8`, acentos `#8be2ef` y firma `#a8b9c8`. Reutiliza `logoMark` y `logoDimensions` de `src/lib/logo.mjs`, además de la tipografía `var(--font)`. Las guías, cotas y aparición del logotipo acompañan esa identidad. Este documento registra la implementación; no establece nuevos tokens ni una nueva identidad visual.

## Integración y duración

`src/components/BrandSplash.astro` contiene la presentación y sus animaciones; incorpora en línea el controlador de `src/scripts/brand-splash.js`. `src/layouts/BaseLayout.astro` lo incluye únicamente en la portada (`spanishPath === '/'`) y fuera de páginas `noindex`. El controlador reconoce `/`, `/index.html`, `/en/` y `/en/index.html`; esto no agrega el componente a otras páginas.

La secuencia visual dura **1400 ms**: la salida comienza a los 1050 ms y dura 350 ms. El cierre de respaldo en JavaScript se ejecuta a los 1450 ms; una expiración CSS independiente oculta el contenedor a partir de los 1900 ms.

## Aparición y accesibilidad

Se muestra en la primera entrada elegible de la sesión de pestaña y vuelve a reproducirse al recargar la portada. La recarga normal y el hard refresh se tratan igual porque el navegador informa ambos como `reload`. Limpiar solo la caché HTTP no borra la sesión; la recarga posterior sí reproduce la intro. La navegación interna conserva el comportamiento de una sola aparición. Se registra mediante `sessionStorage`, con la clave `lg-brand-intro` y el valor `seen`, escrito antes de mostrarlo. Se omite con movimiento reducido, fragmento de URL salvo recarga, referente del mismo origen salvo recarga, navegación de historial, redirección de idioma pendiente, sesión ya registrada salvo recarga, o almacenamiento bloqueado. `LanguagePreference.astro` marca la redirección con `data-language-redirect="true"` antes de llamar a `location.replace`.

El HTML parte de `hidden`, `aria-hidden="true"` e `inert`: sin JavaScript permanece oculto. No mueve el foco ni bloquea el desplazamiento; `pointer-events: none` permite interactuar con la página. También se oculta al imprimir.

La primera interacción (`pointerdown`, `touchstart`, `wheel`, `keydown` o `focusin`) lo cierra. También termina en `pagehide`, restauración desde caché de navegación (`pageshow.persisted`), cambio a segundo plano, activación de movimiento reducido o error de imagen. El cierre limpia el temporizador y cancela los listeners mediante `AbortController`; las excepciones terminan con el splash oculto.

## Verificación y alcance

La revisión independiente inicial dio disposición de entrega. En esa versión pasó `prepare:pages`: 35 archivos Astro y 19 HTML, incluida la raíz, con 6 pruebas del splash y 8 de interacciones. Tras el ajuste de recarga pasaron las 8 pruebas actuales del controlador del splash.

Las capturas se tomaron sobre compilaciones reales mediante rutas locales separadas de revisión, con visibilidad forzada y animaciones CSS pausadas para evaluar la composición estática. Además, el agente principal abrió una pestaña fresca en la raíz real del servidor local, puerto 4391, sin ruta de revisión ni inyección: la evaluación inmediata del DOM devolvió `splashVisible: true` y duración configurada de 1400 ms. Después del ajuste solicitado, se verificó también la recarga de la raíz real: la evaluación inmediata devolvió `splashVisible: true`. El estado oculto tras recargar pertenecía a la versión inicial y ya no describe el comportamiento vigente. Estas comprobaciones verifican la activación; no constituyen una medición independiente de la duración transcurrida.

No hubo despliegue a producción, medición de Lighthouse ni evaluación mediante un detector.

## Ajuste de recarga y nueva pestaña

El registro usa sessionStorage por pestaña; duplicar una pestaña o abrirla con un opener puede copiar su estado inicial, por lo que no se garantiza una sesión vacía en esos casos. Si la página se abre en segundo plano, la presentación espera hasta pasar a primer plano y entonces comprueba las condiciones de aparición; salir de la página cancela esa espera. Se mantiene la excepción de movimiento reducido al recargar. Los enlaces a secciones omiten la presentación al navegar; una recarga explícita de la portada vuelve a mostrarla aunque conserve un fragmento de URL. La suite del controlador ahora incluye ocho pruebas, con recarga sobre sesión existente y activación desde segundo plano.

