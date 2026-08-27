# Spec: Consentimientos clínicos (stub / siguiente)

**ID:** 037-consentimientos-clinicos  
**Estado:** draft  
**Fecha:** 2026-08-26  
**Autor:** Agente Cursor / Luis Alfonso Niño Martínez  

---

## Problema

La clínica necesita registrar consentimientos informados (cirugía, anestesia, egreso, etc.) ligados a paciente/cliente, con evidencia de quién firmó y cuándo — hoy no hay módulo dedicado en el admin web.

---

## Alcance previsto (no implementar en 036)

- Catálogo de tipos de consentimiento (configurable o fijo MVP)
- Alta/edición ligada a `paciente_id` + `cliente_id`
- Staff UID/nombre (patrón 035)
- Vista en expediente / portal read-only opcional
- RTDB aditivo `Katzen/Consentimientos/{id}` (o bajo paciente)

---

## Fuera de alcance ahora

- Firma digital avanzada / eID
- Resend / envío por correo (Resend queda **al final** del backlog — ver ROADMAP)
- CFDI

---

## Estado

**Pending** — siguiente tras cerrar `036-ticket-mejoras`. Completar `plan.md` + `tasks.md` al arrancar implementación.

---

## Contratos de Datos y UI (Obligatorio) — borrador

- **Impacto RTDB:** nodo nuevo aditivo; app móvil no depende hoy.
- **Mocks:** locales en `mock-data.ts`.
- **UI:** admin-page + dialog-shell + picker cliente-paciente (029).

---

## Notas

Prioridad Luis (2026-08-26): 1) mejoras ticket → 2) consentimientos → 3) Resend al final.
