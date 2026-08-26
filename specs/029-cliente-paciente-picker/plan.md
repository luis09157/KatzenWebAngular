# Plan técnico: Cliente-Paciente Picker

**Spec:** `specs/029-cliente-paciente-picker/spec.md`  
**Estado:** approved  

---

## Resumen

Extraer el patrón cliente→paciente ya usado en citas y baños a un componente compartido `app-cliente-paciente-picker`, con utilidades de búsqueda centralizadas. Migrar primero el modal de pensión (texto libre reportado). Documentar regla global en ADMIN-UI y domain-context.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/shared/admin/cliente-paciente-picker.component.*` | crear | ControlValueAccessor vía FormGroup padre |
| `src/app/shared/admin/cliente-paciente-picker.models.ts` | crear | Tipos selection |
| `src/app/core/utils/cliente-search.util.ts` | crear | Filtro clientes |
| `src/app/core/utils/paciente-search.util.ts` | crear | Filtro pacientes activos |
| `src/app/shared/shared.module.ts` | modificar | Declarar + exportar + MatAutocomplete |
| `src/app/pension/pension-dialog.component.*` | modificar | Usar picker |
| `src/app/core/testing/mock-data.ts` | modificar | Mocks picker |
| `docs/ADMIN-UI-ARCHITECTURE.md` | modificar | § regla global |
| `specs/memory/domain-context.md` | modificar | Regla enlace cliente-paciente |

---

## Modelo de datos

Sin cambios RTDB. Formularios persisten:

```text
cliente_id: string   # key Katzen/Cliente
paciente_id: string # key Katzen/Mascota
cliente?: string     # nombre display (denormalizado)
paciente?: string    # nombre display (denormalizado)
```

---

## Flujos

### Flujo principal (picker embebido)

1. Usuario escribe en autocomplete cliente → filtra catálogo
2. Selecciona cliente → patch `cliente_id`, limpia paciente
3. Carga mascotas activas del cliente en select
4. Selecciona paciente → patch `paciente_id`, emite `selectionChange`
5. Padre puede autorrellenar (ej. `tamano_mascota` en pensión)

### Errores esperados

| Caso | Mensaje usuario |
|------|-----------------|
| Cliente sin mascotas activas | hint en picker |
| Guardar sin selección | `mat-error` + validación required en IDs |

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Solo lectura Cliente/Mascota. Escrituras sin cambio de schema.

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `cliente_id`, `paciente_id` en módulos | escritura igual | no | Deben ser keys reales, no `manual` |

- **Estrategia de Datos de Prueba:** `MOCK_CLIENTE`, `MOCK_MASCOTA`, `MOCK_CLIENTE_LUIS` en mock-data.ts

- **Patrones UI Reutilizados:**

  | Patrón | Referencia |
  |--------|------------|
  | Picker embebido | `app-cliente-paciente-picker` |
  | Diálogo previo baños | `seleccionar-cliente-banio-dialog` (convive) |
  | Citas inline | `cita-dialog` (migración futura al picker) |

---

## Plan de Mitigación y Rollback

- [x] Sin cambios destructivos RTDB
- [ ] Compilación `npm run build` OK
- [ ] Rollback: revertir commit; pensión vuelve a texto libre (no deseable)

| Escenario | Acción |
|-----------|--------|
| Build roto | Revertir archivos picker + pension-dialog |
| Regresión UX pensión | Hotfix picker o restaurar inputs temporales |

---

## Deploy

```bash
npm run build
firebase deploy --only hosting   # autorizado por Luis
```
