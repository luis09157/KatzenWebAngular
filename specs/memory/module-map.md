# Mapa de módulos — KatzenVet Web

Base documental de modularidad (specs **075** / **076** / **077** / **079** / **080** / **081**; proceso specs vivas **078**).  
**Última revisión:** 2026-10-01 · No es código; describe límites y dependencias.

---

## 1. Superficies (límites duros)

| Superficie | Ruta | Carpeta principal | Quién | Escribe RTDB |
|------------|------|-------------------|-------|--------------|
| **Landing** | `/`, `/privacidad` | `src/app/landing/` | Público | Solo `Katzen/ContactosWeb` (create) |
| **Admin** | `/admin/*` | módulos lazy bajo `src/app/{modulo}/` + `layouts/` | Staff | Operativo (rules `role != client`) |
| **Portal** | `/portal/*` | `src/app/portal/` | Dueños | Casi solo lectura; notificaciones `leida` |
| **Auth** | `/admin/login`, `/auth/*` | `src/app/auth/` | Staff / dual | Claims vía Functions |
| **Core** | — | `src/app/core/` | Todos (import) | Servicios transversales |
| **Shared** | — | `src/app/shared/` | Admin (+ algo portal) | UI/modelos compartidos |

**Regla:** Portal **no** importa diálogos admin ni servicios de escritura clínica. Admin **no** embebe shells de portal. Utilidades puras → `core/utils/` o util del módulo.

---

## 2. Capas transversales

### Core (`src/app/core/`)

| Área | Contenido | Notas |
|------|-----------|-------|
| `config/` | `staff-role.config.ts` | Matriz módulos / nav (**072**) |
| `services/` | Auth profile, session, FCM portal, Functions, sucursal | Un solo camino a callables |
| `utils/` | Búsqueda, hydrate, folios, precio/margen, claims, PDV dry-run… | Barrel: `core/utils/index.ts` |
| `models/` + `models.ts` | Tipos compartidos | RTDB aditivo |
| `testing/` | `mock-data.ts` | Obligatorio para demos agente |
| Loading / errores | `loading.service`, `error-messages.service` | Constitution §3 |

### Shared (`src/app/shared/`)

| Área | Contenido |
|------|-----------|
| `admin/` | KPI grid, banner, data-panel, pickers cliente/paciente/producto |
| `alergias/` | Editor + alerta (**034**) |
| `timepicker/` | `app-timepicker-field` (**004**) |
| Modelos | `inventario.models`, `banio.model`, catálogos |
| `validation.service` | Validaciones UI |

---

## 3. Módulos Admin (`src/app/*`)

| Carpeta | Ruta | RTDB principal | Specs clave | Responsabilidad |
|---------|------|----------------|-------------|-----------------|
| `dashboard/` | `/admin/inicio` | agregados varios | 025, 072 | Hoy / KPIs por rol |
| `clientes/` | `/admin/clientes` | `Cliente` | 001, 009, 047 | Dueños CRUD + portal flags |
| `pacientes/` | `/admin/paciente` | `Mascota`, logs | 057, 062, 068 | Expediente clínico (mascota) |
| `pacientes-admin/` | `/admin/pacientes-admin` | `Mascota`, `Cliente` | 057, 058, 069 | Directorio / ficha rápida |
| `citas/` | `/admin/citas` | `Citas` | 003, 035 | Agenda staff |
| `historiales/` | `/admin/historiales` | `Historiales_Clinicos`, notas internas | 010, 016 | Historial clínico |
| `vacunas/` | `/admin/vacunas` | `Vacunas` | 033, 052 | Biológicos + esquemas |
| `recordatorios/` | `/admin/recordatorios` | `Recordatorios` | 023, 053, 066 | Agenda dueño / desparasitación |
| `banios/` | `/admin/banios` | `Banios` | 018, 022, 034 | Peluquería |
| `pension/` | `/admin/pension` | `Pension/Estancias` | 022 | Hospedaje |
| `visitas/` | `/admin/visitas` | `Visitas`, `Caja/*` | 032–046, 055, 065, 071 | **POS / cuenta del día** |
| `inventario/` | `/admin/inventario` | `Inventario/*` | 007, 042–044, 064 | Stock, OC, alertas |
| `finanzas/` | `/admin/finanzas` | `Caja`, `Finanzas/*` | 014, 021, 022, 071 | Caja, costos, reportes |
| `servicios-clinica/` | `/admin/servicios-clinica` | `ServiciosClinica` | 056 | Tarifas sin stock |
| `consentimientos/` | `/admin/consentimientos` | consentimientos | 037 | Consentimientos |
| `usuarios/` | `/admin/usuarios` | `Usuarios`, `AuthPerfiles` | 002, 011, 012 | Staff + provision portal |
| `contactos-web/` | `/admin/contactos-web` | `ContactosWeb` | 001 | Leads landing |
| `configuracion/` | `/admin/configuracion` | `Config/clinica` | 072 | Config clínica |
| `alta-rapida/` | (diálogo) | Cliente + Mascota | 070 | Asistente «Llegó un paciente» |
| `ayuda/` | (diálogo) | — | 072 | Manual usuario |
| `layouts/` | shell admin | — | 061, 072 | Sidenav + content |

