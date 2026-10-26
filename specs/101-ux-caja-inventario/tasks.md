# Tareas 101

- [x] Tarjeta de corte en Cobrar
- [x] Finanzas: por servicio solo caja + nota por cobrar; registrar gasto; textos simples
- [x] Movimientos: nombres, motivos en español, menos columnas; 3 columnas en celular
- [x] Inventario: sin stock bajo repetido, categorías, plurales
- [x] QA en vista previa con datos reales (2026-10-26)

## QA (datos reales, solo lectura; formularios abiertos y cerrados sin guardar)

- Finanzas · Mes octubre: «Por servicio» $7,413.60 = «Entró»; nota: $1,000 en 4 servicios sin cobrar, $250 en 3 baños pagados fuera de caja.
- «Registrar gasto» abre como Egreso con título «Registrar gasto»; cancelado.
- Cobrar a 412 px: tarjeta «Corte de caja · Sin cobros hoy».
- Movimientos: 337 registros; 6 de Luis (no está en Usuarios) → «Tú»; 331 sin responsable → «Sistema»; carga de Eleventa → «Carga inicial desde Eleventa · Quedó en N». A 412 px la tabla cabe (342 px).
- Inicio Inventario a 412 px: aviso único (122 se están acabando), categorías con mayúscula, «(0 unidades)».
- Hallazgo con datos reales: el staff se guarda bajo push-id con `authUid` → `mapaNombresStaff` indexa llave, `authUid` e `id`.
