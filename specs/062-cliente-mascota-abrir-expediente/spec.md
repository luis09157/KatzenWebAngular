# Spec: Abrir expediente desde mascota en ficha de cliente

**ID:** 062-cliente-mascota-abrir-expediente  
**Estado:** done  
**Fecha:** 2026-08-31  
**Autor:** Cursor (Grok) / Luis Alfonso Niño Martínez  

---

## Problema

En la ficha de cliente en **solo lectura** (p. ej. Liliana Lizzet Gomez Martinez) aparece la sección **Mascotas vinculadas** (Nina, FELINO · Shih Tzu, Vivo). El staff espera que **doble clic en la card de la mascota** lleve al **expediente completo** (`/admin/paciente?id=…`) con historial, vacunas, baños y actividad (`pacientes.component`).

Hoy las `.mascota-card` en `cliente-dialog.component.html` **no tienen** `(dblclick)` ni navegación. Spec 058 SC-006 abre el detalle del cliente; no cableó clic en mascotas.

---

## User stories

### US-1 — Doble clic en mascota → expediente completo

Como **staff**  
Quiero **doble clic, clic en el icono de carpeta, o Enter/Espacio en la card enfocada** en una mascota vinculada  
Para **abrir el expediente completo de esa mascota sin buscarla a mano**

**Criterios de aceptación:**

- [x] SC-001: Doble clic en `.mascota-card` cierra el diálogo del cliente y navega a `/admin/paciente?id={id}` (`pacientes.component`, no la ficha modal 058). El id se resuelve con `id || idPaciente || key` (trim).
- [x] SC-002: Enter y Espacio en la card enfocada hacen lo mismo que el doble clic.
- [x] SC-003: Cursor pointer, `user-select: none`, `matTooltip` en card, hint visible (icono o doble clic) y botón `folder_shared` con `matTooltip="Ver expediente"`.
- [x] SC-004: La card tiene `role="button"` y `tabindex="0"`.
- [x] SC-005: Si no hay id resoluble, no se navega; Swal breve «No se pudo abrir el expediente (falta id)» (no no-op silencioso).
- [x] SC-006: Un clic en el icono `folder_shared` abre el expediente (`stopPropagation`); `preventDefault` en dblclick de la card.

---

## Fuera de alcance

- Unificar Directorio + Buscar paciente
- Abrir la ficha modal 058 en lugar del expediente
- Campos RTDB nuevos o escrituras
- CRUD de mascotas desde la ficha de cliente
- Deploy / commit

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** **Solo lectura.** Se usa el `id` ya hidratado de `pacientesRelacionados` (mismo listado que hoy filtra `pacientePerteneceACliente`). Sin nodos ni campos nuevos. App móvil no afectada.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Mascota` | staff (ya cargado en el diálogo) | no | `id` existente para query param |
  | `Katzen/Cliente` | no (este flujo) | no | ficha ya abierta |

- **Estrategia de Datos de Prueba:** Sesión staff en localhost (`:4200`). Mocks locales si aplica. **Prohibido** RTDB producción (`katzen-a0e3e`) desde el agente salvo smoke localhost autorizado.

- **Patrones UI Reutilizados:** `admin-dialog-shell` / ficha cliente existente (spec 059 padding), `.mascota-card`, `matTooltip`, navegación igual que CTA «Abrir expediente completo» de 058 (`router.navigate(['/admin/paciente'], { queryParams: { id } })`). Grid de cards wrap (spec 061 si aplica). Sin librerías UI nuevas.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí (módulo clientes + paciente) |
| doctor | sí si tiene esos módulos |
| recepcionista | sí si el módulo está en su matriz |

---

## UI (rutas y layout)

- Origen: diálogo detalle cliente (`ClienteDialogComponent`, `modoVer`) en `/admin/clientes`
- Destino: `/admin/paciente?id={id}` — expediente completo (`pacientes.component`)
- No cambiar rutas ni guards

---

## Backend

- [ ] Cloud Function: no
- [ ] Reglas RTDB: no
- [ ] Email / integración externa: no

---

## Testing mínimo

Ver `tasks.md` sección Testing.

---

## Notas / decisiones

- Luis pidió **expediente completo**, no la ficha 058.
- Relación con 058: SC-006 abre la ficha del **cliente**; el salto mascota→expediente vive **aquí (062)**.
- Relación con 059: no romper padding del diálogo; hover sutil en la card.
- Relación con 061: wrap del grid de mascotas si el ancho útil es estrecho.
