import type { Api } from '../../core/api';
import { PagosService } from './pagos.service';

const pago = { id: 'p1', unidadId: 'u1', monto: '75.50', fechaPago: '2026-10-20' };

function apiFalsa(respuestas: unknown[]): Api & { graphql: jest.Mock } {
  const graphql = jest.fn();
  respuestas.forEach((r) => graphql.mockImplementationOnce(() => (r instanceof Error ? Promise.reject(r) : Promise.resolve(r))));
  return { graphql, rest: jest.fn() } as unknown as Api & { graphql: jest.Mock };
}

describe('PagosService (F8)', () => {
  it('F8_carga_los_pagos_pendientes_con_el_codigo_de_su_unidad', async () => {
    const api = apiFalsa([{ pagosPendientes: [pago] }, { u0: { codigo: 'B-103' } }]);
    const servicio = new PagosService(api);

    await servicio.cargar();

    expect(servicio.pagos()).toEqual([{ ...pago, unidad: 'B-103' }]);
    expect(servicio.error()).toBeNull();
  });

  it('F8_confirmar_muestra_el_recibo_y_quita_el_pago_de_la_lista', async () => {
    const api = apiFalsa([{ pagosPendientes: [pago] }, { u0: { codigo: 'B-103' } }, { confirmarPago: { reciboNumero: 501 } }]);
    const servicio = new PagosService(api);
    await servicio.cargar();

    await servicio.confirmar('p1');

    expect(servicio.aviso()).toContain('501');
    expect(servicio.pagos()).toEqual([]);
    expect(api.graphql).toHaveBeenLastCalledWith(expect.stringContaining('confirmarPago'), { id: 'p1' });
  });

  it('F8_rechazar_envia_el_motivo', async () => {
    const api = apiFalsa([{ rechazarPago: { id: 'p1' } }]);
    const servicio = new PagosService(api);

    await servicio.rechazar('p1', 'Comprobante ilegible');

    expect(api.graphql).toHaveBeenCalledWith(expect.stringContaining('rechazarPago'), { id: 'p1', motivo: 'Comprobante ilegible' });
  });

  it('F8_si_Gestion_rechaza_la_operacion_se_muestra_su_codigo_y_el_pago_sigue_en_la_lista', async () => {
    const api = apiFalsa([{ pagosPendientes: [pago] }, { u0: { codigo: 'B-103' } }, new Error('El pago ya no está PENDIENTE (F8)')]);
    const servicio = new PagosService(api);
    await servicio.cargar();

    await servicio.confirmar('p1');

    expect(servicio.error()).toContain('F8');
    expect(servicio.pagos()).toHaveLength(1);
  });
});
