import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import type { Resumen } from './resumen.service';

/** Lo primero que ve el ADMIN: cuánto espera su decisión. Cada tarjeta lleva a la sección donde se resuelve. */
@Component({
  selector: 'ch-resumen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ch-kpis" aria-label="Resumen de hoy">
      <button type="button" class="ch-kpi" (click)="ir.emit('agente')">
        <span class="ch-kpi-t">Unidades morosas</span>
        <b>{{ datos.morosos?.length ?? '—' }}</b>
      </button>
      <button type="button" class="ch-kpi" (click)="ir.emit('agente')">
        <span class="ch-kpi-t">Deuda vencida</span>
        <b>{{ datos.lectura?.deudaVencida ?? '—' }}</b>
        @if (!datos.lectura) { <small class="ch-kpi-n">Ejecuta el agente de monitoreo</small> }
      </button>
      <button type="button" class="ch-kpi" (click)="ir.emit('pagos')">
        <span class="ch-kpi-t">Pagos por conciliar</span>
        <b>{{ datos.pagosPendientes ?? '—' }}</b>
        @if ((datos.pagosPendientes ?? 0) > 0) { <span class="ch-insignia ch-insignia--aviso">Por revisar</span> }
      </button>
      <button type="button" class="ch-kpi" (click)="ir.emit('sagas')">
        <span class="ch-kpi-t">Reservas por revisar</span>
        <b>{{ datos.sagasEnRevision ?? '—' }}</b>
        @if ((datos.sagasEnRevision ?? 0) > 0) { <span class="ch-insignia ch-insignia--peligro">Atascada</span> }
      </button>
    </section>
  `,
})
export class ResumenTarjetas {
  @Input({ required: true }) datos!: Resumen;
  @Output() ir = new EventEmitter<string>();
}
