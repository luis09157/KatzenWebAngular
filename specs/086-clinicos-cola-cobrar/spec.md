# Spec: Vacunas y consultas → cola de cobro (mismo molde peluquería)

**ID:** 086-clinicos-cola-cobrar  
**Estado:** in_progress  
**Fecha:** 2026-10-02  
**Autor:** Agente (Luis)  
**Nivel:** L2 (UI/lógica Angular; RTDB aditivo si aplica)  
**Extiende:** 040, 045, 085  

---

## Problema

En peluquería ya funciona: se registra el baño → aparece en Cobrar / ticket del dueño → al cobrar sale de la lista.  
Vacunas y consultas (historial clínico / cita completada) ya tienen atajos «Agregar a ticket» (040), pero **dentro del POS** el mostrador no ve las pendientes del cliente/paciente como cards (como la «Nota de peluquería»). Eso invita a cobrar «Consulta genérica» sin ligar el origen y a volver a cobrar lo mismo.

**Objetivo:** mismo molde — aplicar vacuna o registrar consulta en el expediente; en mostrador, al abrir el ticket de ese dueño/mascota, ver lo aplicado pendiente y cobrarlo; al cobrar, desaparece.

---

## Principios

1. **Registrar ≠ cobrar.** Cobro solo vía Ticket del día (`visitaId` / `historialId` / `vacunaId` / `citaId` en líneas).  
2. **Cola ≠ historial.** Al cobrar, sale de pendientes; el registro clínico permanece.  
3. **No segundo camino de caja** en Vacunas/Historiales.  
4. Reutilizar `por-cobrar-hoy`, `vincularOrigenesDesdeLineas`, patrón 085 (huérfanos + cards).

---

## User stories

### US-1 — Vacuna aplicada aparece en mostrador

Como **recepción / doctor**  
Quiero **ver en Cobrar / ticket del dueño las vacunas aplicadas hoy sin ticket**  
Para **cobrarlas sin reabrir el módulo Vacunas**

**Criterios:**

- [x] SC-001: Vacuna `aplicada`/`completada` del día, sin `visitaId`, con dueño resuelto, aparece en «Por cobrar hoy» y como card en el riel Consulta del POS de ese cliente (filtro paciente si hay).  
- [x] SC-002: Al incluirla en el ticket se pide monto si `precio` ≤ 0 (sugerido = precio guardado o 0).  
- [x] SC-003: Tras guardar/cobrar con `vacunaId`, la vacuna deja de listarse (tiene `visitaId`).

### US-2 — Consulta (historial) pendiente en mostrador

Como **recepción**  
Quiero **ver historiales del día sin ticket** en el POS del dueño  
Para **cobrar la consulta ligada al historial**

**Criterios:**

- [x] SC-004: Historial del día sin `visitaId`/`cobradaEnVisitaId`/`cajaMovimientoId` aparece como pendiente de consulta.  
- [x] SC-005: Al incluir, monto con default de servicio «consulta» del catálogo clínica si existe; si no, prompt.  
- [x] SC-006: Tras cobrar con `historialId`, desaparece de pendientes.

### US-3 — Sin líneas huérfanas / CTA visible

- [x] SC-007: Si hay pendientes de vacuna/consulta, «Consulta» genérica / atajo no crea línea sin origen cuando hay una sola pendiente (o avisa si hay varias).  
- [x] SC-008: Al persistir, religar líneas huérfanas `consulta`/`vacuna` por precio (mismo criterio que baños 085).  
- [x] SC-009: En listado Vacunas, botón de fila «Enviar a cobrar» (no solo menú ⋮) para aplicadas sin ticket.

---

## Fuera de alcance

- Cobro directo en Finanzas/caja desde vacuna/historial  
- Cambiar el flujo clínico de aplicar vacuna / guardar historial  
- Pensión (ya en 040; no duplicar)  
- `firebase deploy` / commit sin autorización de Luis  

---

## Contratos de Datos y UI

- **Impacto RTDB:** Ninguno nuevo obligatorio. Usa campos existentes `visitaId`, `vacunaId`, `historialId`, `citaId`, `precio` en vacuna. App móvil no afectada.  
- **Pruebas:** localhost / emulador / mocks. Prohibido prod.  
- **UI:** `admin-dialog-shell` POS; cards como pendientes baño; LoadingService en atajos existentes.

---

## Testing mínimo

Unit tests util pendientes clínicos + `npm run build` + smoke 375/1280: vacuna aplicada → card en ticket → cobrar → desaparece; historial → igual.

---

## Notas

- Citas `completada` siguen en «Por cobrar hoy» (040); en POS se pueden incluir como pendiente de consulta si tienen monto. Prioridad de esta entrega: **vacuna + historial**.  
- Spec 085 = molde peluquería; esta spec = misma UX para clínicos.
