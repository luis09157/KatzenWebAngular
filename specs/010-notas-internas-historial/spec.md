# Spec: Notas internas en historial clínico

**ID:** 010-notas-internas-historial  
**Estado:** done  
**Fecha:** 2026-08-25  
**Autor:** agente (decisión negocio #7)

---

## Problema

Las doctoras necesitan notas de continuidad **no visibles al dueño**. El modelo no tenía campo dedicado; el portal podía filtrar mal si se mezclaba con `notas`.

---

## User stories

### US-1 — Notas solo staff

Como **doctor**  
Quiero **guardar notas internas en el historial**  
Para **continidad entre doctoras sin exponerlas al portal**

**Criterios de aceptación:**

- [x] SC-001: Campo opcional aditivo `notas_internas` en `Historiales_Clinicos`
- [x] SC-002: UI admin (diálogo crear/editar + detalle) muestra el campo
- [x] SC-003: `mapHistorial` del portal **nunca** incluye `notas_internas`
- [x] SC-004: Documentar que móvil debe ignorar el campo (aislamiento total = nodo staff-only futuro)

---

## Fuera de alcance

- Nodo separado `Historiales_Notas_Internas` con rules que oculten el campo al client token (fase 2)
- Restrict write de `notas_internas` a nivel de child rule (MVP confía en write clínico + mapper)

---

## Contratos de Datos y UI

| Nodo / campo | Acción | ¿Móvil? |
|--------------|--------|---------|
| `Katzen/Historiales_Clinicos/{id}.notas_internas` | opcional string | debe ignorarse en UI móvil |

Patrones: `admin-dialog-shell`, form sections existentes.
