import { Component, Input, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { exportToCsv } from '../../core/utils/csv-export.util';
import { TarifasDomicilioService } from '../tarifas-domicilio.service';
import {
  FUENTE_DOMICILIO_LABELS,
  FilaDomicilio,
  FuenteDomicilio,
  GrupoDomicilios,
  ResumenDomicilios,
  agrupar,
  completarColonias,
  filasDesdeBanios,
  filasDesdeCitas,
  filasDesdeGasolinaApp,
  filasDesdeVisitas,
  porMes,
  resumir,
  top,
} from '../domicilios-metricas.util';

type Obj = Record<string, unknown>;

/** Finanzas → Domicilios: historial y métricas (spec 107). Solo lectura. */
@Component({
  selector: 'app-domicilios-metricas',
  templateUrl: './domicilios-metricas.component.html',
  styleUrls: ['./domicilios-metricas.component.scss'],
})
export class DomiciliosMetricasComponent implements OnInit {
  /** Pantalla de Domicilios: abre en el mes actual («así rápido y pronto»). */
  @Input() mesActual = false;
  cargando = true;
  error = '';
  private todas: FilaDomicilio[] = [];

  anios: string[] = [];
  anio = String(new Date().getFullYear());
  /** '' = todo el año; '01'…'12' = un mes. */
  mes = '';
  readonly meses = [
    ['01', 'Enero'], ['02', 'Febrero'], ['03', 'Marzo'], ['04', 'Abril'], ['05', 'Mayo'], ['06', 'Junio'],
    ['07', 'Julio'], ['08', 'Agosto'], ['09', 'Septiembre'], ['10', 'Octubre'], ['11', 'Noviembre'], ['12', 'Diciembre'],
  ];

  filas: FilaDomicilio[] = [];
  resumen: ResumenDomicilios = { total: 0, km: 0, costo: 0, precio: 0, ganancia: 0 };
  grafica: GrupoDomicilios[] = [];
  maxGrafica = 1;
  colonias: GrupoDomicilios[] = [];
  clientes: GrupoDomicilios[] = [];
  fuentes: GrupoDomicilios[] = [];
  tipos: GrupoDomicilios[] = [];
  verTodas = false;

  constructor(
    private db: AngularFireDatabase,
    private tarifas: TarifasDomicilioService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const leer = async (p: string) => (await this.db.database.ref(p).once('value')).val();
      const lista = (v: unknown): Obj[] =>
        v && typeof v === 'object' ? Object.entries(v as Obj).map(([id, x]) => ({ id, ...(x as Obj) })) : [];
      const [banios, citas, visitas, gasolina, clientes, t] = await Promise.all([
        leer('Katzen/Banios'),
        leer('Katzen/Citas'),
        leer('Katzen/Visitas'),
        leer('Katzen/Gasolina').catch(() => null),
        leer('Katzen/Cliente'),
        this.tarifas.getOnce(),
      ]);
      // Nombres claros para los tipos viejos de la app («Semana X2» → «Ida y vuelta»).
      const nombreTipo = new Map<string, string>(
        t.tipos.filter((x) => x.nombreApp).map((x) => [x.nombreApp as string, x.nombre] as [string, string])
      );
      const colonias = new Map<string, string>(
        lista(clientes)
          .filter((c) => String(c['colonia'] || '').trim())
          .map((c) => [String(c['id']), String(c['colonia']).trim()] as [string, string])
      );
      this.todas = completarColonias(
        [
          ...filasDesdeBanios(lista(banios)),
          ...filasDesdeCitas(lista(citas)),
          ...filasDesdeVisitas(lista(visitas)),
          ...filasDesdeGasolinaApp(gasolina).map((f) => ({ ...f, tipo: nombreTipo.get(f.tipo) || f.tipo })),
        ].filter((f) => f.fecha),
        colonias
      ).sort((a, b) => b.fecha.localeCompare(a.fecha));
      const anios = new Set(this.todas.map((f) => f.fecha.slice(0, 4)));
      anios.add(this.anio);
      this.anios = [...anios].sort().reverse();
      if (this.mesActual) {
        const hoy = new Date();
        this.anio = String(hoy.getFullYear());
        this.mes = String(hoy.getMonth() + 1).padStart(2, '0');
      } else if (!this.todas.some((f) => f.fecha.startsWith(this.anio)) && this.todas.length) {
        this.anio = this.todas[0].fecha.slice(0, 4);
      }
      this.aplicar();
    } catch {
      this.error = 'No se pudo cargar el historial de domicilios.';
    } finally {
      this.cargando = false;
    }
  }

  aplicar(): void {
    const prefijo = this.mes ? `${this.anio}-${this.mes}` : `${this.anio}-`;
    this.filas = this.todas.filter((f) => f.fecha.startsWith(prefijo));
    this.resumen = resumir(this.filas);
    this.grafica = porMes(this.todas, this.anio);
    this.maxGrafica = Math.max(1, ...this.grafica.map((g) => g.total));
    this.colonias = top(agrupar(this.filas, (f) => f.colonia || 'Sin colonia capturada'));
    this.clientes = top(agrupar(this.filas, (f) => f.cliente || 'Dueño no capturado'));
    this.fuentes = top(
      agrupar(this.filas, (f) => f.fuente, (k) => FUENTE_DOMICILIO_LABELS[k as FuenteDomicilio] || k),
      10
    );
    this.tipos = top(agrupar(this.filas, (f) => f.tipo || 'Sin tipo'), 10);
  }

  elegirMes(clave: string): void {
    this.mes = this.mes === clave ? '' : clave;
    this.aplicar();
  }

  get filasVisibles(): FilaDomicilio[] {
    return this.verTodas ? this.filas : this.filas.slice(0, 20);
  }

  get periodoLabel(): string {
    const m = this.meses.find(([k]) => k === this.mes);
    return m ? `${m[1]} ${this.anio}` : this.anio;
  }

  fuenteLabel(f: FuenteDomicilio): string {
    return FUENTE_DOMICILIO_LABELS[f] || f;
  }

  pct(v: number): number {
    return Math.round((v / this.maxGrafica) * 100);
  }

  dinero(v: number): string {
    return `$${(Number(v) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  exportar(): void {
    exportToCsv(`domicilios_${this.periodoLabel.replace(/\s+/g, '_')}`, this.filas, [
      { header: 'Fecha', value: (r) => r.fecha },
      { header: 'Para qué', value: (r) => this.fuenteLabel(r.fuente) },
      { header: 'Cliente', value: (r) => r.cliente },
      { header: 'Mascota', value: (r) => r.paciente },
      { header: 'Colonia', value: (r) => r.colonia },
      { header: 'Dirección', value: (r) => r.direccion },
      { header: 'Tipo de viaje', value: (r) => r.tipo },
      { header: 'Km', value: (r) => r.km },
      { header: 'Gasolina', value: (r) => r.costo },
      { header: 'Cobrado', value: (r) => r.precio },
      { header: 'Ganancia', value: (r) => r.ganancia },
      { header: 'Quién', value: (r) => r.quien },
    ]);
  }
}
