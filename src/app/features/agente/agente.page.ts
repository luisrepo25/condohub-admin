import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import type { Api } from '../../core/api';
import { confirmar } from '../../core/confirmar';
import { AgenteService, type Confirmacion } from './agente.service';
import { MonitoreoPanel } from './monitoreo.panel';

@Component({
  selector: 'ch-agente',
  standalone: true,
  imports: [MonitoreoPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Agente de morosidad</h2>
    <p class="ch-etiqueta">El agente propone; nada que cree cargos o mueva dinero se ejecuta sin tu aprobación (G2).</p>
    <div class="ch-barra">
      <input class="ch-campo" #objetivo type="text" value="Gestiona la morosidad del mes" aria-label="Objetivo de la misión" />
      <button class="ch-boton ch-boton--ok" type="button" (click)="s.lanzar(objetivo.value)">Lanzar misión</button>
    </div>
    @if (s.error(); as e) { <p class="ch-error" role="alert">{{ e }}</p> }
    @if (s.mision(); as m) {
      <div class="ch-tarjeta" role="status">
        <p><strong>{{ m.objetivo }}</strong> — {{ m.estado }} · {{ m.pasos.length }} pasos</p>
        @if (m.resumen) { <p>{{ m.resumen }}</p> }
        @for (c of m.confirmacionesPendientes; track c.id) {
          <div class="ch-pendiente">
            <span>{{ c.herramienta }} <small>({{ c.riesgo }})</small>: {{ detalle(c) }}</span>
            <button class="ch-boton ch-boton--ok" type="button" (click)="aprobar(c)">Aprobar</button>
            <button class="ch-boton ch-boton--no" type="button" (click)="s.rechazar(c.id)">Rechazar</button>
          </div>
        }
        <details>
          <summary>Bitácora (G3)</summary>
          <ol class="ch-bitacora">
            @for (p of m.pasos; track p.paso) {
              <li>{{ p.tipo }} {{ p.herramienta ?? '' }} {{ p.confirmadoPor ? '· confirmó ' + p.confirmadoPor : '' }}</li>
            }
          </ol>
        </details>
      </div>
    }
    <ch-monitoreo [servicio]="s" />
  `,
})
export class AgentePage implements OnInit, OnDestroy {
  @Input({ required: true }) api!: Api;
  s!: AgenteService;

  ngOnInit(): void {
    this.s = new AgenteService(this.api);
  }

  ngOnDestroy(): void {
    this.s.detener();
  }

  detalle(c: Confirmacion): string {
    return JSON.stringify(c.argumentos ?? {});
  }

  aprobar(c: Confirmacion): void {
    if (confirmar(`¿Aprobar «${c.herramienta}»? Se ejecutará de inmediato.`)) void this.s.aprobar(c.id);
  }
}
