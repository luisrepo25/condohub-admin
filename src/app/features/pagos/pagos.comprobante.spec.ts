import type { Api } from '../../core/api';
import { PagosService } from './pagos.service';

function apiFalsa(respuesta: unknown): Api & { graphql: jest.Mock } {
  const graphql = jest.fn(() => (respuesta instanceof Error ? Promise.reject(respuesta) : Promise.resolve(respuesta)));
  return { graphql, rest: jest.fn() } as unknown as Api & { graphql: jest.Mock };
}

describe('PagosService · foto del comprobante (F8)', () => {
  it('F8_pide_el_enlace_temporal_de_la_foto_del_pago', async () => {
    const api = apiFalsa({ urlComprobante: 'https://s3/ver?firma' });
    const servicio = new PagosService(api);

    const url = await servicio.verComprobante('p1');

    expect(url).toBe('https://s3/ver?firma');
    expect(api.graphql).toHaveBeenCalledWith(expect.stringContaining('urlComprobante'), { id: 'p1' });
    expect(servicio.aviso()).toBeNull();
  });

  it('F8_un_pago_sin_foto_muestra_sin_comprobante_adjunto', async () => {
    const servicio = new PagosService(apiFalsa({ urlComprobante: null }));

    const url = await servicio.verComprobante('p1');

    expect(url).toBeNull();
    expect(servicio.aviso()).toBe('Sin comprobante adjunto');
  });

  it('F8_si_el_almacen_no_responde_se_muestra_el_error', async () => {
    const servicio = new PagosService(apiFalsa(new Error('El almacén de documentos no está disponible')));

    const url = await servicio.verComprobante('p1');

    expect(url).toBeNull();
    expect(servicio.error()).toContain('almacén');
  });
});
