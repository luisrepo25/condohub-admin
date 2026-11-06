import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Api } from '../../core/api';
import { AgentePage } from './agente.page';

describe('AgentePage: pedido desde el asistente', () => {
  const mision = { id: 'm1', objetivo: 'x', estado: 'TERMINADA', confirmacionesPendientes: [], pasos: [] };

  async function pintar(pedido: { texto: string } | null): Promise<{ rest: jest.Mock; el: HTMLElement }> {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideExperimentalZonelessChangeDetection()] });
    const rest = jest.fn((metodo: string) => Promise.resolve(metodo === 'POST' ? mision : []));
    const fixture = TestBed.createComponent(AgentePage);
    fixture.componentRef.setInput('api', { rest, graphql: jest.fn() } as unknown as Api);
    fixture.componentRef.setInput('pedido', pedido);
    await fixture.whenStable();
    return { rest, el: fixture.nativeElement as HTMLElement };
  }

  it('G1_lanza_la_mision_con_lo_que_se_pidio_y_lo_deja_escrito', async () => {
    const { rest, el } = await pintar({ texto: 'Revisa la morosidad' });

    const lanzada = rest.mock.calls.find(([metodo]) => metodo === 'POST') as unknown[];
    expect(JSON.stringify(lanzada)).toContain('Revisa la morosidad');
    expect((el.querySelector('input[aria-label="Objetivo de la misión"]') as HTMLInputElement).value).toBe('Revisa la morosidad');
  });

  it('G2_sin_pedido_no_lanza_nada_por_su_cuenta', async () => {
    const { rest } = await pintar(null);

    expect(rest.mock.calls.some(([metodo]) => metodo === 'POST')).toBe(false);
  });
});
