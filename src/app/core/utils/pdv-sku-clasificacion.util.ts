/**
 * Spec 064 — clasificar SKU Eleventa hacia destino Katzen
 * (anaquel / vacuna / baño 022 / servicio 056 / kit BOM / uso interno).
 *
 * Prefijos reales del FDB (inventario-fdb.md): KTZ, VAC, BACO, EXAM + EAN.
 * Kits: vender el paquete como un SKU **y** enlazar componentes (BOM).
 * Baños BACO*: no tirar; enlazar a tarifa 022 / riel peluquería.
 */

import { CategoriaProducto } from '../../shared/inventario.models';

export type DestinoPdvSku =
  | 'anaquel'
  | 'vacuna'
  | 'banho'
  | 'servicio'
  | 'examen'
  | 'kit'
  | 'uso_interno';

export interface ComponenteKitPdv {
  codigo: string;
  cantidad: number;
}

export interface ClasificacionPdvSku {
  destino: DestinoPdvSku;
  categoria: CategoriaProducto | null;
  subcategoria: string;
  /** Prefijo detectado: KTZ | VAC | BACO | EXAM | EAN | PAQ | OTRO */
  prefijo: string;
  esKit: boolean;
  componentes: ComponenteKitPdv[];
  /** Enlazar a tarifa baño 022 / riel peluquería; no recargar a mano. */
  enlazarBanio: boolean;
  /** Categoría clínica suele sugerir tasa 0 — dry-run avisa si igual se aplicó *1.16. */
  sugerirExentoIva: boolean;
  /** Walk-in / mostrador vs dueño+mascota. */
  rielPos: 'petshop' | 'consulta' | 'peluqueria' | null;
  notas: string[];
}

const EAN_RE = /^\d{8,14}$/;

export function normalizarCodigoPdv(codigo: unknown): string {
  return String(codigo || '')
    .trim()
    .toUpperCase();
}

export function prefijoCodigoPdv(codigo: unknown): string {
  const c = normalizarCodigoPdv(codigo);
  if (!c) return 'OTRO';
  if (/^BACO\d+/i.test(c)) return 'BACO';
  if (/^VAC\d+/i.test(c) || /^V\d{3}$/i.test(c)) return 'VAC';
  if (/^EXAM\d+/i.test(c)) return 'EXAM';
  if (/^KTZ\d+/i.test(c)) return 'KTZ';
  if (/^PAQ/i.test(c)) return 'PAQ';
  if (EAN_RE.test(c)) return 'EAN';
  return 'OTRO';
}

/**
 * Parsea `COMPONENTES` Eleventa: `VAC010=1;VAC003=1;VAC005=1;`
 * Kits huérfanos = string vacío o códigos sin cantidad usable.
 */
export function parsearComponentesKit(raw: unknown): ComponenteKitPdv[] {
  const s = String(raw || '').trim();
  if (!s) return [];
  const out: ComponenteKitPdv[] = [];
  for (const part of s.split(/[;,\n]/)) {
    const token = part.trim();
    if (!token) continue;
    const eq = token.split('=');
    const codigo = normalizarCodigoPdv(eq[0]);
    if (!codigo) continue;
    const cantidad = eq.length > 1 ? Number(eq[1]) : 1;
    if (!Number.isFinite(cantidad) || cantidad <= 0) continue;
    out.push({ codigo, cantidad });
  }
  return out;
}

