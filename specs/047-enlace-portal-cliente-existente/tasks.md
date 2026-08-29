# Tasks: 047 Enlace portal ↔ cliente clínico

**Estado:** done (ola 1–2) · ola 3 diferida  
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
- [x] T-022: Deploy functions + hosting (`registerPortalOwner`, copy landing)

## Ola 3 (después)

- [ ] T-030: Confirmación match teléfono / mascota — **diferida** (backlog)

## Testing y validación exhaustiva

> Ola 1–2 · cierre 2026-08-28

| Ítem | Resultado | Notas |
|------|-----------|-------|
| `npm run build` | **PASS** | |
| `npm run functions:build` | **PASS** | |
| Detalle portal (enviar/reenviar) | **PASS** | código + prod |
| Self-reg match correo | **PASS** | prod `registerPortalOwner` |
| Landing Swal vinculado | **PASS** | hosting prod |
| Password no en response | **PASS** | |
| Deploy hosting + functions | **PASS** | 2026-08-27/28 |
| Ola 3 teléfono/mascota | **DIFERIDA** | T-030 |
