import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import {
  buildConsentimientoDocumentoView,
  ConsentimientoDocumentoDatos,
  htmlCuerpoConsentimientoDocumento,
  cssConsentimientoDocumento,
} from './consentimiento-documento.util';
import { compartirConsentimientoWhatsAppPdf, descargarPdfConsentimiento } from './consentimiento-pdf.util';

export interface ConsentimientoPreviewDialogData {
  datos: ConsentimientoDocumentoDatos;
  /** Teléfono del cliente para WhatsApp (opcional). */
  telefono?: string | null;
}

@Component({
  selector: 'app-consentimiento-preview-dialog',
  templateUrl: './consentimiento-preview-dialog.component.html',
  styleUrls: ['./consentimiento-preview-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ConsentimientoPreviewDialogComponent implements OnInit {
  titulo = 'Machote de consentimiento';
  previewHtml: SafeHtml = '';
  busy = false;
  private datos!: ConsentimientoDocumentoDatos;

  constructor(
    private dialogRef: MatDialogRef<ConsentimientoPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConsentimientoPreviewDialogData,
    private sanitizer: DomSanitizer,
    private errorMessages: ErrorMessagesService
  ) {}

  ngOnInit(): void {
    this.datos = this.data?.datos || { tipo: 'otro' };
    const view = buildConsentimientoDocumentoView(this.datos);
    this.titulo = view.titulo;
    const scoped = `<style>${cssConsentimientoDocumento()}</style>${htmlCuerpoConsentimientoDocumento(view)}`;
    this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(scoped);
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  async descargarPdf(): Promise<void> {
    this.busy = true;
    try {
      const name = await descargarPdfConsentimiento(this.datos);
      await Swal.fire({
        icon: 'success',
        title: 'PDF descargado',
        text: name,
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'descargar PDF de consentimiento'), 'error');
    } finally {
      this.busy = false;
    }
  }

  async enviarWhatsApp(): Promise<void> {
    this.busy = true;
    try {
      const r = await compartirConsentimientoWhatsAppPdf(this.datos, this.data?.telefono);
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
          text: 'No hay teléfono válido (10 dígitos). Comparte el PDF a mano o captura el teléfono del cliente.',
        });
      }
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'enviar consentimiento por WhatsApp'), 'error');
    } finally {
      this.busy = false;
    }
  }
}
