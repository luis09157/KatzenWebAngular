# Spec: Política de mermas / stock negativo (inventario)

**ID:** 007-politica-mermas-inventario  
**Estado:** done  
**Fecha:** 2026-08-25  
**Autor:** Cursor agent (coordinado con Luis Alfonso Niño Martínez)  
**Origen:** Decisión de negocio #12 (`domain-context.md`) · Hallazgo AUDIT-CODE #4

---

## Problema

El tipo de movimiento `merma` en la transacción RTDB resta stock **sin** validar disponibilidad, lo que permite stock negativo. Además no hay un método explícito `registrarMerma` ni garantía de motivo obligatorio en servicio. Los ajustes de inventario (que pueden corregir mermas no registradas) no exigen rol supervisor. Esto pone en riesgo la integridad del inventario clínico.

---

## User stories

### US-1 — Bloqueo de stock negativo en merma

Como **staff de inventario**  
Quiero **que una merma no pueda dejar el stock en negativo**  
Para **mantener integridad de existencias (igual que salidas)**

**Criterios de aceptación:**

- [x] SC-001: En la transacción RTDB, `tipo: 'merma'` rechaza si `stock_actual < cantidad` (mismo criterio que `salida`)
- [x] SC-002: Mensaje de error claro al usuario (stock disponible vs solicitado), sin stack técnico
- [x] SC-003: Red de seguridad: ninguna operación de inventario deja `stock_actual < 0`

### US-2 — Motivo obligatorio en merma

Como **staff de inventario**  
Quiero **registrar el motivo al reportar merma**  
Para **auditoría y trazabilidad de pérdidas / caducados**

**Criterios de aceptación:**

- [x] SC-004: Existe `registrarMerma()` en `InventarioService` con `motivo` obligatorio (trim no vacío)
- [x] SC-005: UI de salida con motivo «Merma / Caducado» persiste como `tipo: 'merma'` (no como salida genérica)
- [x] SC-006: Si falta motivo, el servicio rechaza antes de tocar stock; UI marca el campo obligatorio

### US-3 — Autorización supervisor en ajustes (MVP ligero)

Como **administrador / veterinario operativo**  
Quiero **ser quien autorice ajustes de inventario**  
Para **evitar correcciones de stock no supervisadas**

**Criterios de aceptación:**

- [x] SC-007: Solo roles `administrador` o `doctor` (`staffRoleIsVeterinarioOperativo`) pueden registrar **ajustes**
- [x] SC-008: UI oculta/deshabilita acción «Ajuste» para roles no autorizados; servicio rechaza si el rol no aplica
- [x] SC-009: Flujo formal de “aprobación dual / contraseña supervisor” queda **fuera de alcance** (SC futuro documentado)

---

## Fuera de alcance

- Reglas RTDB granulares por `staffRole` (otra spec / AUDIT #1)
- Flujo formal de autorización dual (segundo usuario / PIN supervisor)
- Salida de medicamento controlado ligada a historial (decisión #13)
- Diálogo CRUD dedicado solo-merma (reutiliza diálogo de salida con motivo merma)
- Deploy Firebase / commit (solo con autorización explícita de Luis)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Solo escritura aditiva en nodos existentes. No se renombran ni eliminan campos. El tipo `merma` ya existe en el modelo web; se usa de forma consistente. App móvil no se ve afectada (campos legacy intactos).

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Inventario/Productos/{id}` | staff | staff (transacción `stock_actual`) | sin campos nuevos; bloqueo `stock_actual >= 0` |
  | `Katzen/Inventario/Movimientos/{id}` | staff | staff (`push`) | `tipo: 'merma'`, `motivo` obligatorio; sin schema breaking |

- **Estrategia de Datos de Prueba:** Mocks locales en `src/app/core/testing/mock-data.ts` (`MOCK_PRODUCTO_INVENTARIO`) + unit tests del util de stock. Prohibido RTDB producción (`katzen-a0e3e`).

- **Patrones UI Reutilizados:** Diálogos `salida-dialog` / `ajuste-dialog` existentes (`admin-dialog-shell`, `ADMIN_DIALOG_FORM`); `ErrorMessagesService` + SweetAlert2; `LoadingService` con «Guardando…»; botones de acciones en `movimientos` / dashboard inventario.

---

## Roles

| Rol staff | ¿Accede inventario? | Merma (vía salida) | Ajuste |
|-----------|---------------------|--------------------|--------|
| administrador | sí (matriz módulos) | sí | sí (supervisor) |
| doctor | según matriz (hoy sin inventario en UI) | n/a si no entra al módulo | sí si llega al servicio |
| recepcionista | según matriz | n/a | no (ajuste) |
| peluquero | no | no | no |

> Nota: la matriz UI de inventario hoy es admin; la validación de ajuste se aplica en servicio por rol efectivo.

---

## UI (rutas y layout)

- Rutas: `/admin/inventario/movimientos`, dashboard inventario
- Sin rutas nuevas
- Loading contextual «Guardando…» al registrar merma/ajuste/salida
- Textos claros: «Stock insuficiente», «El motivo es obligatorio», «Solo un supervisor puede registrar ajustes»

---

## Backend

- [ ] Cloud Function nueva — **no**
- [ ] Reglas RTDB — **no** en esta entrega (validación en Angular + transacción cliente; reglas granulares = otra spec)
- [ ] Email / integración externa — no

---

## Testing mínimo

Ver `tasks.md` sección Testing + Validación exhaustiva (QA guide).

---

## Notas / decisiones

- Decisión #12: bloquear stock negativo; merma con motivo; ajuste con autorización supervisor si aplica.
- MVP: bloqueo + motivo + autorización ligera por rol admin/vet. Autorización formal dual = SC futuro.
- «Borrar» no aplica a esta feature (no hay baja de producto aquí).
