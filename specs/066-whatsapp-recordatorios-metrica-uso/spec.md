# Spec: Recordatorio por WhatsApp + métrica de uso por módulo

**ID:** 066-whatsapp-recordatorios-metrica-uso  
**Estado:** done  
**Fecha:** 2026-09-04  
**Autor:** Agent (autorización Luis Alfonso Niño Martínez) · origen `specs/PLAN-UX-VETERINARIAS.md` extras 4 y 7, ítem 4.4  
**Nivel:** L2 (UI/lógica; sin rules RTDB ni nodos nuevos)

---

## Problema

El recordatorio automático (033/053) existe en RTDB, pero el push FCM depende de un scheduler sin deploy y el correo Resend de un dominio pendiente. La veterinaria **no sabe si el dueño lo recibirá**. WhatsApp con texto prellenado (`wa.me/`) funciona hoy sin infraestructura y es el canal que la clínica ya usa.

Además, el menú admin tiene ~30 ítems y no hay dato de cuáles se usan. Sin métrica no se puede decidir qué quitar.

---

## User stories

### US-1 — Enviar recordatorio por WhatsApp

Como **staff (recepción / doctora)**  
Quiero un botón «Enviar por WhatsApp» en cada recordatorio con teléfono del dueño  
Para avisarle hoy mismo sin depender de push ni correo.

**Criterios de aceptación:**

- [x] SC-001: Botón `chat` en `.row-actions` (y en el menú móvil) solo si el cliente ligado tiene teléfono; abre `https://wa.me/52{tel10}?text=…` en pestaña nueva.
- [x] SC-002: Texto generado por util puro: saludo con nombre del dueño, mascota, tipo en español, fecha larga («lunes 8 de septiembre»), nombre de la clínica y cierre «Responde este mensaje para confirmar».
- [x] SC-003: Teléfono normalizado (espacios, guiones, `+52`/`52`/`521` duplicado). Si no queda en 10 dígitos → botón deshabilitado con tooltip «Teléfono incompleto».
- [x] SC-004: Al enviar se guarda `whatsappEnviadoEn` (timestamp, opcional aditivo) con `LoadingService` contextual; chip «WhatsApp ✓ {fecha}» completo en la fila.
- [x] SC-005: Acción «Llamar» (`tel:`) junto a WhatsApp cuando hay teléfono.
- [x] SC-006: FCM / portal no se tocan; WhatsApp es complementario.

### US-2 — Saber qué módulos se usan (este equipo)

Como **admin**  
Quiero ver cuántas veces se abrió cada módulo en esta computadora  
Para quitar del menú lo que nadie usa.

**Criterios:**

- [x] SC-007: `UsageMetricsService` cuenta `NavigationEnd` bajo `/admin/*` por primer segmento (`inventario/productos` → `inventario`) en `localStorage['katzen.usage.v1']` = `{ [modulo]: { count, lastAt } }`. Ignora rutas no admin y `login`. Sin datos personales.
- [x] SC-008: Panel «Uso del sistema (este equipo)» al final de `/admin/usuarios`: tabla módulo · veces · último uso, **menos usados primero**, texto «Módulos que nadie abre son candidatos a quitarse del menú», botón «Reiniciar conteo».
- [x] SC-009: Unit tests del servicio (≥4) y del util WhatsApp (≥5).

---

## Fuera de alcance

- Envío automático / API oficial de WhatsApp Business, plantillas, historial de conversación.
- Métrica agregada en RTDB (fase posterior del extra 7 del plan UX).
- Indicador «sí/no recibirá recordatorios» en ficha de cliente (4.4 completo) — territorio `clientes/**` de otro agente.
- Cambios en `database.rules.json`, functions, deploy.

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** un solo campo **opcional aditivo** en `Katzen/Recordatorios/{id}`: `whatsappEnviadoEn: number` (ms epoch). Se escribe con `update()` vía `RecordatoriosService.actualizarRecordatorio` (nodo ya escribible por staff). App móvil no lo requiere ni lo rompe.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Recordatorios` | staff | staff | `+ whatsappEnviadoEn?: number` |
  | `Katzen/Cliente` | staff (solo lectura) | no | `telefono` / `Telefono` ya hidratado |
  | `Katzen/Mascota` | staff (solo lectura) | no | `idCliente` / `cliente_id` para resolver dueño |
  | `localStorage['katzen.usage.v1']` | local | local | sin RTDB, sin PII |

- **Estrategia de Datos de Prueba:** emuladores Auth 9099 / RTDB 9000 (`npm run emulators`, `npm run emulators:seed`) y mocks. Prohibido `katzen-a0e3e`.

- **Patrones UI Reutilizados:** `.row-actions` + `mat-icon-button` + `matTooltip`, `admin-badge--success` para el chip, `app-admin-data-panel` + `.table-scroll` + `mat-table` para el panel de uso, SweetAlert para confirmar «Reiniciar conteo», `LoadingService.show('Guardando…')`.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí (recordatorios + panel de uso en Personal) |
| doctor | recordatorios sí; panel de uso no (vive en `usuarios`) |
| recepcionista | recordatorios sí |

---

## UI (rutas y layout)

- `/admin/recordatorios`: acciones de fila nuevas + chip. Sin ruta nueva.
- `/admin/usuarios`: sección final `app-uso-sistema-panel`. Sin ruta nueva.
- Layout admin: `UsageMetricsService.startTracking()` en `ngOnInit`.

---

## Backend

- [ ] Cloud Function: no
- [ ] Reglas RTDB: no
- [ ] Email / integración externa: no (deep link `wa.me`)

---

## Testing mínimo

Ver `tasks.md`.

---

## Notas / decisiones

- Lada país fija `52` (México). Si el teléfono trae `+52`/`52`/`521` se recorta antes de armar la URL.
- El chip usa `admin-badge--success` existente (sin hex nuevos); la fecha del chip se formatea en el util (la app no registra locale `es` para `DatePipe`).
- «Reiniciar conteo» pide confirmación (SweetAlert) porque borra la métrica local.
