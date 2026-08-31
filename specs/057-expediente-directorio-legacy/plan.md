# Plan técnico: Expediente y directorio unificados (legacy)

**Spec:** `specs/057-expediente-directorio-legacy/spec.md`  
**Estado:** approved  

---

## Resumen

Unificar la fuente de mascotas (`Katzen/Mascota`, `activo !== false`) en Buscar y Directorio; cargar clientes completos; hidratar shape móvil sin pisar la key RTDB; buscar con texto normalizado; consultar historial/vacunas/recordatorios/baños por `paciente_id` e `idPaciente`; abrir el mismo expediente desde el Directorio vía `/admin/paciente?id=`.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/core/utils/rtdb-row.util.ts` | crear | `id` = key; `idLegacy`; pick campos |
| `src/app/core/utils/text-search.util.ts` | crear | NFD / espacios |
| `src/app/core/utils/cliente-search.util.ts` | modificar | Nombre, razón, acentos |
| `src/app/core/utils/paciente-search.util.ts` | modificar | búsqueda expediente |
| `src/app/pacientes/pacientes.service.ts` | modificar | hidratar; id = key |
| `src/app/clientes/clientes.service.ts` | modificar | hidratar; id = key |
| `src/app/core/services/rtdb-paged-list.service.ts` | modificar | id = key |
| `src/app/historiales/historiales.service.ts` | modificar | dual query |
| `src/app/vacunas/vacunas.service.ts` | modificar | dual query |
| `src/app/recordatorios/recordatorios.service.ts` | modificar | dual query |
| `src/app/pacientes/banios-paciente.service.ts` | modificar | dual query |
| `src/app/pacientes/pacientes.component.ts` | modificar | `?id=`; búsqueda unificada |
| `src/app/pacientes-admin/pacientes-admin.component.ts` | modificar | `getPacientes()`; navegar expediente |
| `src/app/clientes/clientes.component.ts` | modificar | `getClientes()`; `filtrarClientes` |
| `src/app/core/testing/mock-data.ts` | modificar | Luis/Oreon legacy |
| specs unitarias utils + historiales | crear/ajustar | mocks, no prod |

### Firebase

| Archivo | Acción |
|---------|--------|
| `database.rules.json` | `.indexOn` aditivo `idPaciente` en Historiales_Clinicos y Recordatorios |

### Cypress

Sin ruta nueva. Smoke existente de `/admin/paciente` y `/admin/pacientes-admin`.

---

## Modelo de datos

```text
Katzen/Mascota/{pushKey}
  nombre | Nombre
  idCliente | cliente_id
  activo?                 # ausencia = visible
  id?                     # si ≠ key, se guarda como idLegacy en UI

Katzen/Cliente/{pushKey}
  nombre | Nombre | razonSocial | apellidos…

Katzen/Historiales_Clinicos/{id}
  paciente_id | idPaciente
```

---

## Flujos

### Flujo principal

1. Staff abre Directorio → ve todas las mascotas activas (mismo filtro que Buscar).
2. Clic “Ver expediente” → `/admin/paciente?id={key}`.
3. Expediente carga historial/vacunas/recordatorios/baños con key + aliases.
4. Staff busca “Luis Alfonso Niño Martínez” / “nino” / “Oreon” y encuentra el registro.

### Errores esperados

| Caso | Código / mensaje usuario |
|------|--------------------------|
| `id` de query no existe | Swal: no se encontró el paciente |
| Fallo de sección clínica | toast existente `ErrorMessagesService` |

---

## Servicios

- `PacientesService.getPacientes()` — fuente única Directorio + Buscar
- `ClientesService.getClientes()` — fuente única listado clientes
- `HistorialesService.getHistorialesPorPaciente(id, extraIds?)`

---

## UI (admin)

- Directorio: acción expediente (`mat-icon-button` + tooltip) además de editar/borrar
- Buscar: ficha existente; deep-link `?id=`
- Clientes: quitar “cargar más del servidor” (ya no aplica)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Lectura aditiva. Sin delete ni rename de nodos. Índice `idPaciente` opcional.

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Katzen/Mascota` | leer | no | hidratar en Angular |
  | `Katzen/Cliente` | leer | no | hidratar en Angular |
  | `Historiales_Clinicos.idPaciente` | leer + indexOn | no | aditivo |
  | `Recordatorios.idPaciente` | leer + indexOn | no | aditivo |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura (no hay campos RTDB nuevos de escritura)

- **Estrategia de Datos de Prueba:** `mock-data.ts` + unit tests. Emuladores si se prueba integración. Prohibido RTDB producción.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Página CRUD | `src/app/clientes/` |
  | Expediente | `src/app/pacientes/pacientes.component` |
  | Diálogo alta/edición | `paciente-admin-dialog`, `ADMIN_DIALOG_*` |
  | Alertas | `ErrorMessagesService`, SweetAlert2 |
  | Loading | `LoadingService` |
  | Tabla acciones | `.row-actions` + `mat-icon-button` + `matTooltip` |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado
  - [x] Chips/badges de estado visibles enteros (no truncados)

---

## Plan de Mitigación y Rollback

- [x] Verificado que no hay cambios destructivos en contratos de datos.
- [x] Compilación local exitosa (`npm run build`).
- [x] Plan de reversión documentado en caso de fallos inesperados.

| Escenario | Acción de rollback |
|-----------|-------------------|
| UI rompe build | Revertir archivos de la feature |
| Listado lento | Restaurar `getPacientesPage` / `getClientesPage` (código permanece en servicios) |
| Rules índice | No desplegar; query igual funciona en staff |

---

## Deploy

```bash
npm run build
# firebase deploy --only database   # SOLO con autorización de Luis (índices)
# hosting: no, salvo que Luis lo pida
```

---

## Riesgos

- Volumen RTDB alto en un futuro: volver a paginar **con búsqueda server-side**, no con “últimas 100 keys”.
