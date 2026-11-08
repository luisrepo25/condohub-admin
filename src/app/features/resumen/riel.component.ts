import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import type { Resumen } from './resumen.service';

/** Columna de apoyo: lo que conviene tener a la vista en cualquier pantalla y un acceso al agente (las misiones se lanzan en su pantalla). */
@Component({
  selector: 'ch-riel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ch-bloque">
      <h3>Agente</h3>
      <p class="ch-msg">Las misiones del agente (morosidad, recordatorios) se lanzan y se aprueban en su pantalla. Nada se cobra sin tu aprobación.</p>
      <button class="ch-boton ch-boton--ok" type="button" aria-label="Abrir el agente" (click)="abrir.emit()">Abrir agente</button>
      @if (datos.lectura?.resumen; as resumen) {
        <p class="ch-etiqueta">Último informe de monitoreo</p>
        <p class="ch-msg">{{ resumen }}</p>
      }
    </section>
    <section class="ch-bloque">
      <h3>Unidades con más deuda vencida</h3>
      @for (m of morosos(); track m.codigo) {
        <div class="ch-fila-riel">
          <b>{{ m.codigo }}</b><span class="ch-riel-monto">{{ m.deudaVencida }}</span>
          <small>Bloque {{ m.bloque }} · {{ m.expensasVencidas }} {{ m.expensasVencidas === 1 ? 'expensa vencida' : 'expensas vencidas' }}</small>
        </div>
      } @empty {
        <p class="ch-vacio">{{ datos.morosos ? 'Ninguna unidad está en mora.' : 'Sin datos por ahora.' }}</p>
      }
    </section>
    <section class="ch-bloque">
      <h3>Próximas reservas</h3>
      @for (r of datos.proximasReservas ?? []; track r.id) {
        <div class="ch-fila-riel"><b>{{ r.area }}</b><small>{{ r.unidad }} · {{ cuando(r.inicio) }}</small></div>
      } @empty {
        <p class="ch-vacio">{{ datos.proximasReservas ? 'No hay reservas confirmadas por venir.' : 'Sin datos por ahora.' }}</p>
      }
    </section>
  `,
})
export class RielComponent {
  @Input({ required: true }) datos!: Resumen;
  @Output() abrir = new EventEmitter<void>();

  morosos() {
    return (this.datos.morosos ?? []).slice(0, 3);
  }

  cuando(iso: string): string {
    return new Date(iso).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
  }
}
