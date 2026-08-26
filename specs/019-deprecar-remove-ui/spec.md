# Spec: Deprecar `.remove()` en servicios UI

**ID:** 019-deprecar-remove-ui  
**Estado:** done  
**Fecha:** 2026-08-26  

---

## Criterios

- [ ] SC-001: Métodos `eliminar*` que hacían `.remove()` delegan a baja lógica
- [ ] SC-002: `eliminarPeluqueroFisicamente` lanza error / no expuesto en UI
- [ ] SC-003: Sin rutas UI nuevas a hard-delete

UI ya usa baja lógica en la mayoría; este cambio cierra deuda AUDIT.
