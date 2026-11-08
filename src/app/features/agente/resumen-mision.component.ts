import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { formatearResumen, type Linea } from './texto-resumen';

/** El resumen final del agente, con sus listas y negritas, sin mostrar Markdown ni identificadores internos. */
@Component({
  selector: 'ch-resumen-mision',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ch-resumen" aria-label="Resumen de la misión">
      @for (l of lineas; track $index) {
        <p class="ch-resumen__linea" [class]="'ch-resumen__' + l.tipo">
          @for (p of l.partes; track $index) {
            @if (p.negrita) { <strong>{{ p.texto }}</strong> } @else { {{ p.texto }} }
          }
        </p>
      }
    </div>
  `,
})
export class ResumenMision {
  lineas: Linea[] = [];

  @Input({ required: true }) set texto(valor: string) {
    this.original = valor;
    this.lineas = formatearResumen(valor, this.codigosActuales);
  }

  @Input() set codigos(valor: ReadonlyMap<string, string>) {
    this.codigosActuales = valor;
    this.lineas = formatearResumen(this.original, valor);
  }

  private original = '';
  private codigosActuales: ReadonlyMap<string, string> = new Map();
}
