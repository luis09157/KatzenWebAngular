# Spec 118 — Uso del día a día (puntos 2 y 3 de la revisión)

**Pidió:** Luis (30 oct 2026): «empieza a trabajar con lo que falta 2 y 3 y después subimos». L2 (UI/lógica; sin cambios de datos).

## Punto 2 — errores que molestan
1. **Regresar a programado (Peluquería).** Menú ⋮ del baño: «Regresar a programado (se inició por error)». Solo si está en proceso y sin pago, ticket ni cobro (`banio-regresar.util.ts`). Solo cambia `estado` (lo mismo que hice a mano con Niky).
2. **Pensión: check-out con día local.** `toISOString().slice(0,10)` daba el día UTC: después de las 6 pm salía el día siguiente. Ahora `hoyLocalIsoDate()` (check-out y al cobrar en caja).
3. **«Enviar al cliente» (Para avisar hoy).** Antes marcaba «avisado» al abrir WhatsApp aunque no se mandara. Ahora abre WhatsApp y pregunta «¿Ya lo mandaste?» → **Sí, ya lo mandé** (marca) / **Todavía no** (no marca).
4. **Expediente en celular.** Los botones de cada consulta, recordatorio, vacuna y consentimiento estaban ocultos en pantallas ≤900 px (no se podía editar ni borrar). Ahora se ven en su renglón. Un toque en una vacuna o recordatorio abre su detalle (como ya pasaba con consultas).

## Punto 3 — menos clics
5. **Avisos de «¡Éxito!» sin OK.** 26 ventanas de éxito en pantallas diarias (pacientes/expediente, clientes, baños, citas, vacunas, recordatorios, pacientes) pasan a un aviso breve arriba que se quita solo (`core/ui/aviso-breve.ts`). Errores y preguntas siguen igual. No se tocaron: usuarios, migración, portal, página pública.
6. **Botón principal de alertas en verde de marca** (antes morado donde no se pasaba color). Un color explícito (p. ej. rojo de Borrar) sigue mandando.
7. **Hoy se actualiza.** Baños, citas y tickets ya llegaban en vivo. Faltaba: (a) si la pestaña queda abierta y cambia el día, al volver se recarga; (b) «Para avisar hoy» se vuelve a contar al regresar si pasaron 10 min. La campanita se actualiza al regresar si pasaron 5 min.

**Pendiente de decisión (no código):** «8 cosas abiertas de días anteriores» en Hoy → preguntar a las veterinarias si el cierre del día es incómodo o es costumbre.

**Archivos:** `banios/banio-regresar.util.ts` (+spec), `banios.component.*`, `pension.component.ts`, `para-avisar-dialog.component.*` (+spec nuevo), `pacientes.component.*`, `core/ui/aviso-breve.ts`, 10 componentes con avisos, `styles.css`, `dashboard/hoy-refresco.util.ts` (+spec), `dashboard.component.ts`, `admin-main-layout.component.ts`.
