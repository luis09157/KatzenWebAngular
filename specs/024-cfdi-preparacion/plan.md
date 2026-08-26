# Plan técnico: CFDI preparación

**Spec:** `specs/024-cfdi-preparacion/spec.md`  
**Estado:** done  

---

## Resumen

Campos fiscales aditivos en Cliente + UI mínima. Sin PAC.

---

## Contratos de Datos y UI (Obligatorio)

| Campo Cliente | Tipo | Notas |
|---------------|------|-------|
| `requiereFactura` | boolean | flag operativo |
| `rfc` | string | pattern proveedores |
| `razonSocial` | string | opcional |
| `usoCfdi` | string | catálogo corto |
| `regimenFiscal` | string | catálogo corto |
| `codigoPostalFiscal` | string | 5 dígitos |

Nodo futuro (no código):

```text
Katzen/Facturas/{id}
  clienteId, cajaMovimientoId?, uuid?, estatus, created_at
```

---

## Plan de Mitigación y Rollback

| Escenario | Rollback |
|-----------|----------|
| UI confunde | ocultar sección / revert dialog |
| Campos basura | opcionales; ignorar en lecturas |

**Prohibido:** conectar PAC sin autorización explícita de Luis Alfonso Niño Martínez.
