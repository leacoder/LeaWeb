# Formulario de contacto

El formulario compartido del pie de página envía correo, teléfono opcional e idea a `lg.design.web@gmail.com` a través de FormSubmit. No necesita servidor propio ni claves privadas en el navegador. JavaScript mantiene al visitante en la página; sin JavaScript se usa el POST nativo de FormSubmit.

## Activación antes de publicar

1. Enviar una consulta de prueba desde el sitio.
2. Abrir el mensaje de FormSubmit en `lg.design.web@gmail.com` y confirmar la activación. Revisar spam si no aparece. Esta confirmación la realiza el titular del correo.
3. Volver a enviar una consulta y comprobar que llega con correo, teléfono y mensaje, y que Responder usa el correo del visitante.
4. Activar también `https://lgdesign.com.ar/`: la prueba de integración confirmó que FormSubmit pide una activación distinta para el dominio público y para `http://127.0.0.1:4321/`.
5. Repetir la prueba desde el dominio público después de publicar: la comprobación local o una petición con la referencia del dominio no acredita el recorrido completo del sitio publicado. Comprobar también `/en/` y una página de servicio.

El identificador público entregado después de activar el correo puede guardarse en `PUBLIC_FORMSUBMIT_ID`, en lugar de exponer el destinatario en la URL del formulario. No es una credencial privada. Requiere reiniciar desarrollo o reconstruir el sitio.

## Comportamiento

- Los campos están ocultos inicialmente. «Enviame tu idea por correo» los despliega y permite cerrarlos conservando lo escrito; Escape cierra y devuelve el foco al control. Sin JavaScript funciona como un desplegable nativo.
- La apertura y el cierre respetan la preferencia de movimiento reducido. WhatsApp queda disponible como opción junto al desplegable.
- Correo y mensaje son obligatorios; el mensaje acepta de 10 a 3000 caracteres. El teléfono es opcional.
- Campo señuelo contra bots. No se desactiva expresamente la protección de FormSubmit.
- El botón bloquea envíos simultáneos. La consulta se conserva si falla la red, el proveedor rechaza la petición o pasan 20 segundos sin respuesta.
- Solo una respuesta HTTP correcta con `success: true` o `success: "true"` produce el estado de enviado. Una indicación de activación pendiente se muestra aparte y conserva los datos.
- La aceptación del proveedor no demuestra entrega en la bandeja de entrada. La activación y la prueba de recepción son necesarias.
- El enlace a WhatsApp sigue disponible como alternativa.
- Los datos no se guardan en localStorage ni se escriben en logs. FormSubmit procesa el envío; su documentación indica retención de consultas durante 30 días.

Validación sin enviar correo real: `npm run verify:contact`.

Referencias: https://formsubmit.co/documentation y https://formsubmit.co/ajax-documentation.
