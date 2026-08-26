# Spec: Fallecido → archivar recordatorios

**ID:** 017-fallecido-archivar-recordatorios  
**Estado:** done  
**Fecha:** 2026-08-26  

---

## Problema

Decisión dominio #11: al marcar mascota **Fallecido**, archivar recordatorios activos (baja lógica) para no notificar dueños.

---

## Criterios

- [ ] SC-001: Al `actualizarPaciente` con `estado: Fallecido`, batch `Recordatorios` del `paciente_id` → `activo: false`
- [ ] SC-002: Conservar nodos (no `.remove()`)
- [ ] SC-003: Idempotente si ya archivados

## Contratos

Solo updates aditivos en `Katzen/Recordatorios/{id}`. Compatible móvil.
