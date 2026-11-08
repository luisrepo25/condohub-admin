import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { describirAccion } from './accion-pendiente';
import type { Confirmacion } from './agente.service';

/** G2: una acción que espera al ADMIN, explicada antes de aprobarla (qué, sobre qué unidad, con qué efecto). */
@Component({
  selector: 'ch-accion-pendiente',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ch-accion">
      <div class="ch-accion__datos">
        <strong>{{ d().titulo }}</strong> <small>({{ c.riesgo }})</small>
        <dl class="ch-accion__lista">
          @for (l of d().lineas; track l[0]) { <dt>{{ l[0] }}</dt><dd>{{ l[1] }}</dd> }
        </dl>
        @if (d().nota) { <p class="ch-etiqueta">{{ d().nota }}</p> }
      </div>
      <button class="ch-boton ch-boton--ok" type="button" (click)="aprobar.emit(c)">Aprobar</button>
      <button class="ch-boton ch-boton--no" type="button" (click)="rechazar.emit(c)">Rechazar</button>
    </div>
  `,
})
export class AccionPendiente {
  @Input({ required: true }) c!: Confirmacion;
  @Input() codigos: ReadonlyMap<string, string> = new Map();
  @Output() aprobar = new EventEmitter<Confirmacion>();
  @Output() rechazar = new EventEmitter<Confirmacion>();

  d = () => describirAccion(this.c, this.codigos);
}
