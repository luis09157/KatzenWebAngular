# Spec: Autocomplete unificado de producto

**ID:** 044-producto-picker  
**Estado:** done  
**Fecha:** 2026-08-27  
**Extiende:** inventario (entrada, salida, ajuste, OC) + patrón `app-cliente-paciente-picker`

---

## Problema

Cada diálogo de inventario copia su propio autocomplete de producto (filtro distinto, sin foto, sin QR/código). Recepción pelea al sacar stock, ajustar o armar una OC. El resto del admin ya unificó cliente/paciente; el producto quedó atrás.

---

## User stories

### US-1 — Un solo buscador

Como **staff**  
Quiero buscar producto por nombre, código, marca o presentación en todos los movimientos  
Para no memorizar IDs ni pelear con listas distintas

**Criterios:**

- [ ] `app-producto-picker` en entrada, salida, ajuste y líneas de orden de compra
- [ ] Filtro compartido (nombre, código de barras / QR, marca, presentación, categoría)
- [ ] Selección escribe `producto_id`; botón limpiar
- [ ] Prefill por `producto_id` (salida desde pensión, OC desde stock bajo)

### US-2 — Contexto de clínica

- [ ] Opción muestra stock y unidad (bajo / sin stock)
- [ ] Miniatura si hay `imagen_url` (043)
- [ ] Diálogos conservan su caja de detalle (código, ubicación)

---

## Fuera de alcance

- Lector de cámara
- Unificar `Katzen/Medicamentos` (receta) con inventario
- Visitas / ticket (líneas no usan catálogo inventario aún)

---

## Contratos de Datos y UI (Obligatorio)

- **RTDB:** solo lectura de `Katzen/Inventario/Productos` (igual que hoy). Sin campos nuevos.
- **Pruebas:** mocks `MOCK_PRODUCTO_INVENTARIO` + util unitaria. No producción.
- **UI:** Material autocomplete + `admin-dialog-shell`. Componente en `shared/admin/` como el picker cliente/paciente.

---

## Definition of Done

- [x] `npm run test:044` + `npm run build`
- [x] QA en `tasks.md`
