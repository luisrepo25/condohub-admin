import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { VistaPrevia } from './reportes.service';

/** G4: el resultado del reporte se ve en pantalla (las primeras filas) además de descargarse. Solo muestra lo que entrega el servicio. */
@Component({
  selector: 'ch-vista-previa',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (vista.columnas.length === 0) {
      <p class="ch-vacio">La consulta no devolvió resultados.</p>
    } @else {
      <p class="ch-etiqueta" role="status">Mostrando {{ vista.filas.length }} de {{ vista.total }} filas</p>
      <div class="ch-scroll">
        <table class="ch-tabla">
          <thead><tr>@for (c of vista.columnas; track c) { <th>{{ c }}</th> }</tr></thead>
          <tbody>
            @for (fila of vista.filas; track $index) {
              <tr>@for (celda of fila; track $index) { <td>{{ celda ?? '—' }}</td> }</tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class VistaPreviaTabla {
  @Input({ required: true }) vista!: VistaPrevia;
}
