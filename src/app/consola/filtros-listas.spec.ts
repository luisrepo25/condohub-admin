import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Api } from '../core/api';
import { PagosPage } from '../features/pagos/pagos.page';
import { RecargosPage } from '../features/recargos/recargos.page';
import { ReservasPage } from '../features/reservas/reservas.page';

/** Las listas de la consola se pueden acotar sin que se mezcle todo (búsqueda por unidad, origen, estado, grupos). */
describe('filtros_de_las_listas_de_la_consola', () => {
  async function pintar<T extends object>(tipo: new () => T, api: Partial<Api>) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideExperimentalZonelessChangeDetection()] });
    const f = TestBed.createComponent(tipo);
    f.componentRef.setInput('api', api as Api);
    await f.whenStable();
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    const escribir = async (selector: string, valor: string, evento: string) => {
      const campo = el.querySelector(selector) as HTMLInputElement | HTMLSelectElement;
      campo.value = valor;
      campo.dispatchEvent(new Event(evento));
      await f.whenStable();
    };
    return { el, escribir, filas: () => Array.from(el.querySelectorAll('tbody tr')) };
  }

  it('F8_pagos_se_busca_por_unidad_y_se_puede_poner_el_mas_antiguo_primero', async () => {
    const graphql = jest.fn(async (consulta: string) =>
      consulta.includes('pagosPendientes')
        ? { pagosPendientes: [
            { id: 'p1', unidadId: 'ua', monto: '100.00', fechaPago: '2026-11-05' },
            { id: 'p2', unidadId: 'ub', monto: '900.00', fechaPago: '2026-11-01' },
          ] }
        : { u0: { codigo: 'A-132' }, u1: { codigo: 'B-101' } },
    );
    const { el, escribir, filas } = await pintar(PagosPage, { graphql: graphql as unknown as Api['graphql'], rest: jest.fn() });
    expect(filas().map((f) => f.querySelector('td')?.textContent)).toEqual(['A-132', 'B-101']);

    await escribir('select[aria-label="Ordenar pagos"]', 'antiguos', 'change');
    expect(filas().map((f) => f.querySelector('td')?.textContent)).toEqual(['B-101', 'A-132']);

    await escribir('input[aria-label="Buscar por unidad"]', 'b-1', 'input');
    expect(filas()).toHaveLength(1);
    expect(el.textContent).toContain('Mostrando 1 de 2');

    await escribir('input[aria-label="Buscar por unidad"]', 'zzz', 'input');
    expect(el.textContent).toContain('Ningún pago coincide');
  });

  it('F5_recargos_se_filtra_por_origen_y_por_unidad', async () => {
    const graphql = jest.fn(async (consulta: string) =>
      consulta.includes('recargosPropuestos')
        ? { recargosPropuestos: [
            { id: 'r1', unidadId: 'ua', periodo: '2026-11-01', porcentaje: '2.00', base: '390.00', monto: '7.80', origen: 'AGENTE' },
            { id: 'r2', unidadId: 'ub', periodo: '2026-11-01', porcentaje: '2.00', base: '270.00', monto: '5.40', origen: 'SISTEMA' },
          ] }
        : { u0: { codigo: 'A-132' }, u1: { codigo: 'B-101' } },
    );
    const { escribir, filas } = await pintar(RecargosPage, { graphql: graphql as unknown as Api['graphql'], rest: jest.fn() });
    expect(filas()).toHaveLength(2);

    await escribir('select[aria-label="Filtrar por origen"]', 'AGENTE', 'change');
    expect(filas().map((f) => f.querySelector('td')?.textContent)).toEqual(['A-132']);

    await escribir('select[aria-label="Filtrar por origen"]', 'TODOS', 'change');
    await escribir('input[aria-label="Buscar por unidad"]', 'b-101', 'input');
    expect(filas().map((f) => f.querySelector('td')?.textContent)).toEqual(['B-101']);
  });

  it('R8_reservas_separa_proximas_de_anteriores_y_se_filtra_por_estado', async () => {
    const reserva = (id: string, estado: string, inicio: string, unidadId: string) => ({
      id, areaId: 'ar1', unidadId, inicio, fin: inicio, estado, costoUso: '0.00', garantia: '0.00', version: 0,
    });
    const rest = jest.fn(async (_m: string, ruta: string) =>
      ruta.endsWith('/areas')
        ? [{ id: 'ar1', nombre: 'Piscina' }]
        : [
            reserva('x1', 'CANCELADA', '2026-11-01T10:00:00Z', 'ua'),
            reserva('x2', 'CONFIRMADA', '2026-12-01T10:00:00Z', 'ub'),
            reserva('x3', 'CONFIRMADA', '2026-11-20T10:00:00Z', 'ua'),
          ],
    );
    const graphql = jest.fn(async () => ({ u0: { codigo: 'A-132' }, u1: { codigo: 'B-101' } }));
    const { el, escribir, filas } = await pintar(ReservasPage, { rest: rest as unknown as Api['rest'], graphql: graphql as unknown as Api['graphql'] });

    const textos = () => filas().map((f) => f.textContent?.replace(/\s+/g, ' ').trim() ?? '');
    expect(textos()[0]).toContain('Próximas (2)');
    expect(textos()[1]).toContain('A-132');
    expect(textos()[2]).toContain('B-101');
    expect(textos()[3]).toContain('Anteriores (1)');

    await escribir('select[aria-label="Filtrar por estado"]', 'CANCELADA', 'change');
    expect(el.textContent).not.toContain('Próximas');
    expect(textos()[0]).toContain('Anteriores (1)');
  });
});
