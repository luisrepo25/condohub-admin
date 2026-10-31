import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { Informe } from './agente.service';

/** G5: una lectura del agente de monitoreo con sus métricas y alertas. Solo presenta; no decide nada. */
@Component({
  selector: 'ch-informe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ch-tarjeta" role="status">
      <p>{{ informe.resumen }}</p>
      @if (informe.metricas; as m) {
        <dl class="ch-metricas">
          <div><dt>Unidades morosas</dt><dd>{{ m.unidadesMorosas }}</dd></div>
          <div><dt>Deuda vencida</dt><dd>{{ m.deudaVencida }}</dd></div>
          <div><dt>Pagos pendientes</dt><dd>{{ m.pagosPendientes }}</dd></div>
          <div><dt>Pago más antiguo</dt><dd>{{ m.diasPagoMasAntiguo }} días</dd></div>
        </dl>
      }
      @for (a of informe.alertas; track a.tipo) {
        <p [class]="a.severidad === 'ALTA' ? 'ch-error' : 'ch-aviso'">{{ a.severidad }} · {{ a.mensaje }}</p>
      } @empty {
        <p class="ch-vacio">Sin alertas.</p>
      }
      <p class="ch-etiqueta">
        {{ informe.origen === 'PROGRAMADO' ? 'Ejecución diaria' : 'Ejecución manual' }} ·
        {{ informe.lineaBase ? 'Primera lectura: sin comparación todavía · ' : '' }}
        {{ informe.notificado ? 'Se avisó al ADMIN' : informe.alertas.length > 0 ? 'Aún no se avisó al ADMIN' : 'Sin aviso necesario' }}
      </p>
    </div>
  `,
})
export class InformeTarjeta {
  @Input({ required: true }) informe!: Informe;
}
