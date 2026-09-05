# Spec: Fase 2 — Flujos guiados

**ID:** 070-fase2-flujos-guiados  
**Estado:** done  
**Fecha:** 2026-09-04  
**Autor:** Cursor (Grok) / Luis Alfonso Niño Martínez  
**Nivel:** L2 (diálogos, utils, POS; sin `plan.md`; sin rules RTDB nuevas)  
**Relaciona:** PLAN-UX Fase 2 · **065** (ítems 2.0–2.2, ya done) · **064** F4 kits · **046** mostrador

---

## Problema

Una recepcionista no puede atender «llegó un paciente» sin saltar entre menús. El POS no explota kits (BOM). Una cita de hoy no abre el expediente. Una salida tipo venta cobra por un segundo camino (caja) en vez del POS.

Los ítems **2.0–2.2** ya están cerrados en `specs/065-pos-venta-rapida-guiada/` (mostrador por defecto, alta inline, `+` en pickers). Esta spec **no los reimplementa**; verifica y completa 2.3–2.6.

---

## User stories

### US-1 — Asistente «Llegó un paciente» (2.3)

Como **recepción / doctora**  
Quiero dueño → mascota → qué viene a hacer, en un solo diálogo  
Para no ir a Clientes, Pacientes y luego al módulo clínico

**Criterios de aceptación:**

- [x] SC-001: Diálogo `AltaRapidaDialog` (`admin-dialog-shell`, `ADMIN_DIALOG_*`) con 3 pasos: Dueño (picker; si no existe → `ClienteDialog` `modo:'rapido'`), Mascota (lista del dueño; «Nueva» → `PacienteAdminDialog` `modo:'rapido'` con dueño prefijado), chips Consulta / Vacuna / Baño / Pensión / Solo cita.
- [x] SC-002: El chip abre el diálogo existente (`HistorialDialog` / `VacunaDialog` / `BanioDialog` / `PensionDialog` / `CitaDialog`) con `cliente_id` + `paciente_id` (mismo patrón que `pacientes.component.ts` → `agregarVacuna()`). Al terminar, navega a `/admin/paciente?id=`.
- [x] SC-003: Entradas: botón grande en `/admin/inicio`; empty-state y banner de Citas. Copy latino, `LoadingService` contextual. Sin entrada extra en el menú (evitar saturar).

### US-2 — Kits en POS (2.4 / 064 F4)

Como **cajero**  
Quiero vender un paquete y que baje el stock de los componentes  
Para no dejar el SKU kit en 0 ni inventar BOM

**Criterios de aceptación:**

- [x] SC-004: Util puro + tests: si `esKit` / `kitComponentes` tiene BOM, validar stock de **componentes** (no el SKU kit). Al persistir, N `registrarSalida` de componentes (nodo/campos existentes).
- [x] SC-005: Sin BOM (`esKit` y `kitComponentes` vacío o ausente): mensaje «Este paquete no tiene componentes cargados», no «Sin stock». No se inventan componentes. Gap documentado si el catálogo emulador no trae BOM.

### US-3 — Atender desde citas (2.5)

Como **doctora**  
Quiero un botón **Atender** en citas de hoy  
Para abrir el expediente sin buscar a la mascota

**Criterios de aceptación:**

- [x] SC-006: Atender → `/admin/paciente?id={pacienteId}` en listado de Citas y en el diálogo de citas del día (dashboard). Si falta `paciente_id`, el botón se deshabilita con tooltip. No rompe.

### US-4 — Salida venta → POS (2.6)

Como **admin**  
Quiero que una salida tipo venta cobre en el POS  
Para no tener un segundo camino de cobro en caja

**Criterios de aceptación:**

- [x] SC-007: `salida-dialog` con motivo venta y destino «caja» (`abrirCajaTrasVenta`) redirige a POS (`visita-dialog`, mostrador) con el producto precargado. No registra salida de stock en el diálogo de inventario (el POS la genera al cobrar). Reusa 046/065.

---

## Fuera de alcance

- Reescribir 2.0–2.2 (065). Turno de caja, ticket 80 mm, menú 6 grupos (Fases 3–4).
- Rules RTDB, Cloud Functions, deploy, commit.
- Inventar BOM si el producto no tiene `kitComponentes`.
- Devolución de kits (064 historial / freeze).

---

## Contratos de Datos y UI

- **Impacto en Firebase RTDB:** ninguno nuevo. Se reutilizan `Katzen/Cliente`, `Katzen/Mascota`, diálogos clínicos existentes, `Katzen/Inventario/Movimientos` (`registrarSalida`) y campos opcionales ya importados `esKit` / `kitComponentes` (064).

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Cliente` / `Katzen/Mascota` | staff | staff | alta rápida existente (065) |
  | `Katzen/Inventario/Productos` | staff | no (POS) | `esKit`, `kitComponentes`, `pdvCodigo` opcionales |
  | `Katzen/Inventario/Movimientos` | staff | staff | N salidas de componentes; mismo `registrarSalida` |
  | `Katzen/Visitas` | staff | staff | línea del SKU kit; salidas en componentes |

- **Gap BOM:** el import 064 escribe `kitComponentes` cuando el FDB trae `COMPONENTES`. Si un kit quedó sin BOM (huérfano o catálogo parcial en emulador), la UI lo dice claro. No se fabrican filas.
- **Pruebas:** localhost + emulador Auth 9099 / RTDB 9000. Prohibido `katzen-a0e3e` prod.
- **Patrones UI:** `admin-dialog-shell`, nunca `mat-dialog-title`, `ADMIN_DIALOG_*`, `LoadingService`, copy latino.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí |
| doctor | sí |
| recepcionista | sí |

---

## UI

- Sin ruta nueva. Cypress no obligatorio.
- `/admin/inicio` → «Llegó un paciente»; `/admin/citas` empty-state + Atender; POS `/admin/visitas`.

---

## Backend

- [ ] Cloud Function: no
- [ ] Reglas RTDB: no
- [ ] WhatsApp / email: no

---

## Notas / decisiones

- **2.0–2.2:** citados de 065 (SC-001 a SC-006 y ola 2 `permitirCrear`). No reimplementar.
- Cita: el diálogo no persiste solo; el asistente llama `citasService.guardarCita` como el expediente.
- Layout/sidenav: sin botón extra (Fase 4 menú compacto).
