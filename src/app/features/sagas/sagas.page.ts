import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import type { Api } from '../../core/api';
import { SagasService } from './sagas.service';

@Component({
  selector: 'ch-sagas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ch-barra">
      <h2>Sagas que requieren revisión</h2>
      <button class="ch-boton" type="button" (click)="s.cargar()">Actualizar</button>
    </div>
    <p class="ch-etiqueta">El sistema no pudo deshacer un paso de estas reservas por sí solo y necesitan que alguien las revise.</p>
    @if (s.error(); as e) { <p class="ch-error" role="alert">{{ e }}</p> }
    @if (s.sagas().length === 0) {
      <p class="ch-vacio">Ninguna saga necesita revisión.</p>
    } @else {
      <div class="ch-scroll"><table class="ch-tabla">
        <thead><tr><th>Saga</th><th>Reserva</th><th>Estado</th><th>Paso</th><th>Último error</th></tr></thead>
        <tbody>
          @for (x of s.sagas(); track x.id) {
            <tr>
              <td>{{ x.id.slice(0, 8) }}</td><td>{{ x.reservaId.slice(0, 8) }}</td>
              <td><span class="ch-insignia" [attr.data-estado]="x.estado">{{ x.estado }}</span></td><td>{{ x.pasoActual }}</td><td>{{ x.ultimoError ?? '—' }}</td>
            </tr>
          }
        </tbody>
      </table></div>
    }
  `,
})
export class SagasPage implements OnInit {
  @Input({ required: true }) api!: Api;
  s!: SagasService;

  ngOnInit(): void {
    this.s = new SagasService(this.api);
    void this.s.cargar();
  }
}
