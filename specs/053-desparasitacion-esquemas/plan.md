# Plan técnico: Desparasitación (espejo 052, ligado a recordatorios)

**Spec:** `specs/053-desparasitacion-esquemas/spec.md`  
**Estado:** approved  

---

## Resumen

Motor puro + diálogo de confirmación reutilizando el patrón 052. Persistencia **solo** en `Katzen/Recordatorios` (campos opcionales). Sin Functions, sin reglas nuevas, sin nodo clínico nuevo.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/recordatorios/esquema-desparasitacion.models.ts` | crear | tipos / sugerencia |
| `src/app/recordatorios/esquema-desparasitacion.defaults.ts` | crear | intervalos + hints |
| `src/app/recordatorios/esquema-desparasitacion.util.ts` | crear | `sugerirEsquemaDesparasitacion` |
| `src/app/recordatorios/esquema-desparasitacion.util.spec.ts` | crear | unit tests |
| `src/app/recordatorios/desparasitacion-esquema-confirm-dialog.component.*` | crear | espejo vacuna |
| `src/app/recordatorios/recordatorio-dialog.component.ts/html` | modificar | tipo + confirm al guardar |
| `src/app/recordatorios/recordatorios.service.ts` | modificar | `asegurarProximaDesparasitacion` |
| `src/app/recordatorios/recordatorios.module.ts` | modificar | declarar diálogo |
| `src/app/recordatorios/recordatorios.component.ts/html` | modificar | CTA registrar |
| `src/app/pacientes/pacientes.component.ts/html` | modificar | CTA expediente |
| `package.json` | modificar | `test:053` |

### Firebase

Ninguno (reglas Recordatorios ya cubren writes staff).

---

## Modelo de datos

```text
Katzen/Recordatorios/{id}
  tipo: 'desparasitacion'          # ya existía
  tipoDesparasitacion?: 'interna'|'externa'|'ambas'
  origen?: 'desparasitacion_auto'  # siguiente dosis
  skipPushOnCreate?: true
  esquemaCodigo?: string
  intervaloConfirmadoDias?: number
  esquemaConfirmado?: boolean
  # resto legacy intacto
```

---

## Flujos

### Registrar aplicación (ola 1)

1. CTA o diálogo con `tipo = desparasitacion`.
2. Staff elige interna/externa/ambas + fecha de aplicación.
3. Al guardar (alta): se abre confirmación de esquema.
4. Cancelar diálogo → no escribe.
5. «No agendar» → solo el recordatorio del formulario (aplicación).
6. «Confirmar» → guarda aplicación + crea pendiente siguiente (`origen: desparasitacion_auto`, `skipPushOnCreate: true`).
7. Fallecido → equivalente a no agendar.

### Errores esperados

| Caso | Mensaje |
|------|---------|
| Formulario incompleto | Campos requeridos (existente) |
| Duplicado título+fecha+tipo | «Ya existe un recordatorio similar…» |
| Confirmación cancelada | No se guarda |

---

## Servicios

- `RecordatoriosService.crearRecordatorio` — aplicación
- `RecordatoriosService.asegurarProximaDesparasitacion` — siguiente dosis (dedupe paciente+día+tipo)

Reutiliza `normalizarEspecie`, `parseEdadASemanas`, `esPacienteFallecido`, `addDaysLocal`, `horaDefaultRecordatorio` de `esquema-vacuna.util.ts` (misma clínica, cero duplicar parser de edad).

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** aditivo.

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Katzen/Recordatorios` campos opcionales | añadir | no — ignora desconocidos | no rename `tipo` |
  | Ningún nodo borrado | — | no | |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura

- **Estrategia de Datos de Prueba:** unit tests del motor; UI localhost. Prohibido `katzen-a0e3e`.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia |
  |--------|------------|
  | Confirmación esquema | `vacuna-esquema-confirm-dialog` |
  | Diálogo CRUD | `recordatorio-dialog` + `admin-dialog-shell` |
  | Timepicker | `app-timepicker-field` |
  | Loading | `LoadingService` + hide en finally |
  | Errores | SweetAlert2 + mensaje duplicado existente |

  - [x] Sin librerías UI externas
  - [x] Chips/badges completos

---

## Plan de Mitigación y Rollback

- [x] Sin cambios destructivos de contratos.
- [x] `npm run build` OK.
- [x] Rollback: revertir archivos bajo `src/app/recordatorios/` + CTA expediente. Recordatorios legacy sin campos nuevos siguen leyéndose.

| Escenario | Acción de rollback |
|-----------|-------------------|
| Diálogo bloquea altas normales | Confirmar solo si `tipo === 'desparasitacion'` y alta |
| Push spam a 90 días | `skipPushOnCreate: true` en auto; 023 ya respeta el flag en vacunas — verificar mismo campo |
| UI rompe build | Revertir 053; 054 independiente |

---

## Deploy

No aplica en esta entrega.

---

## Riesgos

- Completar un recordatorio pendiente de desparasitación **sin** CTA “registrar” no abre esquema (ola 2: al marcar completado). Ola 1 cubre alta + CTA.
- Intervalos CAPC/ESCCAP son referencia, no etiqueta del producto.
