# 099 — Etapa 1: avisos push confiables y alertas de inventario sin ruido

**Estado:** in_progress (2026-10-26) · **Nivel:** L2 (sin cambios de datos; SW + UI) · **Pidió:** Luis («va hazlo y arranca»)
Plan: doc «KatzenVet — Plan para que el sistema sea fácil de usar», Etapa 1.

## Avisos push

Causas encontradas:
1. Solo se registraba el celular con el botón «Activar avisos»; no se renovaba → el código de Google caduca y los avisos dejan de llegar.
2. Con el sistema abierto no se mostraba nada (sin `onMessage`).
3. Avisos duplicados en segundo plano: el servidor manda `notification` (el SDK ya lo muestra) y el SW lo volvía a mostrar.
4. Nadie podía ver quién tiene avisos activos.

Cambios:
- `PortalFcmService.refrescarSiYaAutorizado()` al entrar al panel y al portal (sin preguntar si ya hay permiso); guarda `dispositivo` («Android · Chrome (app)»).
- `escucharEnPrimerPlano()` muestra el aviso con el SW cuando la app está abierta.
- SW v6: no duplica; el clic abre la pantalla correcta también para avisos que muestra el SDK (`FCM_MSG`).
- Menú «Avisos: activados / activar / bloqueados» → diálogo «Avisos»: este celular (Activar, Renovar, Enviar prueba) y, para admin, «Quién recibe avisos» (`avisos-estado.util`, celular viejo = > 30 días sin entrar).
- Aviso arriba «Activa los avisos…» si el permiso no se ha pedido (se puede cerrar por sesión).

Pendiente (requiere deploy de functions, no se hizo): avisos nuevos (cita 24 h antes, pendientes del día, corte) → Etapa 4.

## Alertas de inventario

288 «stock bajo», casi todas ruido (servicios en inventario con stock 0 y mínimo 0). Regla nueva (`inventario-alertas.util`): stock bajo/reorden solo mercancía con mínimo > 0; peluquería y diagnóstico no alertan; caducidad solo con stock. Las alertas guardadas que ya no cumplen **no se borran**: se filtran al mostrar (`getAlertasVigentes`).

## Fechas «volteadas» (de 098)

Revisado: todos los campos de fecha son `readonly` (solo calendario). Nadie pudo teclear fechas, así que no hay registros viejos que corregir. El `KatzenDateAdapter` queda como protección.

## Fechas guardadas como dd/mm/aaaa (2026-10-26, revisión de datos solo lectura)

Revisión en producción (solo lectura): 0 registros con día y mes volteados, pero **3 registros con la fecha en formato dd/mm/aaaa** en vez de ISO: 2 tickets (`Katzen/Visitas`: 18/10/2026 Raquel Nayely, abierto $450; 23/10/2026 Osvaldo, cerrado $300) y 1 cobro en caja (`Katzen/Caja/Movimientos`: 23/10/2026, efectivo $300). Por eso no contaban en los reportes de su día ni recibieron folio. No vienen de los campos de fecha (son de solo calendario); el origen probable es otra app/cliente que escribe la fecha formateada.
Arreglo de código: `normalizeFechaIso` acepta dd/mm/aaaa; `VisitasService` y `CajaService` normalizan al leer y al escribir. Los 3 registros **no se tocaron** (corregirlos en RTDB requiere OK de Luis).

## Impacto en RTDB

Aditivo: `Katzen/FcmTokens/{uid}/{key}.dispositivo`. Nada más.

## QA 2026-10-26 (vista previa QA, sin cambiar datos)

- Inventario: «avisos de inventario» 288 → 122 (solo mercancía con mínimo); ya no salen 1-Baño, 2-Baño Y Corte, etc.
- Menú «Avisos: bloqueados» en el navegador de prueba (permiso denegado) → diálogo explica cómo permitirlos.
- «Quién recibe avisos»: 1 de 3 (Nancy activo; Brisaida y Verónica sin avisos). Primer intento leía `Katzen/FcmTokens` completo (negado por reglas) → corregido a lectura por persona.
- Celular 412: diálogo a 400 px, sin scroll horizontal.
- CI: lint, unit tests (avisos-estado, inventario-alertas, sw-register) y build OK.
- Pendiente con celular real (Luis/personal): permitir avisos, «Enviar prueba», y confirmar que no llegan duplicados.

## Servicios en inventario (para mover, falta OK de Luis sobre la lista)

66 artículos con stock 0 que son servicios: 31 en Peluquería/Diagnóstico (menos «Espuma Essentials Baño En Seco 300g», que es producto) y 35 en Accesorio/Vacuna (Consulta, Castración, Eutanasia, Hospitalización, Profilaxis, Ultrasonido, Pensión, Desparasitación…). Lista en el plan. No se ha movido nada.
