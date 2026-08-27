# Spec: Imagen y QR de producto + alta veterinaria

**ID:** 043-producto-imagen-qr  
**Estado:** done  
**Fecha:** 2026-08-26  
**Extiende:** catálogo `Katzen/Inventario/Productos`

---

## Problema

Registrar un producto obliga a inventar un código de barras a mano, no admite foto y el formulario no distingue croquetas (kg) de un frasco en ml o una vacuna refrigerada. En anaquel no hay etiqueta QR. Recepción tarda y el catálogo no se parece a una clínica.

---

## Cómo encaja (análisis)

### Lo que ya existe y se reutiliza

| Pieza | Estado hoy | Encaje 043 |
|-------|------------|------------|
| `Producto.imagen_url?` | Campo en modelo; el diálogo **no lo usa** | Foto opcional → Storage → URL |
| `codigo_barras` | Obligatorio, único | Autogenerar `KZ-…` o pegar EAN de fábrica |
| Foto cliente/paciente | `admin-dialog-photo` + Storage `Mascotas/` / `Clientes/` | Mismo patrón visual; path nuevo `Inventario/Productos/{id}/` |
| Categorías | medicamento, quirúrgico, alimento, peluquería, diagnóstico, accesorio | Se añade **vacuna** (aditivo) |
| Unidades | unidad, ml, gr, kg, litro, caja, paquete | Se añaden **tableta, cápsula, frasco, dosis** |
| IVA por categoría | medicamento/quirúrgico/diagnóstico → 0 % | Vacuna igual que medicamento |
| Autocomplete cliente+paciente | `app-cliente-paciente-picker` en citas, historiales, vacunas, baños, pensión, consentimientos, visitas | No se toca en 043 |
| Autocomplete producto | Duplicado local en entrada / salida / ajuste / órdenes | Fase B (044): picker compartido |
| `Katzen/Medicamentos` | Catálogo clínico (dosis, frecuencia) **distinto** del inventario | No mezclar: receta ≠ stock |

### Catálogo de una veterinaria (presets)

| Categoría | Unidad sugerida | Extra |
|-----------|-----------------|--------|
| Medicamento | tableta (o ml si jarabe) | Caducidad ~90 días; IVA 0 sugerido |
| Vacuna | dosis / frasco | Refrigeración ON; alerta 60 días |
| Alimento / croquetas | kg | Bolsa; IVA 16 % |
| Quirúrgico | unidad / pieza | Sutura, jeringa, gasas |
| Diagnóstico | unidad / caja | Tiras, reactivos |
| Peluquería | ml / frasco | Shampoo, etc. |
| Accesorio | unidad | Collar, transportadora |

### Fuera de esta entrega (siguiente spec)

- `app-producto-picker` unificado (mismas opciones que el picker cliente/paciente)
- Lector de cámara en el admin
- Unificar `Katzen/Medicamentos` con inventario (riesgo móvil / recetas)
- Deploy `firebase deploy --only storage` — **solo con OK de Luis**

---

## User stories

### US-1 — Foto opcional

Como **staff** quiero adjuntar una foto al producto si me sirve, para reconocerlo en el listado y en salidas.

**Criterios:**

- Foto opcional (preview, ≤ 5 MB, image/*, mismo patrón que mascotas)
- Sin foto el producto se guarda igual
- Miniatura en el listado

### US-2 — Código y QR automáticos

Como **staff** quiero un código interno y un QR imprimible, para identificar el producto sin pelearme con EAN.

**Criterios:**

- Al crear: generar `KZ-{CAT}-{aammdd}-{rand}` si el campo está vacío (botón Regenerar)
- Se puede pegar el código de barras de fábrica
- QR con el mismo valor que `codigo_barras`; imprimir etiqueta (nombre + código + QR)

### US-3 — Alta pensada en clínica

- Presets por categoría (unidad, refrigeración, presentación, alerta caducidad, IVA)
- Unidades tableta / cápsula / frasco / dosis
- Marca opcional (default `S/M`)

---

## Definition of Done

- [x] `npm run test:043` + `npm run build`
- [x] QA registrada en `tasks.md`
- [x] Live preview `:4200` vivo (smoke autenticado pendiente Auth prod)
