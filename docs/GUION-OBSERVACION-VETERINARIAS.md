# Guion — sesión de observación con veterinarias (60 min)

**Para:** Luis (observador) · **Con:** 1 veterinaria + 1 recepcionista de la clínica · **Dónde:** en la clínica, con la computadora/tablet que usan a diario, sistema en producción o emulador con datos de prueba · **Cuándo:** antes de arrancar Fase 2 de `specs/PLAN-UX-VETERINARIAS.md`; repetir al terminar Fase 2.

---

## Objetivo

Ver **dónde se atoran** personas sin perfil técnico al operar KatzenVet en tareas reales, sin que nadie les explique. No es capacitación ni demo: es medir. El resultado son ítems concretos (con evidencia) para el plan UX.

**Lo que sí queremos saber:** cuántos clics/pantallas les toma cada tarea, en qué punto dudan o preguntan, qué palabras del sistema no entienden, qué hacen cuando se equivocan.
**Lo que no queremos:** opiniones generales («está bonito», «me gustaría un botón»). Eso se pregunta al final, 5 minutos, y se anota aparte.

---

## Quién y roles

| Persona | Rol en la sesión |
|---------|------------------|
| Veterinaria | Ejecuta tareas 1 y 2 (registro + atención, vacuna + cobro) |
| Recepcionista | Ejecuta tareas 3 y 4 (venta mostrador, corte de caja) |
| Luis | **Solo observa y anota.** Cronometra. No toca el teclado. |

Si solo hay una persona disponible, hace las 4 tareas; la sesión se alarga ~15 min.

---

## Reglas para Luis (leer antes de empezar)

1. **No ayudar.** Si preguntan «¿dónde está…?» responde: «¿Dónde crees tú que estaría? Hazlo como creas.» Solo intervienes si llevan **más de 3 minutos** completamente detenidos; entonces anotas «bloqueo total» y das la pista mínima.
2. **No explicar el sistema** ni justificar decisiones («eso está así porque…»). Guarda esas explicaciones para después.
3. **Pídeles pensar en voz alta**: «Dime lo que vas pensando mientras lo haces, aunque suene obvio.» Recuérdaselo cada vez que se queden callados más de 20 s.
4. **Anota textual** lo que dicen, sobre todo cuando dudan: «¿esto es lo mismo que…?», «¿aquí va el dueño o el perro?», «no sé qué es X».
5. **Cuenta clics y pantallas** (una rayita por clic; una marca por diálogo/pantalla nueva). No tiene que ser exacto, sí consistente.
6. **Anota el reloj** al iniciar y al cumplir el criterio de éxito de cada tarea.
7. **Sin cara de «uy».** Si algo falla o se rompe, anótalo y di «sigue como puedas». Si el error impide continuar, pasa a la siguiente tarea.
8. Al terminar cada tarea, una sola pregunta: **«¿Qué fue lo más confuso de esto?»** Anota la respuesta textual.
9. Deja para el cierre (5 min) las preguntas abiertas y agradece. No prometas cambios en el momento.

Material: este guion impreso, la plantilla de notas (abajo) impresa 4 veces, cronómetro (celular), opcional grabación de pantalla si aceptan (pedir permiso explícito; no grabar rostros).

---

## Preparación (10 min antes, sin las participantes)

- [ ] Sistema abierto en la pantalla de inicio del admin, sesión de un usuario **con rol doctor o recepcionista** (no admin), para ver el menú real que ven ellas.
- [ ] Caja **sin corte del día** y con al menos 2 cobros previos (para que la tarea 4 tenga sentido).
- [ ] Existe un cliente de prueba «Mariana López» con gato «Michi» (para tarea 2), sin vacuna anual registrada este año.
- [ ] Inventario con «Shampoo» y «Collar» con stock y precio (tarea 3).
- [ ] Si es producción: avisar que los registros de prueba se borrarán después (o usar emulador con seed: `npm run emulators:full`).
- [ ] Impresora de tickets encendida si la hay.

