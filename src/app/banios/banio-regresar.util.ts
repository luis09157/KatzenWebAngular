/**
 * 2026-10-30 — «Regresar a programado»: deshace un «Iniciar» por error.
 * Solo si está en proceso y no tiene pago, ticket ni cobro en caja (no se toca dinero).
 */
export function puedeRegresarAProgramado(banio: Record<string, unknown> | null | undefined): boolean {
  if (!banio) return false;
  return (
    String(banio['estado'] || '') === 'en_proceso' &&
    !banio['pagado'] &&
    !banio['visitaId'] &&
    !banio['cajaMovimientoId']
  );
}
