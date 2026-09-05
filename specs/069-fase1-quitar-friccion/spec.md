# Spec: Fase 1 — Quitar fricción operativa

**ID:** 069-fase1-quitar-friccion  
**Estado:** done  
**Fecha:** 2026-09-04  
**Autor:** Cursor (Grok) / Luis Alfonso Niño Martínez  
**Nivel:** L2 (UI + utils + servicios Angular; sin plan.md; sin rules RTDB nuevas)

---

## Problema

Una veterinaria o recepcionista no puede operar el día a día sin chocar con formularios de 9–12 campos, jerga técnica (UID, spec, Firebase Auth), menús gemelos y un POS que pide catálogo demo o bloquea el cobro en efectivo sin mostrar cambio. Fase 1 del `PLAN-UX-VETERINARIAS.md`: quitar esa fricción sin tocar contratos de la app móvil.

---

## User stories

### US-1 — Formularios con mínimo útil

Como **doctora / recepción**  
Quiero registrar historial, cita, mascota, dueño y producto con pocos campos  
Para no abandonar el alta a mitad del turno

**Criterios de aceptación:**

- [x] SC-001: Historial nuevo exige solo motivo (`historia_clinica`) + nota (`notas_internas`). El resto opcional y colapsado en «Más datos». Fecha/hora y médico siguen con default.
- [x] SC-002: Cita nueva: veterinaria = staff logueada, duración 30, estado `pendiente` oculto (se guarda igual). Sin hint de UID.
- [x] SC-003: Paciente: raza y sexo opcionales en alta completa (no solo modo rápido). Cliente: género opcional. Teléfono 10 dígitos se mantiene.

### US-2 — Alta rápida de producto y POS usable

Como **recepción / admin**  
Quiero dar de alta un producto con nombre, precio, categoría y stock, y cobrar en efectivo viendo el cambio  
Para no ir a 12 campos ni calcular cambio a mano

**Criterios de aceptación:**

- [x] SC-004: Producto nuevo válido con nombre, precio de venta, categoría y stock inicial. Proveedor opcional o «Proveedor General». Resto con defaults / «Más datos».
- [x] SC-005: POS real no mezcla catálogo demo si el flag está apagado. Copy del POS lleva a `/admin/inventario/productos` en lugar de «está en Administración».
- [x] SC-006: Paso Cobrar: si el método incluye efectivo, campo «Recibí» y «Cambio $X». Util puro + ≥4 tests. Sin nodo RTDB nuevo.

### US-3 — Navegación, alertas y errores humanos

Como **staff**  
Quiero un solo «Pacientes», alertas que se generen solas y errores que digan qué hacer  
Para no adivinar menús ni códigos Firebase

**Criterios de aceptación:**

- [x] SC-007: Un ítem «Pacientes» → `/admin/paciente`. Sin «Directorio» gemelo ni «Dashboard métricas» duplicado. Directorio CRUD sigue por URL.
- [x] SC-008: Al abrir `/admin/inventario/alertas` y tras recepción de OC se corre `generarAlertasAutomaticas` sin diálogo obligatorio. Badge en menú si hay count. Dedup de alertas pendientes.
- [x] SC-009: `failed-precondition`, `invalid-argument`, `internal` (y `functions/internal`) indican acción. Tests del servicio (≥3).
- [x] SC-010: UI sin «spec 017», «UID del staff», «Firebase Auth», «override», «Migrar base de datos» (salvo `super_admin`), «Nuevo personal staff». Banner emulador solo con `useRtdbEmulator`.

---

## Fuera de alcance

- Fase 2–4 del PLAN-UX (asistente, turno de caja, ticket 80 mm, menú 6 grupos)
- Rules RTDB, Cloud Functions, deploy, commit
- Migración masiva de productos/historiales
- Persistir «Recibí» / cambio en RTDB

---

## Contratos de Datos y UI

- **Impacto en Firebase RTDB:** ninguno nuevo. Se reutilizan campos existentes (`historia_clinica`, `notas_internas`, `stock_actual` al crear, `estado` de cita = `pendiente`). `stock_inicial` es solo UI; se escribe en `stock_actual` ya existente.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Historiales_Clinicos` | staff | staff | mismos campos; menos required en UI |
  | `Katzen/Citas` | staff | staff | `estado` default `pendiente` (ya existía) |
  | `Katzen/Mascota` / `Katzen/Cliente` | staff | staff | raza/sexo/género opcionales en UI |
  | `Katzen/Inventario/Productos` | staff | staff | `stock_actual` al alta (campo existente) |
  | `Katzen/Inventario/Alertas` | staff | staff | misma generación; dedup por tipo+producto pendiente |

- **Estrategia de Datos de Prueba:** localhost + emulador RTDB (`useRtdbEmulator`) o mocks. Prohibido `katzen-a0e3e` prod.
- **Patrones UI:** `admin-dialog-shell`, nunca `mat-dialog-title`, `ADMIN_DIALOG_*`, «Borrar», `LoadingService`, `ErrorMessagesService`.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí |
| doctor | sí (menú compacto no aplica; ve Pacientes) |
| recepcionista | sí (Pacientes + POS + alertas si inventario en nav) |

---

## UI (rutas y layout)

- `/admin/historiales`, `/admin/citas`, `/admin/pacientes-admin`, `/admin/clientes`, `/admin/inventario/productos`, `/admin/inventario/alertas`, `/admin/visitas`, `/admin/paciente`
- Sin ruta nueva. Cypress no aplica.

---

## Backend

- [ ] Cloud Function: no
- [ ] Reglas RTDB: no
- [ ] Email / integración externa: no

---

## Testing mínimo

Ver `tasks.md` sección Validación.

---

## Notas / decisiones

- Historial: motivo = `historia_clinica`, nota = `notas_internas` (continuidad entre doctoras; no visible al dueño). Diagnóstico y examen físico quedan en «Más datos».
- Catálogo demo POS: `usarCatalogoDemoPos: false` en `environment.ts` (el emulador ya tiene catálogo eleventa). El util sigue permitiendo encenderlo a propósito.
- «Migrar base de datos» solo `super_admin` (rol extremo), no cualquier admin con módulo usuarios.