function normDepto(depto: unknown): string {
  return String(depto || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function deptoEliminado(depto: unknown): boolean {
  return /eliminado/.test(normDepto(depto));
}

/** Prefijo / nombre Eleventa de material interno (no se vende en caja). */
export function esMarcaUsoInternoPdv(codigo: unknown, descripcion: unknown): boolean {
  const c = normalizarCodigoPdv(codigo);
  const descN = String(descripcion || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (!c && !descN) return false;
  if (/^UI([A-Z0-9]|$)/.test(c) || /^MI([A-Z0-9]|$)/.test(c)) return true;
  if (/^ui(\s|$)/.test(descN) || /^mi(\s|$)/.test(descN)) return true;
  if (descN.includes('uso interno')) return true;
  return false;
}

/** Cobrado como producto en PDV pero no es anaquel (cirugía, anticipo, uñas). */
export function esServicioCobradoComoProductoPdv(descripcion: unknown): boolean {
  const descN = String(descripcion || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (!descN) return false;
  if (descN.includes('domicilio') || descN.includes('honorario')) return true;
  if (descN.includes('cirugia') || descN.includes('anticipo')) return true;
  if (descN.includes('corte de unas')) return true;
  return false;
}

export function esExamenPorNombrePdv(descripcion: unknown): boolean {
  const descN = String(descripcion || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return (
    descN.includes('examen') ||
    descN.includes('biometria') ||
    descN.includes('coproparasit') ||
    descN.includes('hematica')
  );
}

function categoriaDesdeDepto(depto: unknown): CategoriaProducto | null {
  const d = normDepto(depto);
  if (!d || deptoEliminado(depto)) return null;
  if (d.includes('alimento')) return 'alimento';
  if (d.includes('grooming') || d.includes('peluquer')) return 'peluqueria';
  if (d.includes('medicamento') || d.includes('farmacia')) return 'medicamento';
  if (d.includes('examen') || d.includes('laboratorio') || d.includes('diagnost')) {
    return 'diagnostico';
  }
  if (d.includes('ropa') || d.includes('petshop') || d.includes('premio') || d.includes('equipo')) {
    return 'accesorio';
  }
  if (d.includes('consultorio') || d.includes('vacun')) return 'vacuna';
  if (d.includes('paquete')) return 'vacuna';
  return 'accesorio';
}

export function clasificarSkuPdv(input: {
  codigo?: string | null;
  descripcion?: string | null;
  departamento?: string | null;
  componentes?: string | null;
}): ClasificacionPdvSku {
  const codigo = normalizarCodigoPdv(input.codigo);
  const desc = String(input.descripcion || '').trim();
  const descN = desc
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const prefijo = prefijoCodigoPdv(codigo);
  const componentes = parsearComponentesKit(input.componentes);
  const notas: string[] = [];
  const esKitPorCampo = componentes.length > 0;
  const esKitPorNombre = /^paq\b/i.test(desc) || prefijo === 'PAQ' || descN.includes('paquete');
  const esKit = esKitPorCampo || esKitPorNombre;

  if (deptoEliminado(input.departamento)) {
    notas.push('departamento marcado Eliminado en PDV → activo:false');
  }

  if (prefijo === 'BACO' || descN.includes('bano')) {
    return {
      destino: 'banho',
      categoria: 'peluqueria',
      subcategoria: desc || 'Baño',
      prefijo,
      esKit,
      componentes,
      enlazarBanio: true,
      sugerirExentoIva: false,
      rielPos: 'peluqueria',
      notas: [
        ...notas,
        'Enlazar BACO/precio a tarifa 022 y riel peluquería; no recargar a mano ni perder el SKU'
      ]
    };
  }

  if (prefijo === 'EXAM' || esExamenPorNombrePdv(desc) || normDepto(input.departamento).includes('examen')) {
    return {
      destino: 'examen',
      categoria: 'diagnostico',
      subcategoria: desc || 'Examen',
      prefijo,
      esKit,
      componentes,
      enlazarBanio: false,
      sugerirExentoIva: true,
      rielPos: 'consulta',
      notas: [...notas, 'Mapear a ServiciosClinica (056) y/o inventario diagnostico; no anaquel petshop']
    };
  }

  if (esServicioCobradoComoProductoPdv(desc)) {
    return {
      destino: 'servicio',
      categoria: null,
      subcategoria: desc || 'Servicio',
      prefijo,
      esKit,
      componentes,
      enlazarBanio: false,
      sugerirExentoIva: true,
      rielPos: 'consulta',
      notas: [...notas, 'Cobrado como producto en PDV → ServiciosClinica (056); no crear expediente fantasma']
    };
  }

  if (
    normDepto(input.departamento).includes('usointerno') ||
    esMarcaUsoInternoPdv(codigo, desc)
  ) {
    return {
      destino: 'uso_interno',
      categoria: categoriaDesdeDepto(input.departamento) || 'accesorio',
      subcategoria: 'Uso interno',
      prefijo,
      esKit,
      componentes,
      enlazarBanio: false,
      sugerirExentoIva: false,
      rielPos: null,
      notas: [...notas, 'No es venta: merma / salida interna spec 007']
    };
  }

  if (prefijo === 'VAC' || descN.includes('vacuna')) {
    return {
      destino: esKit ? 'kit' : 'vacuna',
      categoria: 'vacuna',
      subcategoria: desc || 'Vacuna',
      prefijo,
      esKit,
      componentes,
      enlazarBanio: false,
      sugerirExentoIva: true,
      rielPos: 'consulta',
      notas: [
        ...notas,
        esKit
          ? 'Vender paquete como un SKU y explotar BOM a stock de componentes'
          : 'Inventario categoria vacuna; no duplicar esquema clínico 052'
      ]
    };
  }

  if (esKit) {
    const cat = categoriaDesdeDepto(input.departamento) || 'vacuna';
    if (!componentes.length) {
      notas.push('kit huérfano: nombre/depto de paquete sin COMPONENTES parseables');
    }
    return {
      destino: 'kit',
      categoria: cat,
      subcategoria: desc || 'Paquete',
      prefijo,
      esKit: true,
      componentes,
      enlazarBanio: false,
      sugerirExentoIva: cat === 'vacuna' || cat === 'medicamento' || cat === 'diagnostico',
      rielPos: cat === 'vacuna' || cat === 'medicamento' ? 'consulta' : 'petshop',
      notas: [
        ...notas,
        'Importar el paquete y enlazar componentes; no tirar el kit del FDB'
      ]
    };
  }

  if (prefijo === 'KTZ') {
    const cat = categoriaDesdeDepto(input.departamento) || 'medicamento';
    return {
      destino: 'anaquel',
      categoria: cat,
      subcategoria: desc,
      prefijo,
      esKit: false,
      componentes: [],
      enlazarBanio: false,
      sugerirExentoIva: cat === 'medicamento' || cat === 'vacuna' || cat === 'diagnostico',
      rielPos: cat === 'medicamento' || cat === 'vacuna' ? 'consulta' : 'petshop',
      notas: [...notas, 'SKU interno clínica (KTZ); codigo_barras = CODIGO; no reusar como KZ- autogen']
    };
  }

  const cat = categoriaDesdeDepto(input.departamento) || (prefijo === 'EAN' ? 'accesorio' : 'accesorio');
  return {
    destino: 'anaquel',
    categoria: cat,
    subcategoria: desc,
    prefijo,
    esKit: false,
    componentes: [],
    enlazarBanio: false,
    sugerirExentoIva: cat === 'medicamento' || cat === 'vacuna' || cat === 'diagnostico' || cat === 'quirurgico',
    rielPos: cat === 'alimento' || cat === 'accesorio' || cat === 'peluqueria' ? 'petshop' : 'consulta',
    notas
  };
}
