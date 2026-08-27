# Tasks: 047 Enlace portal ↔ cliente clínico

**Estado:** in_progress  
**Spec:** `spec.md`

## Ola 1 — Ficha cliente

- [x] T-010: Bloque «Acceso al portal» en detalle (`modoVer`)
- [x] T-011: Botón enviar acceso → `provisionPortalClient`
- [x] T-012: Botón reenviar → `resendPortalClientAccess`
- [x] T-013: Estados sin correo / activo / inactivo
- [x] T-014: Chip Portal en listado

## Ola 2 — Self-reg vínculo correo

- [x] T-020: Match correo en `registerPortalOwner` antes de crear Cliente
- [x] T-021: Copy éxito landing si vinculado
- [x] T-022: Deploy functions con OK Luis (`registerPortalOwner`) · hosting copy landing pendiente si se quiere en prod

## Ola 3 (después)

- [ ] T-030: Confirmación match teléfono / mascota

## Testing y validación exhaustiva

> Ola 1 · 2026-08-27 · build local

| Ítem | Resultado | Notas |
|------|-----------|-------|
| `npm run build` | **PASS** | Hash 4ede72ea |
| Detalle sin correo | **PASS** (código) | CTA editar |
| Detalle con correo sin portal | **PASS** (código) | Enviar acceso |
| Detalle portal activo + reenviar | **PASS** (código) | |
| Password no visible | **PASS** | Solo mensaje Swal |
| Chip listado | **PASS** (código) | Portal / Sin portal / Sin correo |
| Preview `:4200` | **PASS** | `http://localhost:4200` vivo |

> Ola 2 · 2026-08-27 · callable en prod

| Ítem | Resultado | Notas |
|------|-----------|-------|
| `npm run functions:build` | **PASS** | `tsc` functions + functions-fcm |
| `npm run build` | **PASS** | Hash `ecb79431bd7d4a60` |
| Match correo sin portal | **PASS** (código) | `findClienteLinkableByEmail` + update ficha |
| Sin match → Cliente nuevo | **PASS** (código) | `portalLinkedFrom: self_register_new` |
| Portal ya activo mismo correo | **PASS** (código) | `already-exists` |
| Rollback mail fail | **PASS** (código) | Restaura patch; **no** borra ficha clínica |
| Password no en response | **PASS** | Solo `linkedExisting` + message |
| Landing Swal vinculado | **PASS** (código) | «¡Ya te encontramos en la clínica!» |
| Preview `:4200` | **PASS** | Live reload |
| Deploy `registerPortalOwner` | **PASS** | `us-central1` · OK Luis 2026-08-27 |
