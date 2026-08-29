# Plan técnico: Hub operación y menú 3 mundos

**Spec:** `specs/049-hub-operacion-menu/spec.md`  
**Estado:** approved  

---

## Resumen

Añadir hub recepción arriba del dashboard dueño en `/admin/inicio`, reorganizar sidenav en 3 mundos con separadores, y toolbar con label de módulo desde mapa de rutas. Solo frontend.

---

## Archivos a crear / modificar

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/core/config/admin-route-labels.config.ts` | crear | Mapa URL → label toolbar |
| `src/app/dashboard/dashboard.component.*` | modificar | Hub + por cobrar |
| `src/app/layouts/admin-main-layout.component.*` | modificar | Menú 3 mundos + toolbar |
| `src/app/dashboard/dashboard.module.ts` | modificar | Servicios por cobrar |

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ninguno.

- **Estrategia de Datos de Prueba:** mocks + localhost.

- **Patrones UI:** `app-admin-module-card`, visitas `buildPorCobrarHoy`, inventario hub cards.

---

## Plan de Mitigación y Rollback

| Escenario | Acción |
|-----------|--------|
| Hub rompe layout dashboard | Revertir HTML/CSS dashboard |
| Menú confunde roles | Revertir admin-main-layout.html |

- [x] Sin cambios destructivos RTDB
- [ ] `npm run build` exitoso

---

## Deploy

Solo hosting si Luis lo pide.

```bash
npm run build
```
