# Spec: Desparasitación — esquemas sugeridos, confirmación vet y recordatorio

**ID:** 053-desparasitacion-esquemas  
**Estado:** in_progress  
**Fecha:** 2026-08-28  
**Autor:** agente (cierre clínico operable; espejo de **052**)  
**Relaciona:** 033 (vacuna→recordatorio), 052 (esquemas + diálogo confirmar), 017 (fallecido), 023 (push)

---

## Problema

La clínica aplica desparasitantes con la misma cadencia que vacunas (cachorro cada 2 semanas, adulto cada 1–3 meses, externa mensual), pero **no hay entidad RTDB** ni motor. Solo existe `tipo: 'desparasitacion'` en recordatorios, un motivo de cita y copy de landing.

Sin un diálogo de confirmación, el staff o no agenda la siguiente dosis o inventa 7 días. 052 ya enseñó el patrón: **sugerir → el vet confirma o no agendar**.

Ola 1 (esta entrega): motor + diálogo + recordatorio, **ligado a `Katzen/Recordatorios`**.  
Ola 2 (siguiente): listado/filtro dedicado y cobro en ticket.  
**No** crear nodo `Katzen/Desparasitaciones` en ola 1 (aditivo innecesario; el móvil ignora campos nuevos en Recordatorios).

---

## Principio no negociable

> **Todo default es sugerencia. El veterinario confirma o edita siempre.**  
> KatzenVet no practica medicina. El producto del lote y el criterio clínico mandan.

---

## User stories

### US-1 — Sugerir intervalo al registrar desparasitación

Como **veterinaria / staff**  
Quiero que, al elegir paciente + tipo (interna / externa / ambas), el sistema proponga **próxima fecha**  
Para no dejar a cachorros sin serie ni a adultos a 7 días por default

**Criterios:**

- [x] SC-001: Motor puro (`esquema-desparasitacion.util.ts` + unit tests): perro/gato cachorro &lt;12 sem → 14 días; 12–24 sem → 30 días; adulto interna → 90 días; externa → 30 días; ambas → 30 + hint.
- [x] SC-002: Diálogo `admin-dialog-shell` «¿Agendar la siguiente dosis?» (espejo 052): fuente corta, fecha/hora/intervalo editables, presets, No agendar / Confirmar.
- [x] SC-003: Guardar el recordatorio de aplicación **no** crea la siguiente dosis hasta confirmar. Cancelar el diálogo aborta el guardado.
- [x] SC-004: Mascota `Fallecido`: no crear recordatorio siguiente (017).
- [x] SC-005: Ave / reptil / `OTRO`: copy «Sin esquema sugerido. Indica intervalo o no agendar.»
- [x] SC-006: Conejo / hurón: intervalo manual (default 90 si agendan) + hint (no copiar perro).

### US-2 — Registrar desde expediente y recordatorios

Como **staff en expediente o Recordatorios**  
Quiero un CTA **Registrar desparasitación**  
Para no rellenar a mano tipo/título

**Criterios:**

- [x] SC-007: CTA en expediente y en banner de Recordatorios; abre diálogo prefilled (`tipo: desparasitacion`, fecha hoy).
- [x] SC-008: Campo `tipoDesparasitacion` (`interna` \| `externa` \| `ambas`) visible si el tipo es desparasitación.
- [x] SC-009: Si confirma agenda: recordatorio **pendiente** siguiente con `origen: desparasitacion_auto`, `skipPushOnCreate: true` (anti-spam 052; el write 023 no debe avisar a 90 días).

### US-3 — Campos aditivos en Recordatorios

Como **sistema**  
Quiero persistir metadatos de esquema **opcionales**  
Para que la app móvil ignore lo que no conoce

**Criterios:**

- [x] SC-010: Campos opcionales: `tipoDesparasitacion`, `esquemaCodigo`, `intervaloConfirmadoDias`, `origen`, `skipPushOnCreate`. Sin borrar nodos ni renombrar `tipo`.

---

## Fuera de alcance (ola 1)

- Nodo RTDB nuevo `Katzen/Desparasitaciones`
- Scheduler FCM específico (reusa 023/052; skip al crear lejano)
- Cobro / línea de ticket automática (ola 2)
- Catálogo de productos desparasitantes en inventario (ola 2)
- Portal dueño: UI extra (ya ve recordatorios)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** aditivo en `Katzen/Recordatorios/{id}`. App móvil: campos desconocidos se ignoran.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Recordatorios/{id}` | staff / portal dueño (existente) | staff | `tipo: desparasitacion` ya existía; campos esquema opcionales |
  | `Katzen/Mascota` | especie/edad/estado | no | solo lectura para el motor |
  | `Katzen/Vacunas` | — | — | no se toca |

- **Estrategia de Datos de Prueba:** unit tests del motor (sin Firebase). UI en localhost / mocks. Prohibido producción.

- **Patrones UI Reutilizados:** `admin-dialog-shell`, `app-flow-hint`, `app-timepicker-field`, `app-cliente-paciente-picker`, SweetAlert2, `LoadingService`. Referencia: `vacuna-esquema-confirm-dialog`.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí |
| doctor | sí |
| recepcionista | sí (registra; el diálogo es el mismo) |
| peluquero | sí (recordatorios) |

---

## UI

- No hay ruta `/admin/desparasitacion` en ola 1.
- Flujo: `/admin/recordatorios` y `/admin/paciente` (expediente).
- Diálogo confirmación ~560px (`ADMIN_DIALOG_DETAIL`).

---

## Backend

- [ ] Cloud Function nueva: no
- [ ] Reglas RTDB: no (Recordatorios ya writable por staff)
- [ ] Email: no

---

## Testing mínimo

`npm run test:053` + `npm run build`. Ver `tasks.md`.

---

## Notas / decisiones

- Ola 1 **no** duplica el módulo Vacunas. El acto queda como recordatorio (completado = aplicada hoy; pendiente = próxima).
- Producto/lote: campo notas / descripción libre. No fingir catálogo MX.
- Defaults alineados a práctica clínica general (CAPC/ESCCAP de referencia); **no** son prescripción.