---

## Agenda (60 min)

| Min | Bloque |
|-----|--------|
| 0–5 | Encuadre: «Vamos a probar el sistema, no a ustedes. No hay respuestas incorrectas. Piensen en voz alta. No les voy a ayudar a propósito.» |
| 5–20 | **Tarea 1** — Primera vez con perro (veterinaria) |
| 20–32 | **Tarea 2** — Vacuna anual gato + cobro efectivo (veterinaria) |
| 32–42 | **Tarea 3** — Venta mostrador con tarjeta (recepcionista) |
| 42–52 | **Tarea 4** — Corte de caja (recepcionista) |
| 52–60 | Cierre: 3 preguntas abiertas + agradecimiento |

---

## Tareas

Lee la consigna **tal cual**, una vez. No agregues pistas de menú.

### Tarea 1 — «Llegó una señora con su perro por primera vez, viene a consulta; regístrala y atiéndela»

- **Datos que les das en papel:** Dueña: Laura Hernández, tel. 81 1234 5678. Perro: «Rocky», macho, mestizo, 3 años. Motivo: «vomitó dos veces anoche».
- **Criterio de éxito:** existe la cliente, existe la mascota ligada a ella y hay una consulta/historial de hoy con el motivo. (Vale cualquier camino: Clientes → Pacientes → Historial, o asistente si ya existe.)
- **Tiempo esperado hoy:** 6–9 min (≈ 3 menús, 3 diálogos, ~25 clics). **Meta post-Fase 2:** ≤ 3 min, ≤ 10 clics.
- **Dónde esperamos que se atoren:** orden cliente-antes-que-mascota; campos obligatorios del historial (9); «¿tengo que agendar cita antes?»; qué es «expediente».

### Tarea 2 — «Viene un cliente que ya existe a que le pongan la vacuna anual a su gato; cóbrale en efectivo con $500 y dale su ticket»

- **Datos:** Cliente Mariana López, gato Michi. Vacuna: triple felina (o la anual que use la clínica). Paga con un billete de $500.
- **Criterio de éxito:** vacuna registrada al gato (con próxima fecha aceptada o editada), cobro registrado en caja como efectivo, ticket generado (pantalla o impreso). Bonus: dicen cuánto cambio devolver sin calcularlo a mano.
- **Tiempo esperado hoy:** 5–8 min. **Meta:** ≤ 3 min.
- **Dónde esperamos que se atoren:** encontrar al cliente (¿por nombre o teléfono?); diálogo de confirmación de esquema (¿entienden «intervalo», «core», «NOM»?); pasar de la vacuna al cobro (¿saben que hay que ir a Cobrar/POS?); cambio en efectivo (no existe todavía → anotar si lo buscan).

### Tarea 3 — «Alguien de la calle compra un shampoo y un collar; cóbrale con tarjeta»

- **Datos:** no es cliente, no da nombre. Paga con tarjeta.
- **Criterio de éxito:** venta registrada con los 2 productos, método tarjeta, stock descontado, sin haber creado un cliente falso.
- **Tiempo esperado hoy:** 3–5 min. **Meta:** ≤ 1.5 min.
- **Dónde esperamos que se atoren:** el POS pide cliente primero (¿inventan uno?, ¿buscan «mostrador»?); dónde está la venta (¿Inventario → Salida? ¿Visitas?); si aparece catálogo demo en lugar del inventario real.

### Tarea 4 — «Termina el día: haz el corte de caja»

- **Datos:** efectivo contado en el cajón: dales una cifra en papel (p. ej. $3,250) que **no** cuadre exactamente con lo esperado, para ver qué hacen con la diferencia.
- **Criterio de éxito:** corte registrado con efectivo contado, ven el esperado vs. contado y la diferencia, y saben decir si «cuadró».
- **Tiempo esperado hoy:** 3–5 min. **Meta:** < 2 min con un solo campo obligatorio.
- **Dónde esperamos que se atoren:** encontrar Finanzas/Caja (¿lo ve un rol no-admin?); qué significan los campos del corte; qué hacer con la diferencia; ¿se puede hacer dos veces?

