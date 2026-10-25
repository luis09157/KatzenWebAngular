# Tasks: Cascada baja cliente

**Spec:** `specs/009-cascada-baja-cliente/spec.md`  

---

## Implementación

- [x] `bajaLogicaClienteCascada` en servicio
- [x] UI Clientes usa cascada + `deactivatePortalClient`
- [x] Mensaje confirmación actualizado
- [x] Loading `Eliminando…`

---

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA aplicable (confirmación Swal, loading hide en finally) — revisado en código + E2E
- [x] `npm run build` — exit 0 (2026-08-26)
- [x] `npm run functions:build` — exit 0 (portal revoke vía callable existente)
- [x] Live preview :4200 vivo
- [x] Cypress `cy:admin` — 23/23 OK (incluye CRUD cliente efímero crear→editar→borrar)
- [x] Cypress smoke 009: Swal confirma copy cascada (mascotas/citas/portal) **sin confirmar** en cliente real
- [x] Cypress `admin-crud-clientes`: assert copy cascada + éxito «borrado/cascada» en cliente **E2E efímero**
- [ ] Unit test dedicado de `bajaLogicaClienteCascada` (conteos mascotas/citas) — **no existe**
- [ ] Verificación RTDB post-cascada (mascotas `activo:false`, citas canceladas) — **no hecha** (solo UI/mensaje éxito E2E)

### Tabla de resultados

| Ítem | Resultado |
|------|-----------|
| Build Angular | OK exit 0 2026-08-26 |
| Functions build | OK exit 0 |
| Smoke UI copy Borrar / cascada | OK Cypress (`admin-features-008-010-smoke` + `admin-crud-clientes`) |
| Cascada mascotas/citas en datos | Lógica en servicio; E2E solo valida UI/éxito en cliente de prueba — **no assert RTDB profundo** |
| Portal revoke best-effort | Cableado; E2E no aísla fallo Auth |
| Unit | Sin spec de cascada |

### Seguimiento 2026-10-24 — aviso con el nombre de la mascota

Al borrar, el aviso lista las mascotas activas de ese cliente (o dice que no tiene). Confirmar sigue siendo baja lógica: `activo: false` en el cliente, sus mascotas y lo ligado (citas, baños, historial, vacunas, recordatorios, consentimientos, pensión, visitas). No hay `remove()`.

QA localhost: cliente de prueba «QA Baja Borrar» (tel. 8100000099) + mascota «QA Mascota Borrar» (expediente QA-BAJA, no consumió 260116). El aviso dijo «Tiene 1 mascota: QA Mascota Borrar». Tras confirmar, el listado ya no los muestra. En RTDB siguen: cliente `c86bdacc-eadb-47ff-bcf9-05b84667cdc4` y mascota `-P4kpmty00eaFUI11Uu7`, ambos `activo: false`, `fechaBaja` 24/10/2026 20:15:43. Citas y otros: 0. `ng serve` compiló (hash 4c4bb496b1a35740).

### Evidencia Cypress (2026-08-26)

```
npm run cy:admin → 23 passing (admin-smoke, routes, login, crud-clientes)
npx cypress run --spec cypress/e2e/admin-features-008-010-smoke.cy.ts → 3 passing
  (incluye «009: Borrar cliente muestra confirmación de cascada (sin confirmar)»)
```