### Dominios lógicos (agrupar mentalmente)

```text
Landing ──► ContactosWeb
Admin
  ├── Clínico: pacientes, citas, historiales, vacunas, recordatorios, consentimientos
  ├── Ops agenda: baños, pensión
  ├── POS / Visitas: visitas (+ alta-rapida)
  ├── Inventario: inventario, servicios-clinica (tarifa)
  ├── Finanzas: finanzas (caja)
  └── Plataforma: usuarios, configuracion, contactos-web, dashboard
Portal ──► lectura filtrada por clienteId
Core / Shared ──► sin UI de negocio propia
```

---

## 4. Portal (`src/app/portal/`)

| Área | Rutas típicas | RTDB (lectura) | Specs |
|------|---------------|----------------|-------|
| Layout / login | `/portal/login`, shell | Auth + Cliente | 002, 013, 051, 074 |
| Mascotas / cartilla | `/portal/mascotas`, detalle | Mascota, Vacunas, Banios, Citas, Historial, … | 020, 028, 031, 074 |
| Notificaciones | `/portal/notificaciones` | `Notificaciones/{clienteId}` | 023, 052, 074 |
| Perfil | `/portal/perfil` | Cliente | 006, 074 |
| Utils | `portal/utils/*` | — | Mapper, cartilla, login errors; **no** duplicar `paciente-cliente` (ya importa core) |

**Pendiente producto:** solicitud de cita (`CitasSolicitud`) — solo en spec **074**, flag off.

---

## 5. Backend fuera de Angular

| Pieza | Ubicación | Notas |
|-------|-----------|-------|
| Rules | `database.rules.json` | L3 + OK Luis para deploy |
| Functions | `functions/src/` | Portal mail, provision, claims |
| FCM codebase | `functions-fcm/` | Push recordatorios / vacunas |
| PDV scripts | `scripts/pdv-eleventa/` | Spec **064** — no Excel clínico |

---

## 6. Acoplamiento conocido y extracción

| Ítem | Estado | Acción |
|------|--------|--------|
| `visita-dialog.component.ts` (~1.8k) | **Mejorado 082** | Utils 075–080 + sheets UI: `pos-sheet-panel` / `cantidad` / `scanner` (**081**) + `carrito` (**082**) |
| `pacientes.component.ts` (~1.3k → fecha/timeline fuera) | **Mejorado 079** (local) | `paciente-fecha` / `paciente-timeline` (**077**); tabs lazy `matTabContent` (**079**) |
| `portal-client-access` vs `paciente-cliente` | OK | Portal reutiliza core |
| Login/FCM copy en portal importado por Auth/Core | **Mitigado 076** (local) | `core/utils/login-error-copy` + `fcm-copy`; portal re-exporta |
| `core/utils` sin índice | Mitigado | Barrel `index.ts` (**075**/**076**) |
| Duplicar formatters moneda | **Parcial 076** | `formatMoneyMx` en visita-dialog, cliente-cuenta, caja-corte |

**Estado modularización Visitas/POS (075–082):** wizard + bloqueos + sheet-util + copy + orquestación + persistir + **sheets UI** (panel/cantidad/scanner/carrito) en `main`. Ticket WhatsApp en `pos-ticket-whatsapp.util`.

**Anti-duplicación:** tabla canónica en `agent-guardrails.md` (pos-wizard, pos-bloqueo, pos-sheet, pos-copy, pos-orquestacion, pos-persistir, pos-sheet-* components, folio-expediente, recordatorio-whatsapp, alta-rapida, login/fcm copy, etc.). No reimplementar.

---

## 7. Cómo usar este mapa (agentes)

1. Identificar superficie (Admin / Portal / Landing / Core).
2. No cruzar escritura clínica desde portal.
3. Preferir util en el módulo dueño o `core/utils` si es transversal — **consultar anti-duplicación** antes.
4. Spec nueva: enlazar carpetas afectadas aquí (una línea en `tasks.md` basta).
5. Al cerrar feature: actualizar este mapa si hubo extracto (spec **078**).
6. Modularización de código = **incremental**; sheets UI POS cerrados en **081**–**082**.
