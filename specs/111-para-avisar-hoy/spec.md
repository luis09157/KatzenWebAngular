# Spec 111 — Etapa B: «Para avisar hoy»

**Estado:** implementado · **Nivel:** L2 (UI/lógica; campos opcionales aditivos; sin nodos, reglas ni functions) · **Pidió:** Luis (2026-10-27, «continua con la etapa b… no pegarle ni modificar cosas que ya funcionan»)

## Reglas de Luis
- El sistema avisa a la clínica; la veterinaria toca «Enviar al cliente». **Nada se manda solo** («seguimos en pruebas»). Dejar listo para automatizar después.
- Baño recomendado **cada 4 semanas**.
- Vacuna / desparasitación: avisar **7 días antes**.
- Incluir citas (y baños) de mañana.

## Qué hace
- `para-avisar.util.ts` (puro): `paraAvisarHoy({banios, citas, recordatorios, pacientes, clientes}, hoyIso)` →
  - **Baño mañana**: baño `programado` con fecha de mañana.
  - **Ya toca baño**: último baño `completado` + 4 semanas, entre 21 días atrás y 2 días adelante, sin otro baño programado/en proceso.
  - **Cita mañana**: `pendiente`/`confirmada`, día local (`fechaLocalCita`).
  - **Recordatorio**: `pendiente`; vacuna/desparasitación desde 7 días antes, otros desde 1 día antes; hasta 3 días después.
  - Excluye mascotas inactivas o fallecidas. Agrupa por dueño + tipo + fecha (4 perros = 1 mensaje). Mensaje WhatsApp listo (`wa.me`).
- `para-avisar.loader.ts` (lazy): lee los 5 nodos y cuenta.
- `ParaAvisarDialogComponent` (standalone, lazy): Enviar al cliente (abre WhatsApp y marca), Llamar, Copiar mensaje (sin teléfono), No avisar, Deshacer.
- Entradas: número verde junto a «Recordatorios» en el menú (5 s después de entrar y cada 30 min), franja verde en Hoy, botón «Para avisar hoy (N)» en Recordatorios.

## Contrato de datos (aditivo, opcional; reglas actuales ya permiten a staff)
| Nodo | Campo | Cuándo |
|------|-------|--------|
| `Katzen/Banios/{id}` | `avisoEnviadoEn` / `avisoDescartadoEn` (number) | baño de mañana |
| `Katzen/Banios/{id}` (último baño) | `avisoProximoEnviadoEn` / `avisoProximoDescartadoEn` | ya toca baño |
| `Katzen/Citas/{id}` | `avisoEnviadoEn` / `avisoDescartadoEn` | cita de mañana |
| `Katzen/Recordatorios/{id}` | `whatsappEnviadoEn` (ya existía, 066) / `avisoDescartadoEn` | recordatorio |

No se crean recordatorios ni notificaciones. Deshacer = el campo vuelve a `null`.

## No se tocó
Recordatorios manuales y su WhatsApp (066), esquema de vacuna/desparasitación (052/053), functions FCM (023/052), portal.

## Nota para Luis (servidor, sin tocar)
`functions-fcm` (si está desplegado) avisa al dueño por push/portal cuando se guarda un recordatorio pendiente, y el programador diario avisa vacunas 7 días antes y el mismo día. En producción hay 0 recordatorios y 0 avisos de clínica: nunca ha mandado nada. Para garantizar «nada solo» con vacunas hay que pausar esas funciones (deploy con autorización).

## Para automatizar después
Una función programada puede llamar a la misma lógica (`paraAvisarHoy`) y mandar por el canal que se elija; hoy no existe ni se despliega.
