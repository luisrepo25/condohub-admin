import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import type { Api } from '../../core/api';
import { confirmar } from '../../core/confirmar';
import { puedeFinalizar, ReservasService, type ReservaAdmin } from './reservas.service';

@Component({
  selector: 'ch-reservas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ch-barra">
      <h2>Reservas</h2>
      <button class="ch-boton" type="button" (click)="s.cargar()">Actualizar</button>
    </div>
    <p class="ch-etiqueta">Al finalizar una reserva sin daños la garantía se devuelve como nota de crédito; con daños se retiene (R6).</p>
    @if (s.error(); as e) { <p class="ch-error" role="alert">{{ e }}</p> }
    @if (s.aviso(); as a) { <p class="ch-aviso" role="status">{{ a }}</p> }
    @if (s.reservas().length === 0) {
      <p class="ch-vacio">No hay reservas.</p>
    } @else {
      <div class="ch-scroll">
        <table class="ch-tabla">
          <thead><tr><th>Unidad</th><th>Área</th><th>Horario</th><th>Estado</th><th>Uso</th><th>Garantía</th><th>Acciones</th></tr></thead>
          <tbody>
            @for (r of s.reservas(); track r.id) {
              <tr>
                <td>{{ r.unidad }}</td><td>{{ r.area }}</td><td>{{ cuando(r.inicio) }} → {{ cuando(r.fin) }}</td>
                <td>{{ r.estado }}@if (r.motivo) { <br /><small>{{ r.motivo }}</small> }</td>
                <td>{{ r.costoUso }}</td><td>{{ r.garantia }}</td>
                <td class="ch-acciones">
                  @if (finalizable(r)) {
                    <button class="ch-boton ch-boton--ok" type="button" (click)="finalizar(r, false)">Finalizar sin daños</button>
                    <button class="ch-boton ch-boton--no" type="button" (click)="finalizar(r, true)">Con daños</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class ReservasPage implements OnInit {
  @Input({ required: true }) api!: Api;
  s!: ReservasService;

  ngOnInit(): void {
    this.s = new ReservasService(this.api);
    void this.s.cargar();
  }

  finalizable(r: ReservaAdmin): boolean {
    return puedeFinalizar(r.estado);
  }

  cuando(iso: string): string {
    return new Date(iso).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
  }

  finalizar(r: ReservaAdmin, conDanios: boolean): void {
    const efecto = conDanios ? `se retiene la garantía de ${r.garantia}` : `se devuelve la garantía de ${r.garantia}`;
    if (confirmar(`¿Finalizar la reserva de ${r.unidad} (${r.area})? ${efecto}.`)) void this.s.finalizar(r, conDanios);
  }
}
