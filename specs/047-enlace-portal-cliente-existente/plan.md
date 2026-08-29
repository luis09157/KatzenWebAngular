# Plan: 047 Enlace portal ↔ cliente clínico

## Contratos de Datos y UI (Obligatorio)

Ver `spec.md`. Resumen:

- **Ola 1:** UI en `cliente-dialog` + opcional chip listado; callables existentes `provisionPortalClient` / `resendPortalClientAccess`.
- **Ola 2:** Cambiar `registerPortalOwner` en `functions` para vincular por correo antes de crear Cliente.
- **Ola 3:** Match por teléfono MX normalizado (10 dígitos / +52) + mascota opcional para desambiguar. **Nunca auto-vínculo por teléfono.** Correo sigue siendo el único umbral de auto-vínculo (ola 2).
- Campos aditivos opcionales: `portalLinkedFrom`, `telefonoNorm`, timestamps ya existentes.

### Matching ola 3 (servidor, `registerPortalOwner`)

1. Si hay match **correo** linkable → auto-vínculo (ola 2, umbral alto). No se evalúa teléfono.
2. Si el dueño envía `skipPhoneMatch` → alta Cliente nueva (rechazo de confirmación, SC-011).
3. Si envía `confirmClienteId` → revalidar que ese id sigue linkable **y** que el teléfono normalizado coincide. Entonces sí provisionar Auth.
4. Si hay teléfono normalizable: escanear `Katzen/Cliente` (Admin SDK; formatos legacy en ficha). Candidatos = activos, sin portal usable, mismo `telefono`/`telefonoNorm` a 10 dígitos.
5. 0 candidatos → alta nueva. 1 candidato → **return** `{ needsConfirmation, suggestedClienteId, petNames, maskedPhone }` (sin crear Auth). N candidatos sin mascota → `{ needsPetName }` (no listar padrón). N + mascota única → confirmación de esa ficha. N + mascota aún ambigua → error “contacta a la clínica”.
6. Si el dueño escribió mascota y la ficha única tiene mascotas que **no** coinciden → no sugerir (alta nueva). Evita unir ficha ajena con teléfono reciclado.
7. RTDB aditivo: al vincular/crear se puede stamp `telefonoNorm` (10 dígitos). No se renombran nodos. App móvil ignora el campo.

### UI landing

- Campo opcional «Nombre de tu mascota». Hint: el teléfono de la ficha; confirmación antes de unir.
- Swal confirmación: «Sí, soy yo» / «No, crear ficha nueva» / Cancelar.
- Copy de éxito distinto si `matchKind === 'phone'`.

### Plan de Mitigación y Rollback

| Riesgo | Mitigación | Rollback |
|--------|------------|----------|
| Staff sin permiso callable | Mensaje + “pide a admin / Usuarios” | Solo UI |
| Vínculo correo incorrecto (typo en ficha) | Solo match exacto correo ola 2 | Desactivar portal + corregir correo (proceso manual) |
| Unir dueños por teléfono (número compartido / reciclado) | Nunca auto-vínculo; confirmación + mascota; revalidar teléfono en confirm | `skipPhoneMatch` crea ficha nueva; staff desactiva portal si hace falta |
| Enumeración de fichas | Rate-limit existente; no devolver padrón; mascotas solo tras match único; teléfono enmascarado | Revert callable |
| Resend falla | Aviso `emailSent: false` (ya existe); self-reg exige correo | Reenviar desde ficha |

## Archivos previstos

### Ola 1
- `src/app/clientes/cliente-dialog.component.{html,ts,scss}`
- `src/app/clientes/clientes.component.html` (chip opcional)
- `specs/047-*/tasks.md`

### Ola 2
- `functions/src/index.ts` (`registerPortalOwner`)
- Copy landing `landing.component` si hay mensaje de éxito
- Tests functions si existen

### Ola 3
- `functions/src/portal-phone-match.util.ts` + `functions/test/portal-phone-match.util.test.js`
- `functions/src/index.ts` (`registerPortalOwner`)
- Landing registro: campo mascota + Swal confirmación
- `src/app/core/services/firebase-functions.service.ts` tipos

## Dependencias

- 002 / 013 / 038 (Resend desplegado).
- No bloquea 046 UX.

## Orden de entrega

1. Spec + plan + tasks (este paquete)
2. Ola 1 UI + QA
3. Ola 2 callable + QA + deploy functions **con OK Luis**
4. Ola 3 teléfono + confirmación + QA; deploy `registerPortalOwner` **con OK Luis** (no en esta entrega de código)
