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
| Resend `RESEND_API_KEY` | **PENDIENTE LUIS** — secret 404; código listo (modo prueba) |
| localhost `:4200` | Debe quedar vivo |

---

## Resend — correo portal (sin dominio propio)

### Límites honestos

| Escenario | ¿Funciona? |
|-----------|------------|
| Firebase Hosting `katzen-a0e3e.web.app` como dominio de envío | **No** — Resend no lo acepta como FROM |
| Sin dominio propio | Solo **modo prueba**: FROM `KatzenVet <onboarding@resend.dev>` → **solo entrega al email de la cuenta Resend** |
| Correo a clientes / dueños reales | **Pendiente** hasta comprar + verificar dominio en Resend y cambiar FROM |

El agente **no inventa** la API key ni finge que el correo a terceros ya funciona.

### Estado verificado 2026-08-26

```text
firebase functions:secrets:access RESEND_API_KEY
→ 404 Secret not found

firebase functions:secrets:access PORTAL_FROM_EMAIL
→ 404 Secret not found (opcional; default = onboarding@resend.dev)
```

Código listo:

- `functions/src/portal-mail.ts` — default FROM `KatzenVet <onboarding@resend.dev>`
- Callables con `defineSecret('RESEND_API_KEY')`: `provisionPortalClient`, `resendPortalClientAccess`, `registerPortalOwner`
- UI admin avisa modo prueba / configurar Resend si `emailSent: false`

### Pasos exactos para Luis (una sola vez la key)

1. Crear cuenta en [https://resend.com](https://resend.com) y generar **API key**.
2. En máquina con Firebase CLI al proyecto `katzen-a0e3e`:

```bash
# Pegar la key cuando Firebase lo pida (no commitear, no pegar en chat)
firebase functions:secrets:set RESEND_API_KEY
```

3. **Opcional** (solo cuando tengas dominio verificado; no hace falta en modo prueba):

```bash
firebase functions:secrets:set PORTAL_FROM_EMAIL
# Ejemplo futuro: KatzenVet <noreply@tudominio.com>
```

Si no defines `PORTAL_FROM_EMAIL`, el código usa `KatzenVet <onboarding@resend.dev>`.

4. Redeploy de las functions que envían correo (tras existir el secret; si el secret 404 el deploy con `secrets: [...]` falla):

```bash
npm run functions:build
firebase deploy --only functions:provisionPortalClient,functions:resendPortalClientAccess,functions:registerPortalOwner
```

5. Probar: Admin → activar / reenviar acceso al **mismo email de la cuenta Resend** → debe llegar mail y Swal **sin** warning «sin correo».
6. **No marcar PASS de correo a clientes** hasta tener dominio + FROM propio.

### Cuando tengas dominio propio

1. En Resend: añadir dominio → registros DNS (SPF/DKIM) → verificar.
2. `firebase functions:secrets:set PORTAL_FROM_EMAIL` → p. ej. `KatzenVet <noreply@tudominio.com>`.
3. Redeploy de las tres functions de arriba.
4. Probar envío a un correo de cliente real.

### Self-registro landing

`registerPortalOwner` **exige** Resend configurado (si falta key o falla el envío → rollback, no deja cuenta huérfana). En modo prueba solo sirve si el dueño se registra con el email de la cuenta Resend.

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
