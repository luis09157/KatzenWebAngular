# Matriz QA CRUD — Admin KatzenVet

**Fecha cierre:** 2026-08-26  
**Mandato:** Luis Alfonso Niño Martínez  
**Entorno:** localhost `:4200` + Firebase prod vía Cypress autenticado  

Leyenda: **PASS** | **FAIL** | **BLOQUEADO** | **N/A**

---

## Resumen ejecutivo

| Métrica | Resultado |
|---------|-----------|
| `npm run build` | PASS (budget warning ~2.01 MB) |
| `npm run functions:build` | (si se tocó functions) |
| Proveedores Create/Edit/Borrar E2E | Fix UI sync Material + Cypress `fillMatInput` |
| Finanzas 014 MVP | Módulo `/admin/finanzas` + rules `Katzen/Caja` |
| Resend `RESEND_API_KEY` | **BLOQUEADO** — secret 404 (pasos abajo) |
| localhost `:4200` | Debe quedar vivo |

---

## Resend — pasos exactos para Luis (sin inventar API key)

Estado verificado 2026-08-26:

```text
firebase functions:secrets:access RESEND_API_KEY
→ 404 Secret not found

firebase functions:secrets:access PORTAL_FROM_EMAIL
→ 404 Secret not found
```

El código en `functions/src/portal-mail.ts` lee `process.env.RESEND_API_KEY` y `PORTAL_FROM_EMAIL`. **No hay key en el repo ni en Secret Manager.** Provision portal funciona con `emailSent: false` (warning en UI).

### Qué debe hacer Luis

1. Crear cuenta / API key en [https://resend.com](https://resend.com) (dominio verificado o usar sandbox).
2. En la máquina con Firebase CLI autenticado al proyecto `katzen-a0e3e`:

```bash
# Pegar la key real cuando Firebase lo pida (no commitear)
firebase functions:secrets:set RESEND_API_KEY

# Remitente verificado en Resend, ej. "Katzen Vet <noreply@tudominio.com>"
firebase functions:secrets:set PORTAL_FROM_EMAIL
```

3. Ligar secrets a las functions que envían correo y redesplegar, por ejemplo:

```bash
# Opción A — params en código (defineSecret) + redeploy de:
#   provisionPortalClient, resendPortalClientAccess, registerPortalOwner
#
# Opción B — si el runtime ya inyecta secrets por nombre de env:
firebase deploy --only functions:provisionPortalClient,functions:resendPortalClientAccess,functions:registerPortalOwner
```

4. Probar: en Admin → Personal y portal → activar / reenviar acceso a un correo propio → debe llegar mail y Swal **sin** warning «sin correo».
5. **No marcar PASS de correo** hasta ver el mensaje en la bandeja.

Nota: hoy las functions usan `process.env.RESEND_API_KEY` sin `defineSecret` en el callable. Si tras `secrets:set` el env sigue vacío, hay que añadir `secrets: [RESEND_API_KEY, PORTAL_FROM_EMAIL]` (o el patrón actual del repo) en esos `onCall` y volver a deploy. El agente **no inventa** la API key.

---

## Matriz por módulo (delta)

| Módulo | C | R | U | Soft-delete | Estado E2E |
|--------|---|---|---|-------------|------------|
| Inv. Proveedores | fix sync | PASS | fix hydrate | PASS | Create→Edit→Borrar |
| Finanzas / caja | PASS | PASS | N/A MVP | PASS | `admin-crud-finanzas.cy.ts` |

---

## SC futuros Finanzas

- Export CSV (SC-006)
- Vincular cobro desde baño (`cajaMovimientoId`)
- Balance mensual / rango fechas
- Stamp `sucursalId` al crear
