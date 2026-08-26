# Plan técnico: Cascada baja cliente

**Spec:** `specs/009-cascada-baja-cliente/spec.md`  
**Estado:** approved  

---

## Resumen

MVP en `ClientesService.bajaLogicaClienteCascada` + UI en `ClientesComponent`. Revocación portal reutiliza `deactivatePortalClient` (best-effort).

---

## Archivos

| Archivo | Acción |
|---------|--------|
| `src/app/clientes/clientes.service.ts` | cascada async |
| `src/app/clientes/clientes.component.ts` | wire + loading + mensaje |

---

## Contratos de Datos y UI (Obligatorio)

| Nodo | Acción | ¿Móvil? | Notas |
|------|--------|---------|-------|
| Cliente/Mascota/Citas | updates aditivos de flags | no rompe esquema | baja lógica |

- [x] Sin delete físico
- [x] Motivo cancelación estándar en citas

**Mitigación / rollback:** revertir método y volver a `bajaLogicaCliente` simple; datos ya bajados se reactivan a mano.

---

## Deploy

Sin function nueva. Portal revoke usa CF ya desplegada.
