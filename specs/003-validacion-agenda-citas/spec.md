# Spec: Validación de agenda de citas

**ID:** 003-validacion-agenda-citas  
**Estado:** done  
**Fecha:** 2026-08-25  
**Autor:** Cursor agent (coordinado con Luis Alfonso Niño Martínez)

---

## Problema

La agenda de citas permite doble booking del mismo veterinario, no exige veterinario ni duración, bloquea fechas pasadas a todos (incluyendo veterinarias) y permite cancelar o revertir estados sin las reglas de negocio confirmadas. Esto genera conflictos operativos y datos incompletos para el portal.

---

## User stories

### US-1 — Veterinario obligatorio y duración

Como **recepcionista / doctor / administrador**  
Quiero **asignar un veterinario y una duración al agendar**  
Para **evitar citas sin responsable y estimar ocupación de agenda**

**Criterios de aceptación:**

- [x] SC-001: Campo `veterinario` con `Validators.required` en diálogo y validación en `CitasService.guardarCita`
- [x] SC-002: Campo `duracion_minutos` aditivo RTDB; default **30**; editable (≥ 5)
- [x] SC-003: Citas legacy sin `duracion_minutos` se tratan como 30 min al validar solapamiento

### US-2 — Sin solapamiento por veterinario

Como **staff de citas**  
Quiero **que el sistema rechace citas solapadas del mismo veterinario**  
Para **no sobreasignar a un doctor en el mismo slot**

**Criterios de aceptación:**

- [x] SC-004: Ventana `[inicio, inicio+duracion)`; conflicto si mismo `veterinario` (nombre) y solape; excluir `activo === false` y `cancelada`
- [x] SC-005: Otros veterinarios **sí** pueden tener citas en paralelo a la misma hora
- [x] SC-006: Mensaje de error claro al usuario (sin stack técnico)

### US-3 — Motivo de cancelación

Como **staff**  
Quiero **indicar el motivo al cancelar una cita**  
Para **que el dueño lo vea en el portal**

**Criterios de aceptación:**

- [x] SC-007: Al pasar a `cancelada`, `motivo_cancelacion` obligatorio (diálogo y cambio de estado en lista)
- [x] SC-008: Portal muestra `motivo_cancelacion` cuando existe (citas canceladas visibles)

### US-4 — Fechas pasadas solo veterinarias

Como **veterinaria / administrador operativo**  
Quiero **poder agendar citas en fechas pasadas**  
Para **registrar atención retrospectiva**

**Criterios de aceptación:**

- [x] SC-009: Roles `doctor` y `administrador` pueden fecha &lt; hoy
- [x] SC-010: `recepcionista` (y demás) siguen bloqueados con error `fechaPasada`

### US-5 — Revertir completada → confirmada

Como **veterinaria / administrador**  
Quiero **revertir una cita completada a confirmada**  
Para **corregir errores de estado**

**Criterios de aceptación:**

- [x] SC-011: Acción “Revertir” visible solo para `doctor` / `administrador`
- [x] SC-012: Servicio rechaza la transición si el rol no es operativo veterinario

---

## Fuera de alcance

- Reglas RTDB granulares por `staffRole` (otra spec)
- Filtro portal “solo activas” (backlog #4 UX)
- Cloud Functions / deploy
- Paginación server-side de citas
- Notificaciones push al cancelar

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Solo campos **opcionales** aditivos en `Katzen/Citas/{id}`. No se eliminan ni renombran nodos. App móvil ignora campos desconocidos → sin impacto.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Citas/{id}` | staff / client (sus mascotas) | staff | `duracion_minutos?: number`, `motivo_cancelacion?: string`; `veterinario` ya existía |

- **Estrategia de Datos de Prueba:** Mocks en `src/app/core/testing/mock-data.ts` + util de solapamiento con datos locales. Prohibido conectar RTDB producción (`katzen-a0e3e`).

- **Patrones UI Reutilizados:** `admin-dialog-shell`, formularios Material existentes en `cita-dialog`, menú de acciones `.row-actions` / `mat-menu`, SweetAlert2 para motivo al cancelar desde lista, portal `portal-list-section` para mostrar motivo.

---

## Roles

| Rol staff | ¿Accede módulo citas? | Fechas pasadas | Revertir completada |
|-----------|----------------------|----------------|---------------------|
| administrador | sí | sí | sí |
| doctor | sí | sí | sí |
| recepcionista | sí | no | no |
| peluquero | no | — | — |

---

## UI (rutas y layout)

- Ruta admin: `/admin/citas` (existente)
- Portal: `/portal/mascotas/:id/citas` — mostrar motivo cancelación
- Sin cambio de layout KPI/banner/panel

---

## Backend

- [ ] Cloud Function: no
- [ ] Reglas RTDB: no (validación en Angular; reglas granulares fuera de alcance)
- [ ] Email / integración externa: no

---

## Testing mínimo

Ver `tasks.md` sección Testing y validación exhaustiva.

---

## Notas / decisiones

- Decisiones de negocio #1–#5 en `specs/memory/domain-context.md`
- Auditoría: ítems 6–10 en `specs/AUDIT-CODE.md`
- “Veterinario operativo” = `doctor` | `administrador` (alias `admin`)
- **UX borrado:** la acción destructiva en UI de citas se etiqueta **«Borrar»** (no «Baja lógica»). Técnicamente sigue siendo `bajaLogicaCita` / `activo: false`.