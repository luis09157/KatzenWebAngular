# Spec: Finanzas CSV + link baño→caja

**ID:** 018-finanzas-csv-banio-caja  
**Estado:** done (retro, sin QA registrada)  
**Fecha:** 2026-08-26  
**Extiende:** 014-finanzas-caja-mvp  

---

## Criterios

- [ ] SC-001: Export CSV de movimientos del día filtrado
- [ ] SC-002: Desde baños: «Registrar en caja» abre diálogo prellenado; escribe `cajaMovimientoId` en baño
- [ ] SC-003: Si ya hay `cajaMovimientoId`, avisar (no doble cobro silencioso)

## Contratos

`Banios.cajaMovimientoId` opcional (ya en modelo). Sin callable.
