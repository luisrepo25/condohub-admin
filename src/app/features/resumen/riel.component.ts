import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import type { Resumen } from './resumen.service';

/** Columna de apoyo: el asistente (lanza misiones del agente) y lo que conviene tener a la vista en cualquier pantalla. */
@Component({
  selector: 'ch-riel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ch-bloque">
      <h3>Asistente</h3>
      <div class="ch-chat" aria-live="polite">
        <p class="ch-msg">{{ datos.lectura?.resumen ?? 'Puedo revisar la morosidad y proponerte recargos. Nada se cobra sin tu aprobación.' }}</p>
        @for (m of enviados(); track $index) {
          <p class="ch-msg ch-msg--yo">{{ m }}</p>
          <p class="ch-msg">Misión lanzada. Sigue su avance en Agente.</p>
        }
      </div>
      <form class="ch-enviar" (submit)="enviar($event, pedido)">
        <input #pedido class="ch-campo" type="text" maxlength="500" placeholder="Pide algo al agente…" aria-label="Pedido para el asistente" />
        <button class="ch-boton ch-boton--ok ch-boton--icono" type="submit" aria-label="Enviar pedido">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </form>
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
  @Output() pedir = new EventEmitter<string>();
  readonly enviados = signal<string[]>([]);

  morosos() {
    return (this.datos.morosos ?? []).slice(0, 3);
  }

  enviar(evento: Event, campo: HTMLInputElement): void {
    evento.preventDefault();
    const texto = campo.value.trim();
    if (!texto) return;
    campo.value = '';
    this.enviados.update((m) => [...m, texto]);
    this.pedir.emit(texto);
  }

  cuando(iso: string): string {
    return new Date(iso).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
  }
}
