import { signal } from '@angular/core';
import type { Api } from '../../core/api';
import { ConEstado } from '../../core/operacion';

export type FormatoReporte = 'EXCEL' | 'PDF' | 'WORD';
/** `''` = «según la instrucción»: no se envía y el servicio lo toma de lo que se dijo (por defecto, Excel). */
export type FormatoElegido = FormatoReporte | '';
/** Primeras filas del resultado (G4): cada fila va alineada con las columnas y en texto. */
export interface VistaPrevia { columnas: string[]; filas: (string | null)[][]; total: number }
export interface Reporte {
  id: string; estado: string; formato?: string; transcripcion?: string;
  consultaGraphql?: string; archivoUrl?: string; motivoFallo?: string; vistaPrevia?: VistaPrevia;
}

const INTERVALO_MS = 2000;

/** G4: audio (o archivo de audio) → el servicio IA lo transcribe, arma una consulta de solo lectura y genera Excel, PDF o Word. */
export class ReportesService extends ConEstado {
  readonly reporte = signal<Reporte | null>(null);
  private temporizador: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly api: Api) {
    super();
  }

  crear(audio: Blob, formato: FormatoElegido): Promise<void> {
    return this.ejecutar(async () => {
      const datos = new FormData();
      datos.append('audio', audio, 'instruccion.webm');
      if (formato) datos.append('formato', formato);
      const r = await this.api.rest<Reporte>('POST', '/ia/reportes/voz', datos);
      this.reporte.set(r);
      this.vigilar(r.id);
    });
  }

  /** La misma orden, escrita en vez de hablada: el servicio omite Whisper y el resto del flujo es igual. */
  crearPorTexto(instruccion: string, formato: FormatoElegido): Promise<void> {
    return this.ejecutar(async () => {
      const texto = instruccion.trim();
      if (texto === '') throw new Error('Escribe la instrucción del reporte');
      const datos = new FormData();
      datos.append('instruccion', texto);
      if (formato) datos.append('formato', formato);
      const r = await this.api.rest<Reporte>('POST', '/ia/reportes/voz', datos);
      this.reporte.set(r);
      this.vigilar(r.id);
    });
  }

  /** Libera el sondeo al desmontar la pantalla. */
  detener(): void {
    clearTimeout(this.temporizador);
    this.temporizador = undefined;
  }

  private vigilar(id: string): void {
    this.detener();
    this.temporizador = setTimeout(async () => {
      try {
        this.reporte.set(await this.api.rest<Reporte>('GET', `/ia/reportes/${id}`));
      } catch (e) {
        this.error.set(e instanceof Error ? e.message : 'No se pudo consultar el reporte');
        return;
      }
      if (this.reporte()?.estado === 'PROCESANDO') this.vigilar(id);
    }, INTERVALO_MS);
  }
}
