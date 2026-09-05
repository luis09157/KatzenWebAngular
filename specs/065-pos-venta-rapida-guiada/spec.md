# Spec: POS — venta rápida guiada

**ID:** 065-pos-venta-rapida-guiada  
**Estado:** done  
**Fecha:** 2026-09-04  
**Autor:** Luis Alfonso Niño Martínez + agente  
**Nivel:** L2  
**Relaciona:** 046 (mostrador `__mostrador__`), PLAN-UX ítems 2.0 / 2.1 / 2.2 (solo POS) + extras 2 y 3

---

## Problema

Ser cliente **no** es requisito para comprar productos. El POS pedía dueño antes de la caja y escondía el mostrador. La recepcionista necesita abrir directo en petshop, registrar dueño/mascota solo al agregar un servicio clínico, buscar por teléfono y mandar el ticket por WhatsApp (`wa.me`) sin infraestructura.

---

## User stories

### US-1 — Venta rápida por defecto

Como **recepción**  
Quiero que «Nueva venta» abra en productos con mostrador implícito  
Para cobrar petshop sin registrar a nadie

**Criterios:**

- [x] SC-001: POS nuevo abre en paso Caja / riel petshop; `cliente_id = __mostrador__` (spec 046).
- [x] SC-002: El bloque «¿Es cliente / trae mascota?» es opcional (chip o sticky).
- [x] SC-003: Consulta / peluquería piden dueño + mascota en ese momento (`pedirClientePara`, `accionPendiente`) y reanudan el riel.

### US-2 — Alta rápida inline

Como **recepción**  
Quiero crear dueño y mascota desde el POS  
Para no ir al menú Clientes / Pacientes

**Criterios:**

- [x] SC-004: «Cliente nuevo» abre `ClienteDialog` `data.modo: 'rapido'` (nombre + teléfono).
- [x] SC-005: Tras guardar, pregunta «¿Trae mascota?» y abre `PacienteAdminDialog` modo reducido.
- [x] SC-006: El picker emite `@Output() crearCliente` / `crearPaciente`; `permitirCrear` en POS y, en ola 2, cita / vacuna / baño / pensión / consentimiento.

### US-3 — Búsqueda por teléfono y táctil

Como **recepción**  
Quiero buscar por el teléfono que tengo a la mano y tocar botones grandes  
Para cobrar en tablet

**Criterios:**

- [x] SC-007: Placeholder «Teléfono o nombre del dueño»; ≥3 dígitos prioriza teléfono; autofocus en POS.
- [x] SC-008: Botones +/− y CTAs ≥44 px; montos con `inputmode="decimal"`; estilos nuevos con tokens (no hex sueltos).

### US-4 — Ticket por WhatsApp

Como **recepción**  
Quiero enviar el ticket por WhatsApp  
Para que el comprador se lleve el comprobante

**Criterios:**

- [x] SC-009: Util puro `pos-ticket-whatsapp.util.ts` + spec ≥5 casos.
- [x] SC-010: URL `https://wa.me/52{tel}?text=` con texto prellenado; mostrador pide teléfono opcional.

---

## Fuera de alcance

- (Cerrado 2026-09-04) Activar «+» en cita / vacuna / baño / pensión / consentimiento — mismo helper que POS.
- Kits BOM, turno de caja, ticket 80 mm, functions, reglas RTDB.
- `src/app/recordatorios/**`, layouts, `core/services`, `functions*`.

---

## Contratos de Datos y UI

- **Impacto RTDB:** ninguno nuevo. Reusa `Katzen/Cliente`, `Katzen/Mascota`, `Katzen/Visitas` con `esMostrador` / `__mostrador__` (046). Campos aditivos existentes.
- **Pruebas:** emuladores Auth 9099 + RTDB 9000 + seed; mocks locales. Prohibido producción `katzen-a0e3e`.
- **Patrones UI:** `admin-dialog-shell` (nunca `mat-dialog-title`), `ADMIN_DIALOG_*`, `LoadingService` contextual, copy latino.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí (módulo Visitas / POS) |
| doctor | sí |
| recepcionista | sí |

---

## UI

- Ruta: `/admin/visitas` → diálogo POS (`visita-dialog`).
- Sin ruta nueva. Cypress no obligatorio.

---

## Backend

- [ ] Cloud Function: no
- [ ] Reglas RTDB: no
- [ ] WhatsApp: solo `wa.me` (sin API)
