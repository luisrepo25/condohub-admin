import {
  ChangeDetectionStrategy, Component, effect, inject, Injector, Input, OnChanges, OnDestroy, OnInit, signal, SimpleChanges, untracked,
} from '@angular/core';
import type { Api } from '../../core/api';
import { confirmar } from '../../core/confirmar';
import { codigosDeUnidades } from '../../core/unidades';
import { unidadesDe } from './accion-pendiente';
import { AccionPendiente } from './accion-pendiente.tarjeta';
import { EJEMPLOS_MISION } from './ejemplos';
import { AgenteService, resumirDato, type Confirmacion } from './agente.service';
import { MonitoreoPanel } from './monitoreo.panel';
import { ResumenMision } from './resumen-mision.component';
import { uuidsDe } from './texto-resumen';

@Component({
  selector: 'ch-agente',
  standalone: true,
  imports: [MonitoreoPanel, AccionPendiente, ResumenMision],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Misiones del agente (a pedido)</h2>
    <p class="ch-etiqueta">El agente propone; nada que cree cargos o mueva dinero se ejecuta sin tu aprobación.</p>
    <div class="ch-barra">
      <input class="ch-campo" #objetivo type="text" [value]="pedido?.texto ?? 'Gestiona la morosidad del mes'" aria-label="Objetivo de la misión" />
      <button class="ch-boton ch-boton--ok" type="button" (click)="s.lanzar(objetivo.value)">Lanzar misión</button>
    </div>
    <p class="ch-etiqueta">Ejemplos (pulsa uno para copiarlo y luego «Lanzar misión»):</p>
    <div class="ch-ejemplos">
      @for (e of ejemplos; track e) {
        <button class="ch-boton" type="button" (click)="objetivo.value = e">{{ e }}</button>
      }
    </div>
    @if (s.error(); as e) { <p class="ch-error" role="alert">{{ e }}</p> }
    @if (s.mision(); as m) {
      <div class="ch-tarjeta" role="status">
        <p><strong>{{ m.objetivo }}</strong> — {{ m.estado }} · {{ m.pasos.length }} pasos</p>
        @for (c of m.confirmacionesPendientes; track c.id) {
          <ch-accion-pendiente [c]="c" [codigos]="codigos()" (aprobar)="aprobar($event)" (rechazar)="s.rechazar($event.id)" />
        }
        @if (m.resumen) { <ch-resumen-mision [texto]="m.resumen" [codigos]="codigos()" /> }
        <details>
          <summary>Bitácora</summary>
          <ol class="ch-bitacora">
            @for (p of m.pasos; track p.paso) {
              <li>
                <strong>{{ p.tipo }}</strong> {{ p.herramienta ?? '' }} {{ p.confirmadoPor ? '· confirmó ' + p.confirmadoPor : '' }}
                @if (resumen(p.entrada)) { <br /><small>entrada: {{ resumen(p.entrada) }}</small> }
                @if (resumen(p.salida)) { <br /><small>salida: {{ resumen(p.salida) }}</small> }
              </li>
            }
          </ol>
        </details>
      </div>
    }
    <ch-monitoreo [servicio]="s" />
  `,
})
export class AgentePage implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) api!: Api;
  /** Lo pedido en el asistente de la consola: se lanza como misión al llegar. */
  @Input() pedido: { texto: string } | null = null;
  s!: AgenteService;
  /** Código de cada unidad nombrada por el agente (id → «A-132»), para no mostrar UUID. */
  readonly codigos = signal<ReadonlyMap<string, string>>(new Map());
  private readonly injector = inject(Injector);

  ngOnInit(): void {
    this.s = new AgenteService(this.api);
    effect(() => this.resolverCodigos(), { injector: this.injector });
    if (this.pedido) void this.s.lanzar(this.pedido.texto);
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['pedido'] && !cambios['pedido'].firstChange && this.pedido) void this.s.lanzar(this.pedido.texto);
  }

  ngOnDestroy(): void {
    this.s.detener();
  }

  readonly ejemplos = EJEMPLOS_MISION;
  resumen = resumirDato;

  private resolverCodigos(): void {
    const m = this.s.mision();
    if (!m) return;
    const ids = [...uuidsDe(m.resumen ?? ''), ...m.confirmacionesPendientes.flatMap(unidadesDe)];
    const faltan = ids.filter((id) => !untracked(this.codigos).has(id));
    if (faltan.length === 0) return;
    codigosDeUnidades(this.api, faltan)
      .then((nuevos) => this.codigos.update((antes) => new Map([...antes, ...[...nuevos].filter(([id, codigo]) => id !== codigo)])))
      .catch(() => undefined); // sin códigos se muestra el identificador acortado: no es motivo para fallar
  }

  async aprobar(c: Confirmacion): Promise<void> {
    if (await confirmar(`¿Aprobar «${c.herramienta}»? Se ejecutará de inmediato.`, { aceptar: 'Sí, aprobar' })) void this.s.aprobar(c.id);
  }
}
