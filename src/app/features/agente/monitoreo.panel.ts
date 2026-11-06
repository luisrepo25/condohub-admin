import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import type { AgenteService } from './agente.service';
import { InformeTarjeta } from './informe.tarjeta';

/** G5: el agente de monitoreo observa y avisa; este panel solo lo dispara y muestra su informe. */
@Component({
  selector: 'ch-monitoreo',
  standalone: true,
  imports: [InformeTarjeta],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Agente de monitoreo</h2>
    <p class="ch-etiqueta">Lee morosos y pagos pendientes, compara con las lecturas anteriores y avisa. Nunca actúa.</p>
    <button class="ch-boton" type="button" (click)="ejecutar()">Ejecutar ahora</button>
    @if (servicio.informe(); as i) {
      <ch-informe [informe]="i" />
    }
    <h3>Historial de informes</h3>
    @if (servicio.historial().length === 0) {
      <p class="ch-vacio">Todavía no hay informes.</p>
    } @else {
      <ul class="ch-historial">
        @for (h of servicio.historial(); track h.id) {
          <li>
            <strong>{{ cuando(h.generadoEn) }}</strong> · {{ h.resumen }}
            <span [class]="h.alertas.length === 0 ? 'ch-aviso' : 'ch-error'">{{ h.alertas.length === 0 ? 'Sin alertas' : h.alertas.length + ' alerta(s)' }}</span>
          </li>
        }
      </ul>
    }
  `,
})
export class MonitoreoPanel implements OnInit {
  @Input({ required: true }) servicio!: AgenteService;

  ngOnInit(): void {
    void this.servicio.cargarInformes();
  }

  /** Corre el agente y refresca el historial, salvo que haya fallado (el error debe verse). */
  async ejecutar(): Promise<void> {
    await this.servicio.ejecutarMonitoreo();
    if (this.servicio.error() === null) await this.servicio.cargarInformes();
  }

  cuando(iso: string): string {
    return new Date(iso).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
  }
}
