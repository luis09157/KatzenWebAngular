# Plan técnico: Alergias cruzadas de la mascota

**Spec:** `specs/034-alergias-cruzadas-mascota/spec.md`  
**Estado:** approved  

---

## Resumen

Campo aditivo `alergias: string[]` en `Katzen/Mascota` como fuente de verdad; util de normalización para legacy; componente `app-alergias-alerta` (aviso) + `app-alergias-editor` (chips) en SharedModule; integración en diálogos operativos y portal read-only. Baños sincronizan hacia Mascota al guardar.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/shared/alergias/alergias.util.ts` | crear | `normalizeAlergias()` |
| `src/app/shared/alergias/alergias-alerta.component.ts\|html\|scss` | crear | warning banner |
| `src/app/shared/alergias/alergias-editor.component.ts\|html\|scss` | crear | chips + agregar |
| `src/app/shared/shared.module.ts` | modificar | declare/export |
| `src/app/core/models.ts` | modificar | `alergias?` en Paciente |
| `src/app/core/testing/mock-data.ts` | modificar | MOCK_MASCOTA con alergias |
| `src/app/pacientes-admin/paciente-admin-dialog.*` | modificar | sección Alergias |
| `src/app/banios/banio-dialog.*` | modificar | alerta + sync Mascota |
| `src/app/historiales/historial-dialog.*` | modificar | alerta |
| `src/app/vacunas/vacuna-dialog.*` | modificar | alerta |
| `src/app/visitas/visita-dialog.*` | modificar | alerta |
| `src/app/inventario/movimientos/salida-dialog.*` | modificar | alerta si pacienteId |
| `src/app/portal/utils/portal-mapper.util.ts` | modificar | map alergias |
| `src/app/portal/mascota-detalle/*` | modificar | card alergias |
| `specs/memory/domain-context.md` | modificar | §3.2 + backlog |
| `specs/ROADMAP.md` | modificar | 034 |
| `specs/README.md` | modificar | índice |

### Firebase

| Archivo | Acción |
|---------|--------|
| `database.rules.json` | sin cambio (staff write / portal read ya OK) |

### Cypress

| Archivo | Acción |
|---------|--------|
| — | sin ruta admin nueva; smoke manual diálogos |

---

## Modelo de datos

```text
Katzen/Mascota/{id}
  ...campos legacy...
  alergias?: string[]          # canónico aditivo
  alergiasTexto?: string       # opcional legacy / texto libre (lectura normalizada)

Katzen/Banios/{id}
  alergias_conocidas?: string[]  # snapshot; al guardar se alinea con Mascota.alergias
```

**Normalización lectura:**  
`alergias` (array) → si vacío, partir `alergiasTexto` / string por comas → dedupe trim → `string[]`.

---

## Flujos

### Captura en paciente

1. Staff abre paciente → ve/edita chips alergias  
2. Guardar → `actualizarPaciente` / create incluye `alergias: string[]`

### Alerta operativa

1. Diálogo con paciente seleccionado → `getPaciente` / selection → `normalizeAlergias`  
2. Si length > 0 → `app-alergias-alerta` arriba del body  
3. Guardar del diálogo clínico **no** valida alergias (solo aviso)

### Baño sync

1. Selección paciente → carga alergias Mascota → alerta + prefill editor  
2. Submit → update Banio (`alergias_conocidas` = lista) + `actualizarPaciente(id, { alergias })`

### Portal

1. `mapMascota` expone `alergias`  
2. Detalle muestra card si hay alergias (read-only)

### Errores esperados

| Caso | Mensaje |
|------|---------|
| Fallo update Mascota desde baño | ErrorMessagesService «actualizar alergias» — baño igual se intenta guardar; log |

---

## Servicios

- `PacientesService.actualizarPaciente` — escribe `alergias`
- Sin Cloud Functions nuevas

---

## UI (admin)

- Editor: chips removibles + input «Agregar» en sección form-section
- Alerta: banner warn con icono `warning_amber` + lista chips (completo, sin clip)
- Portal: card en aside/profile del expediente

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:**

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Katzen/Mascota.alergias` | añadir opcional | no | array strings |
  | `Katzen/Mascota.alergiasTexto` | opcional lectura | no | no migrar masivo |
  | `Katzen/Banios.alergias_conocidas` | sin romper | no | snapshot sync |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros (`[]` / ocultar alerta)

- **Estrategia de Datos de Prueba:** `mock-data.ts` — MOCK_MASCOTA con alergias. Emuladores opcionales. Prohibido producción.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia |
  |--------|------------|
  | Diálogo | `admin-dialog-shell` |
  | Tags warn | estilo detail-tag / banner local SCSS |
  | Shared | `SharedModule` |
  | Loading | `LoadingService` en flujos existentes |
  | Portal | layout expediente `portal-mascota-detalle` |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado
  - [x] Chips visibles enteros

---

## Plan de Mitigación y Rollback

- [x] Verificado: sin cambios destructivos en contratos.
- [x] Compilación local (`npm run build`) — al cerrar.
- [x] Rollback documentado.

| Escenario | Acción de rollback |
|-----------|-------------------|
| UI rompe build | Revertir commit feature 034 |
| Datos raros en `alergias` | Lectura normaliza a `[]`; UI no colapsa |
| Sync baño falla parcial | Baño conserva snapshot; reintentar update Mascota |
| Reglas (si se hubieran tocado) | N/A esta entrega |

---

## Deploy

```bash
npm run build
# hosting (autorizado Luis en esta entrega):
firebase deploy --only hosting
# database: no requerido (sin cambio rules)
```

Sin Resend. Sin Functions.

---

## Riesgos

- Baños legacy con `alergias_conocidas` distintas de Mascota: al abrir se prioriza Mascota; al guardar se unifica hacia Mascota.
- Texto libre muy largo en chip: truncar visual con tooltip, sin clip de columna.
