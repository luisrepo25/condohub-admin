import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import type { Api } from '../../core/api';
import { Grabadora } from '../../core/grabadora';
import { ReportesService, type FormatoReporte } from './reportes.service';
import { VistaPreviaTabla } from './vista-previa.tabla';

@Component({
  selector: 'ch-reportes',
  standalone: true,
  imports: [VistaPreviaTabla],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Reportes por voz</h2>
    <p class="ch-etiqueta">Escribe o graba una instrucción (por ejemplo «morosidad por bloque en Excel»). Solo se generan consultas de lectura (G4).</p>
    <div class="ch-barra">
      <input class="ch-campo" #orden type="text" maxlength="1000" placeholder="Escribe lo que quieres reportar…" aria-label="Instrucción escrita" (keydown.enter)="escribir(orden.value, formato.value)" />
      <button class="ch-boton ch-boton--ok" type="button" (click)="escribir(orden.value, formato.value)">Generar</button>
    </div>
    <div class="ch-barra">
      <select class="ch-campo" #formato aria-label="Formato del reporte">
        <option value="EXCEL">Excel</option><option value="PDF">PDF</option>
      </select>
      @if (grabando()) {
        <button class="ch-boton ch-boton--no" type="button" (click)="detener(formato.value)">Detener y generar</button>
      } @else {
        <button class="ch-boton ch-boton--ok" type="button" (click)="grabar()">Grabar instrucción</button>
      }
      <label class="ch-boton">Subir audio
        <input type="file" accept="audio/*" hidden (change)="subir($event, formato.value)" />
      </label>
    </div>
    @if (s.error(); as e) { <p class="ch-error" role="alert">{{ e }}</p> }
    @if (s.reporte(); as r) {
      <div class="ch-tarjeta" role="status">
        <p>Estado: <strong>{{ r.estado }}</strong></p>
        @if (r.transcripcion) { <p>Entendí: «{{ r.transcripcion }}»</p> }
        @if (r.consultaGraphql) { <details><summary>Consulta armada</summary><pre>{{ r.consultaGraphql }}</pre></details> }
        @if (r.archivoUrl) { <a class="ch-boton ch-boton--ok" [href]="r.archivoUrl" target="_blank" rel="noopener">Descargar {{ r.formato }}</a> }
        @if (r.motivoFallo) { <p class="ch-error">{{ r.motivoFallo }}</p> }
        @if (r.vistaPrevia; as v) { <ch-vista-previa [vista]="v" /> }
      </div>
    }
  `,
})
export class ReportesPage implements OnInit, OnDestroy {
  @Input({ required: true }) api!: Api;
  s!: ReportesService;
  readonly grabando = signal(false);
  private readonly grabadora = new Grabadora();

  ngOnInit(): void {
    this.s = new ReportesService(this.api);
  }

  ngOnDestroy(): void {
    this.s.detener();
    this.grabadora.liberar();
  }

  async grabar(): Promise<void> {
    try {
      await this.grabadora.iniciar();
      this.grabando.set(true);
    } catch {
      this.s.error.set('No se pudo usar el micrófono. Revisa el permiso del navegador o sube un archivo de audio.');
    }
  }

  async detener(formato: string): Promise<void> {
    this.grabando.set(false);
    await this.s.crear(await this.grabadora.detener(), formato as FormatoReporte);
  }

  async escribir(instruccion: string, formato: string): Promise<void> {
    await this.s.crearPorTexto(instruccion, formato as FormatoReporte);
  }

  async subir(evento: Event, formato: string): Promise<void> {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (archivo) await this.s.crear(archivo, formato as FormatoReporte);
  }
}
