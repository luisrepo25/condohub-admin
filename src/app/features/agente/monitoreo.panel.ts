import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { AgenteService } from './agente.service';

/** G5: el agente de monitoreo observa y avisa; este panel solo lo dispara y muestra su informe. */
@Component({
  selector: 'ch-monitoreo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Agente de monitoreo</h2>
    <p class="ch-etiqueta">Lee morosos y pagos pendientes, compara con las lecturas anteriores y avisa. Nunca actúa (G5).</p>
    <button class="ch-boton" type="button" (click)="servicio.ejecutarMonitoreo()">Ejecutar ahora</button>
    @if (servicio.informe(); as i) {
      <div class="ch-tarjeta" role="status">
        <p>{{ i.resumen }}</p>
        @for (a of i.alertas; track a.tipo) {
          <p [class]="a.severidad === 'ALTA' ? 'ch-error' : 'ch-aviso'">{{ a.severidad }} · {{ a.mensaje }}</p>
        } @empty {
          <p class="ch-vacio">Sin alertas.</p>
        }
      </div>
    }
  `,
})
export class MonitoreoPanel {
  @Input({ required: true }) servicio!: AgenteService;
}