---

## Cierre (8 min)

Preguntas abiertas, anotar textual:

1. «Si tuvieras que enseñarle esto a alguien nuevo mañana, ¿qué parte le costaría más?»
2. «¿Hubo alguna palabra en pantalla que no supieras qué significaba?» (anotar la lista)
3. «De todo el día en la clínica, ¿qué tarea te gustaría que el sistema hiciera solo?»

No respondas con soluciones. «Gracias, lo anoto.»

---

## Plantilla de notas (una hoja por tarea)

```
TAREA: ___   Persona: ___________   Inicio: __:__   Fin: __:__   Total: ___ min
Clics: |||| |||| ...            Pantallas/diálogos abiertos: ___
¿Cumplió el criterio de éxito?  sí / parcial / no   ¿Bloqueo total (>3 min)?  sí / no

| # | Momento (min) | Dónde se atoró (pantalla / campo / botón) | Qué hizo / intentó | Cita textual | Severidad |
|---|---------------|--------------------------------------------|--------------------|--------------|-----------|
| 1 |               |                                            |                    | «…»          |           |
| 2 |               |                                            |                    | «…»          |           |
| 3 |               |                                            |                    | «…»          |           |

Palabras que no entendió: ______________________________________________
Errores del sistema (mensaje textual): __________________________________
Respuesta a «¿qué fue lo más confuso?»: «________________________________»
```

**Severidad:**

| Nivel | Significa |
|-------|-----------|
| **S1 bloqueante** | No pudo terminar sin ayuda, o terminó mal (dato en el lugar equivocado, cliente duplicado, venta sin stock) |
| **S2 fricción alta** | Terminó, pero > 1 min perdido, o rodeo por 2+ pantallas, o tuvo que preguntar |
| **S3 fricción baja** | Duda de segundos, palabra confusa, clic de más |
| **S4 cosmético** | Comentario estético; no afectó la tarea |

---

## De hallazgos a ítems del plan UX

Esa misma tarde, con las hojas a la mano:

1. **Pasar cada fila S1–S3 a una línea** en una tabla: `tarea · momento · qué pasó · cita · severidad · cuántas personas lo sufrieron (1/2)`.
2. **Agrupar por causa**, no por pantalla. Ejemplo: «no encontró Cobrar desde Vacunas» y «no encontró Cobrar desde Historial» = una causa: *falta CTA "Cobrar" al cerrar un acto clínico*.
3. **Cruzar con `specs/PLAN-UX-VETERINARIAS.md`:**
   - Si la causa ya está en una fila (1.x–4.x) → anotar en esa fila: `evidencia: obs 2026-MM-DD, S1, 2/2, «cita»`. Si era S1 y estaba en Fase 3–4, **subirla** a Fase 1–2.
   - Si no está → agregar fila nueva en la fase que corresponda con formato `| #.n | <causa en una frase> · evidencia obs | S/M/L | <archivos> |`. Nivel L1/L2/L3 según `sdd-workflow.mdc`.
   - S4 → no entra al plan; opcionalmente a una lista «cosmético» al final.
4. **Registrar métricas base** en la sección «Orden recomendado y criterio de éxito» del plan: tiempo y clics reales por tarea (hoy) para comparar tras Fase 2.
5. **Palabras no entendidas** → fila 1.3 (limpiar jerga): añadir la lista literal.
6. Guardar las hojas escaneadas o transcritas en `docs/observaciones/YYYY-MM-DD.md` (crear carpeta; no subir nombres reales de clientes si se usó producción).

Regla de oro: **un S1 visto en 1 de 2 personas ya es prioridad**; no se necesita muestra estadística, se necesita quitar el tropiezo.
