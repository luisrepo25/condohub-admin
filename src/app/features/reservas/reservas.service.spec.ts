import type { Api } from '../../core/api';
import { puedeFinalizar, ReservasService } from './reservas.service';

const reserva = (id: string, estado: string, inicio: string, unidadId = 'u1') => ({
  id, areaId: 'a1', unidadId, inicio, fin: inicio.replace('14', '18'), estado, costoUso: '500.00', garantia: '300.00', version: 2,
});

/** `rest` responde por ruta; `graphql` resuelve los códigos de unidad como lo hace Gestión (alias u0, u1...). */
function apiFalsa(reservas: unknown, extra: Record<string, unknown> = {}) {
  const rest = jest.fn(async (metodo: string, ruta: string) => {
    if (ruta in extra) return extra[ruta];
    if (ruta === '/reservas/api/areas') return [{ id: 'a1', nombre: 'Salón de eventos' }];
    if (ruta === '/reservas/api/reservas' && metodo === 'GET') return reservas;
    return {};
  });
  const graphql = jest.fn(async () => ({ u0: { codigo: 'A-101' }, u1: { codigo: 'B-102' } }));
  return { rest, graphql, api: { rest, graphql } as unknown as Api };
}

describe('ReservasService (R6, R8)', () => {
  it('R6_carga_todas_las_reservas_con_el_nombre_del_area_y_el_codigo_de_la_unidad_la_mas_proxima_primero', async () => {
    const { api } = apiFalsa([
      reserva('r1', 'CONFIRMADA', '2026-11-20T14:00:00Z'),
      reserva('r2', 'CANCELADA', '2026-12-01T14:00:00Z', 'u2'),
    ]);
    const servicio = new ReservasService(api);

    await servicio.cargar();

    expect(servicio.reservas().map((r) => [r.id, r.area, r.unidad])).toEqual([
      ['r2', 'Salón de eventos', 'B-102'],
      ['r1', 'Salón de eventos', 'A-101'],
    ]);
  });

  it('R6_la_lista_puede_venir_envuelta_en_data', async () => {
    const { api } = apiFalsa({ data: [reserva('r1', 'CONFIRMADA', '2026-11-20T14:00:00Z')] });
    const servicio = new ReservasService(api);

    await servicio.cargar();

    expect(servicio.reservas()).toHaveLength(1);
  });

  it('R6_finalizar_sin_danios_manda_conDanios_false_y_la_version_y_avisa_que_la_garantia_se_devuelve', async () => {
    const { api, rest } = apiFalsa([reserva('r1', 'CONFIRMADA', '2026-11-20T14:00:00Z')]);
    const servicio = new ReservasService(api);
    await servicio.cargar();

    await servicio.finalizar(servicio.reservas()[0]!, false);

    expect(rest).toHaveBeenCalledWith('POST', '/reservas/api/reservas/r1/finalizar', { conDanios: false, version: 2 });
    expect(servicio.aviso()).toMatch(/garantía.*devuelve/i);
  });

  it('R6_finalizar_con_danios_avisa_que_la_garantia_se_retiene', async () => {
    const { api, rest } = apiFalsa([reserva('r1', 'CONFIRMADA', '2026-11-20T14:00:00Z')]);
    const servicio = new ReservasService(api);
    await servicio.cargar();

    await servicio.finalizar(servicio.reservas()[0]!, true);

    expect(rest).toHaveBeenCalledWith('POST', '/reservas/api/reservas/r1/finalizar', { conDanios: true, version: 2 });
    expect(servicio.aviso()).toMatch(/garantía.*retiene/i);
  });

  it('R8_si_Reservas_rechaza_la_finalizacion_se_muestra_el_codigo_y_la_lista_no_cambia', async () => {
    const { api, rest } = apiFalsa([reserva('r1', 'CONFIRMADA', '2026-11-20T14:00:00Z')]);
    const servicio = new ReservasService(api);
    await servicio.cargar();
    rest.mockRejectedValueOnce(new Error('La reserva ya no está CONFIRMADA (R8)'));

    await servicio.finalizar(servicio.reservas()[0]!, false);

    expect(servicio.error()).toContain('R8');
    expect(servicio.aviso()).toBeNull();
  });

  it('R8_solo_se_finaliza_desde_CONFIRMADA', () => {
    expect(puedeFinalizar('CONFIRMADA')).toBe(true);
    for (const estado of ['SOLICITADA', 'FALLIDA', 'CANCELADA', 'FINALIZADA']) expect(puedeFinalizar(estado)).toBe(false);
  });

  it('una_lista_vacia_no_consulta_los_codigos_de_unidad', async () => {
    const { api, graphql } = apiFalsa([]);
    const servicio = new ReservasService(api);

    await servicio.cargar();

    expect(servicio.reservas()).toEqual([]);
    expect(graphql).not.toHaveBeenCalled();
  });
});
