# Spec: Aislamiento RTDB notas internas

**ID:** 016-notas-internas-aislamiento  
**Estado:** done (retro, sin QA registrada)  
**Fecha:** 2026-08-26  

---

## Problema

`notas_internas` vive en `Historiales_Clinicos`. El portal las filtra en mapper, pero un cliente con lectura del nodo **sí** podría ver el campo en RTDB. Se necesita nodo staff-only aditivo.

---

## User stories

### US-1 — Nodo staff-only

Como **equipo**  
Quiero **guardar notas internas fuera del historial legible por portal**  
Para **aislar continuidad clínica del dueño**

**Criterios:**

- [ ] SC-001: Nodo `Katzen/Historiales_Notas_Internas/{historialId}` staff R/W; client deny
- [ ] SC-002: Admin escribe ahí al crear/editar; deja de persistir `notas_internas` en el historial público (null aditivo)
- [ ] SC-003: Admin lee merge: nodo privado + legacy `notas_internas` si existe
- [ ] SC-004: Portal mapper sigue sin exponer; documentar límite móvil (ignorar legacy)

---

## Contratos

| Nodo | Notas |
|------|-------|
| `Historiales_Notas_Internas/{id}` | `{ texto, updated_at, updated_by? }` staff only |
| `Historiales_Clinicos/{id}.notas_internas` | legacy opcional; nuevas escrituras → null |

## Plan Mitigación

Rollback: dejar de escribir nodo nuevo; legacy sigue en historial.
