# Tasks: Peluquería — flujo fácil + precios claros

**Spec:** `specs/085-peluqueria-flujo-facil/spec.md`  
**Nivel de cambio:** L2 (por fase)  

---

## Implementación

### Setup

- [x] Carpeta spec creada y alcance documentado (plan por fases A–D)
- [ ] Anti-duplicación: no segundo módulo peluquería; se mejora `/admin/banios` + defaults 022

### Fase A — Captura rápida

- [x] A.1 Modo Rápido / Completo en `banio-dialog`
- [x] A.2 Vista rápida: dueño/mascota, tipo (chips), tamaño, precio, nota, alergias alerta
- [x] A.3 Prefill fecha/hora ahora; estado programado / iniciar ya; duración 60; peluquero prefill staff
- [x] A.4 Defaults 022 al elegir tamaño (background)
- [x] A.5 «Más detalles» colapsado: costo/margen/pago/hora/peluquero/extras
- [x] A.6 Copy cobro en Ticket del día
- [x] Util + tests `banio-captura-rapida.util`
- [x] Build + unit tests Fase A

### Fase B — Hoy en peluquería + cola limpia (anti-basura)

- [ ] B.1 Filtro Hoy default en `/admin/banios`
- [ ] B.2 Acciones Iniciar / Terminé (= listo para cobrar)
- [x] B.3 CTA ticket + **Listo para cobrar** (`completado` → entra a cola)
- [x] B.3b Por-cobrar solo listos del día; al cobrar desaparecen (`banio-cola-mostrador.util`)
- [ ] B.3c En Peluquería: vista/filtro «Pendientes de cobro» (cualquier fecha)
- [ ] B.4 KPIs del día arriba; mensuales secundarios
- [ ] B.5 Mobile hit targets
- [x] Nota visible en cola
- [x] Build + tests cola

### Nota para mostrador (entrega 2026-10-01)

- [x] Label «Nota para mostrador» en diálogo baño (`observaciones`)
- [x] Badge + Ver nota en POS pendientes y en Cobrar «Por cobrar hoy»
- [x] Aviso al incluir baño con nota (ofrecer medicamento)
- [x] Spec 085 modelo + ciclo de vida anti-basura + domain-context

### Fase C — Precios claros

- [ ] C.1 Entrada obvia a tarifas por tamaño (022)
- [ ] C.2 Chips P/M/G → precio
- [ ] C.3 Hint precio ajustado manual
- [ ] C.4 Costo solo en más detalles
- [ ] C.5 (Opcional) tamaño recordado — solo si Luis lo pide
- [ ] Build + smoke tarifas

### Fase D — Pulido

- [ ] D.1 Última observación + alergias
- [ ] D.2 Chips de nota rápida
- [ ] D.3 Loading / errores humanos
- [ ] D.4 QA L2 registrado; INDEX/estado `done` si aplica

---

## Código tocado / utils reutilizados / no duplicar

| Qué | Ruta / nota |
|-----|-------------|
| Diálogo | `src/app/banios/banio-dialog.component.*` |
| Listado | `src/app/banios/banios.component.*` |
| Defaults | `finanzas/defaults-banio.service` (022) — reutilizar |
| Ticket | flujo existente «Agregar al ticket» — no segundo cobro |
| Cola mostrador | `visitas/banio-cola-mostrador.util.ts` (+ spec) — no duplicar filtros en componentes |
| Captura rápida | `banios/banio-captura-rapida.util.ts` (+ spec) |
| No duplicar | No crear `/admin/peluqueria` paralelo |

---

## Validación (agente revisó — L2)

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| Unit tests captura rápida | **3/3 OK** | `banio-captura-rapida.util.spec` |
| Unit tests cola + por-cobrar + pendientes | **19/19 OK** (antes) | + captura rápida = 12 en corrida conjunta util |
| `npm run build` (exit 0) | **0** | 2026-10-01 Fase A |
| Reglas cola (revisión código) | OK | programado≠cola; completado+precio=entra; visitaId/pagado/caja/otra fecha=sale |
| Smoke UI :4200 1280 | **OK** (cola) + serve vivo Fase A | Banios diálogo: toggle Rápido/Completo |
| RTDB aditiva | N/A | usa campos existentes |
| Cypress | N/A | sin ruta nueva |

```
QA agente 2026-10-01:
- Fase A captura rápida: modo Rápido default, chips tipo/tamaño, más detalles colapsado, prefill ahora
- Cola limpia B.3b + Listo para cobrar
- Tests captura 3/3 · cola utils OK · build exit 0 · ng serve :4200
- Fases C/D y B.1/B.3c pendientes
- commit/push/deploy: solo con autorización de Luis
```

---

## Memoria actualizada

- [x] `PLAN-UX-VETERINARIAS.md` enlace a 085
- [x] `module-map.md` nota banios + 085
- [x] `agent-guardrails.md` fila anti-dup 085
- [x] `node scripts/specs-index.mjs`
