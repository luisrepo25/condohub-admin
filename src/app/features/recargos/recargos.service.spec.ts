import type { Api } from '../../core/api';
import { RecargosService } from './recargos.service';

const recargo = { id: 'r1', unidadId: 'u1', periodo: '2026-10', porcentaje: '2.00', base: '500.00', monto: '10.00', origen: 'AGENTE' };

function apiFalsa(respuestas: unknown[]): Api & { graphql: jest.Mock } {
  const graphql = jest.fn();
  respuestas.forEach((r) => graphql.mockImplementationOnce(() => Promise.resolve(r)));
  return { graphql, rest: jest.fn() } as unknown as Api & { graphql: jest.Mock };
}

describe('RecargosService (F5, G2)', () => {
  it('F5_lista_los_recargos_propuestos_sin_calcular_nada_en_el_cliente', async () => {
    const servicio = new RecargosService(apiFalsa([{ recargosPropuestos: [recargo] }, { u0: { codigo: 'C-205' } }]));

    await servicio.cargar();

    expect(servicio.recargos()[0]).toMatchObject({ unidad: 'C-205', monto: '10.00', origen: 'AGENTE' });
  });

  it('F5_solo_al_confirmar_se_manda_confirmarRecargo_y_sale_de_la_lista', async () => {
    const api = apiFalsa([{ recargosPropuestos: [recargo] }, { u0: { codigo: 'C-205' } }, { confirmarRecargo: { id: 'r1' } }]);
    const servicio = new RecargosService(api);
    await servicio.cargar();

    await servicio.confirmar('r1');

    expect(api.graphql).toHaveBeenLastCalledWith(expect.stringContaining('confirmarRecargo'), { id: 'r1' });
    expect(servicio.recargos()).toEqual([]);
  });

  it('F5_rechazar_sin_motivo_manda_null', async () => {
    const api = apiFalsa([{ rechazarRecargo: { id: 'r1' } }]);

    await new RecargosService(api).rechazar('r1', '');

    expect(api.graphql).toHaveBeenCalledWith(expect.stringContaining('rechazarRecargo'), { id: 'r1', motivo: null });
  });
});
