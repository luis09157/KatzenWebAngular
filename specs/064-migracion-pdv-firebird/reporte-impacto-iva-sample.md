# Reporte de impacto IVA (muestra ilustrativa)

**No son precios SQL reales del FDB.** Sirve para que Luis vea *cómo* se verá el salto al cliente cuando eleventa no trae IVA y la web sí (16 %).

Fórmula: `precio_web = round(precio_eleventa × 1.16, 2)`.

| Código (tipo) | Qué pagaban (eleventa, sin IVA) | Precio web con IVA | Delta |
|---------------|----------------------------------|--------------------|-------|
| ejemplo | 100.00 | **116.00** | +16.00 (+16 %) |
| Carda / EAN sample | 89.00 | 103.24 | +14.24 |
| Nupec 2 kg sample | 249.00 | 288.84 | +39.84 |
| BACO014 baño sample | 150.00 | 174.00 | +24.00 |
| KTZ073 medicamento sample | 120.00 | 139.20 | +19.20 |
| EXAM002 sample | 250.00 | 290.00 | +40.00 |
| Paq Perro Mini sample | 450.00 | 522.00 | +72.00 |
| Domicilio sample | 80.00 | 92.80 | +12.80 |
| Precio 0 | 0.00 | 0.00 | 0 |
| Sin precio (null) | — | no se inventa | — |

Vacunas/medicamentos/exámenes: el dry-run **avisa** porque en Katzen a veces van tasa 0. La regla por defecto de Luis sigue siendo ×1.16 hasta marcar excepciones en el reporte del extract real.

Cuando haya `pdv-extract.json` (fase 1 SQL), regenerar este archivo con `reporteImpactoIvaCliente` sobre el catálogo completo (salida gitignored si trae todo el anaquel).
