import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Subject, firstValueFrom } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ADMIN_DIALOG_FORM } from '../core/config/admin-ui.config';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { LoggerService } from '../core/logger.service';
import { ClinicConfigService } from '../core/services/clinic-config.service';
import { ClientesService } from '../clientes/clientes.service';
import { Consentimiento, CONSENTIMIENTO_ESTADO_LABELS, CONSENTIMIENTO_TIPO_LABELS } from './consentimientos.models';
import { ConsentimientosService } from './consentimientos.service';
import { calcularConsentimientoKpis } from './consentimientos.util';
import { ConsentimientoDialogComponent } from './consentimiento-dialog.component';
import { datosDesdeConsentimiento } from './consentimiento-documento.util';
import {
  ConsentimientoPreviewDialogComponent,
  ConsentimientoPreviewDialogData,
} from './consentimiento-preview-dialog.component';
import { compartirConsentimientoWhatsAppPdf, descargarPdfConsentimiento } from './consentimiento-pdf.util';
import {
  coincidenciaTextoListado,
  fechaHoyListadoLocal,
  filtrarListadoAgendaOBusqueda,
  listadoFechaIso,
  metaListadoHoyManana,
  partirListadoHoyManana,
} from '../core/utils/listado-hoy-manana.util';

@Component({
  selector: 'app-consentimientos',
  templateUrl: './consentimientos.component.html',
  styleUrls: ['./consentimientos.component.scss'],
})
export class ConsentimientosComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  readonly pageSize = 50;

  displayedColumns = ['fecha', 'paciente', 'tipo', 'firmado', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Consentimiento>([]);
  dataSourceHoy = new MatTableDataSource<Consentimiento>([]);
  dataSourceManana = new MatTableDataSource<Consentimiento>([]);
  private todasFilas: Consentimiento[] = [];
  buscarTexto = '';
  tablaInicializada = false;
  loading = true;

  get modoBusqueda(): boolean {
    return !!this.buscarTexto.trim();
  }

  get listadoMeta(): string {
    if (this.loading || !this.todasFilas.length) return '';
    return metaListadoHoyManana({
      visibles: this.dataSource?.data?.length || 0,
      visiblesHoy: this.dataSourceHoy?.data?.length || 0,
      visiblesManana: this.dataSourceManana?.data?.length || 0,
      totales: this.total || this.todasFilas.length,
      query: this.buscarTexto,
    });
  }

  get todasFilasTieneDatos(): boolean {
    return this.todasFilas.length > 0;
  }

  get seccionHoyVacia(): boolean {
    return !this.loading && !this.modoBusqueda && this.todasFilas.length > 0 && !this.dataSourceHoy.data.length;
  }

  get seccionMananaVacia(): boolean {
    return !this.loading && !this.modoBusqueda && this.todasFilas.length > 0 && !this.dataSourceManana.data.length;
  }

  get busquedaSinResultados(): boolean {
    return !this.loading && this.todasFilas.length > 0 && !this.dataSource.data.length && this.modoBusqueda;
  }

  total = 0;
  vigentes = 0;
  delMes = 0;
  revocados = 0;

  readonly tipoLabels = CONSENTIMIENTO_TIPO_LABELS;
  readonly estadoLabels = CONSENTIMIENTO_ESTADO_LABELS;
  private nombreClinica = 'KatzenVet';

  constructor(
    private service: ConsentimientosService,
    private dialog: MatDialog,
    private clientesService: ClientesService,
    private clinicConfig: ClinicConfigService,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.clinicConfig
      .nombreClinica$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((n) => {
        this.nombreClinica = n || 'KatzenVet';
      });
    this.cargar();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(): void {
    this.loading = true;
    this.service
      .getConsentimientos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          const list = rows || [];
          const kpis = calcularConsentimientoKpis(list);
          this.total = kpis.total;
          this.vigentes = kpis.vigentes;
          this.delMes = kpis.delMes;
          this.revocados = kpis.revocados;
          this.todasFilas = list;
          this.aplicarVistaListado();
          this.tablaInicializada = true;
          this.loading = false;
        },
        error: (error) => {
          this.logger.error('Error al cargar consentimientos:', error);
          this.loading = false;
          Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cargar consentimientos'), 'error');
        },
      });
  }

  applyFilter(event: Event): void {
    this.buscarTexto = (event.target as HTMLInputElement).value || '';
    this.aplicarVistaListado();
  }

  private consentimientoFechasIso = (r: Consentimiento) => [listadoFechaIso(r.fecha)];

  private aplicarVistaListado(): void {
    const hoyIso = fechaHoyListadoLocal();
    const coincide = (r: Consentimiento, q: string) =>
      coincidenciaTextoListado(
        [r.cliente, r.paciente, r.firmado_por, r.tipo, this.tipoLabels[r.tipo], r.fecha, r.estado],
        q
      );
    if (this.modoBusqueda) {
      this.dataSource.data = filtrarListadoAgendaOBusqueda(this.todasFilas, {
        query: this.buscarTexto,
        hoyIso,
        getFechasIso: this.consentimientoFechasIso,
        coincideBusqueda: coincide,
      });
      this.dataSourceHoy.data = [];
      this.dataSourceManana.data = [];
      setTimeout(() => {
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
          this.paginator.firstPage();
        }
      });
      return;
    }
    const partes = partirListadoHoyManana(this.todasFilas, this.consentimientoFechasIso, { hoyIso });
    this.dataSourceHoy.data = [...partes.hoy];
    this.dataSourceManana.data = [...partes.manana];
    this.dataSource.data = [...partes.hoy, ...partes.manana];
  }

  estadoClass(estado: string): string {
    return estado === 'vigente' ? 'activo' : 'inactivo';
  }

  nuevo(): void {
    const ref = this.dialog.open(ConsentimientoDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: {},
    });
    ref
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((r) => {
        if (r) this.cargar();
      });
  }

  editar(row: Consentimiento): void {
    const ref = this.dialog.open(ConsentimientoDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: { consentimiento: row },
    });
    ref
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((r) => {
        if (r) this.cargar();
      });
  }

  async verMachote(row: Consentimiento): Promise<void> {
    const telefono = await this.telefonoDeCliente(row.cliente_id);
    const data: ConsentimientoPreviewDialogData = {
      datos: datosDesdeConsentimiento(row, this.nombreClinica),
      telefono,
    };
    this.dialog.open(ConsentimientoPreviewDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data,
    });
  }

  async descargarPdf(row: Consentimiento): Promise<void> {
    try {
      const name = await descargarPdfConsentimiento(datosDesdeConsentimiento(row, this.nombreClinica));
      await Swal.fire({
        icon: 'success',
        title: 'PDF descargado',
        text: name,
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'descargar PDF de consentimiento'), 'error');
    }
  }

  async enviarWhatsApp(row: Consentimiento): Promise<void> {
    try {
      const telefono = await this.telefonoDeCliente(row.cliente_id);
      const r = await compartirConsentimientoWhatsAppPdf(datosDesdeConsentimiento(row, this.nombreClinica), telefono);
      if (r.mode === 'download_wa') {
        await Swal.fire({
          icon: 'info',
          title: 'WhatsApp abierto',
          text: 'WhatsApp no adjunta el PDF solo: adjúntalo desde Descargas al chat.',
        });
      } else if (r.mode === 'download_only') {
        await Swal.fire({
          icon: 'info',
          title: 'PDF descargado',
          text: 'No hay teléfono válido del cliente. Comparte el PDF a mano o actualiza el teléfono.',
        });
      }
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'enviar consentimiento por WhatsApp'), 'error');
    }
  }

  private async telefonoDeCliente(clienteId?: string): Promise<string> {
    if (!clienteId) return '';
    try {
      const cli = await firstValueFrom(this.clientesService.getCliente(clienteId).pipe(take(1)));
      return String(cli?.telefono || '').trim();
    } catch {
      return '';
    }
  }

  async borrar(row: Consentimiento): Promise<void> {
    if (!row.id) return;
    const conf = await Swal.fire({
      icon: 'warning',
      title: '¿Borrar consentimiento?',
      text: 'Se marca como revocado y deja de mostrarse en la lista activa.',
      showCancelButton: true,
      confirmButtonText: 'Borrar',
      cancelButtonText: 'Cancelar',
    });
    if (!conf.isConfirmed) return;
    this.loadingService.show(LOADING_MESSAGES.deleting);
    try {
      await this.service.bajaLogica(row.id);
      Swal.fire({
        icon: 'success',
        title: 'Consentimiento borrado',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'borrar consentimiento'), 'error');
    } finally {
      this.loadingService.hide();
    }
  }
}
