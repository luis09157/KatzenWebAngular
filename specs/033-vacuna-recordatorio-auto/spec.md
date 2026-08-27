# Spec: Vacuna → recordatorio automático de refuerzo

**ID:** 033-vacuna-recordatorio-auto  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** Agent (confirmación Luis Alfonso Niño Martínez — seguir SC vacuna→recordatorio)  

---

## Problema

Al aplicar una vacuna con **próxima dosis / refuerzo**, el staff debe acordarse de crear a mano un `Recordatorio`. El campo `proximaAplicacion` (e intervalo) ya existen en `Katzen/Vacunas`, y hay un checkbox parcial que solo actúa en **alta** si hay `fechaRecordatorio`. Resultado: refuerzos se pierden, el dueño no ve aviso en portal/push, y 031/032 dejaron esto como **deferred SC-017**.

---

## User stories

### US-1 — Auto-crear recordatorio al guardar vacuna con próxima fecha

Como **staff (admin / doctor / recepción)**  
Quiero que al guardar una vacuna con `proximaAplicacion` (o calculada por intervalo) se cree un **Recordatorio pendiente**  
Para no depender de un paso manual y que el dueño lo vea en portal / push FCM si hay token.

**Criterios de aceptación:**

- [x] SC-001: Al **crear** vacuna con fecha de próximo refuerzo → se crea `Katzen/Recordatorios` pendiente tipo `vacuna`
- [x] SC-002: Al **actualizar** vacuna con próxima fecha → asegura recordatorio (crea o actualiza el vinculado)
- [x] SC-003: Título/descripción claros en español (refuerzo + nombre vacuna)
- [x] SC-004: Enlace `paciente_id`, `cliente_id` (si existe) y `vacunaId` / `vacuna_relacionada_id`
- [x] SC-005: No duplicar si ya hay pendiente equivalente (mismo paciente + misma vacuna + misma fecha día)
- [x] SC-006: Toast/hint opcional «Se creó recordatorio de refuerzo para el …»
- [x] SC-007: Editable/cancelable desde módulo Recordatorios existente

### US-2 — Cancelar recordatorio al borrar vacuna

Como **staff**  
Quiero que al **borrar** (baja lógica) una vacuna se cancelen/archiven los recordatorios pendientes asociados  
Para no molestar al dueño con refuerzos de una vacuna anulada.

**Criterios:**

- [x] SC-008: Baja lógica vacuna → recordatorios pendientes con ese `vacunaId` pasan a `activo: false` (o `estado: cancelado`) sin `.remove()`
- [x] SC-009: Aditivo y seguro con legacy (sin `vacunaId` no se tocan otros recordatorios)

### US-3 — Portal y mocks

Como **dueño portal**  
Quiero ver el recordatorio auto-creado en la sección Recordatorios de la mascota  
Para planear el refuerzo.

**Criterios:**

- [x] SC-010: Mapper portal lee `fecha_hora_recordatorio` / `fecha_recordatorio`
- [x] SC-011: Mocks en `mock-data.ts` para vacuna + recordatorio auto
- [x] SC-012: Referencia 032 SC-017 → hecho vía 033; ROADMAP / domain-context actualizados

---

## Fuera de alcance

- Resend / correo / `RESEND_API_KEY`
- SMS / WhatsApp
- Redeploy FCM (ya desplegado; write de Recordatorio dispara push si hay token)
- Catálogo de intervalos por tipo de vacuna en RTDB (cálculo solo con `intervalo` del formulario)
- Migración masiva de vacunas legacy sin recordatorio

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Solo campos **opcionales aditivos** en `Katzen/Recordatorios`. No se eliminan ni renombran nodos. App móvil no exige los nuevos campos.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Vacunas` | staff / client filtrado | staff | sin cambio estructural; se usa `proximaAplicacion`, `intervalo`, `fechaRecordatorio` |
  | `Katzen/Recordatorios` | staff / client filtrado | staff | campos opcionales: `vacunaId`, `vacuna_relacionada_id`, `cliente_id`, `origen: 'vacuna_auto'` |

- **Estrategia de Datos de Prueba:** mocks locales en `src/app/core/testing/mock-data.ts`. Prohibido RTDB producción en pruebas del agente.

- **Patrones UI Reutilizados:** diálogo vacuna (`admin-dialog-shell`), SweetAlert éxito, `LoadingService`, módulo Recordatorios existente, portal list-section.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí (módulo vacunas / recordatorios) |
| doctor | sí |
| recepcionista | sí (según `staff-role.config`) |
| peluquero | según matriz existente |

---

## UI (rutas y layout)

- Ruta admin vacunas: existente `/admin/vacunas` + diálogo
- Recordatorios: `/admin/recordatorios` (editar/cancelar)
- Portal: `/portal/mascotas/:id/recordatorios`
- Sin rutas nuevas

---

## Backend

- [ ] Cloud Function nueva: **no** (FCM existente reacciona al write)
- [ ] Reglas RTDB: **no** (mismos nodos; índice opcional no requerido)
- [ ] Email: **no**

---

## Testing mínimo

Ver `tasks.md` — QA guide + `npm run build` + smoke localhost.

---

## Notas / decisiones

- Origen: deferred **032 SC-017** / gap #3 de **031**.
- Preferir fecha de recordatorio: `fechaRecordatorio` si existe; si no, `proximaAplicacion` (hora default 09:00).
- Si solo hay `intervalo` + `fechaAplicacion`, calcular `proximaAplicacion` antes de asegurar recordatorio.
- Fallo al crear recordatorio **no** revierte la vacuna (mismo patrón actual).
