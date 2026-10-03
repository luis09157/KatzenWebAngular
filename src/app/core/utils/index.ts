/**
 * Índice documentado de utilidades transversales (`core/utils`).
 * Preferir imports directos del archivo fuente en features (mejor tree-shaking);
 * este barrel sirve como **mapa** y re-export opcional.
 *
 * Ver también: `specs/memory/module-map.md` · specs **075** / **076**.
 */

export * from './admin-status.util';
export * from './auth-claims-access.util';
export * from './cliente-hydrate.util';
export * from './cliente-search.util';
export * from './clinica-config.util';
export * from './cobro-integridad.util';
export * from './csv-export.util';
export * from './entity-stats.util';
export * from './fcm-copy.util';
export * from './firebase-messaging-sw-register';
export * from './folio-expediente-paciente.util';
export * from './login-error-copy.util';
export * from './omit-undefined-rtdb.util';
export * from './paciente-cliente.util';
export * from './paciente-hydrate.util';
export * from './paciente-search.util';
export * from './pdv-deptos.util';
export * from './pdv-dry-run.util';
export * from './pdv-import-reglas.util';
export * from './pdv-iva-map.util';
export * from './pdv-sku-clasificacion.util';
export * from './periodo-filtro.util';
export * from './precio-margen.util';
export * from './producto-search.util';
export * from './recordatorio-canal-cliente.util';
export * from './rtdb-date.util';
export * from './rtdb-paciente-query.util';
export * from './rtdb-push.util';
export * from './rtdb-row.util';
export * from './sucursal-filter.util';
export * from './text-search.util';
