import type { Api } from './api';
import { observarEscrituras } from './api-observada';

describe('observarEscrituras', () => {
  const base = (): Api => ({ graphql: jest.fn().mockResolvedValue({ ok: 1 }), rest: jest.fn().mockResolvedValue({ ok: 1 }) }) as unknown as Api;

  it('avisa tras una mutation o un POST y devuelve la misma respuesta', async () => {
    const aviso = jest.fn();
    const api = observarEscrituras(base(), aviso);

    expect(await api.graphql('mutation { x }')).toEqual({ ok: 1 });
    expect(await api.rest('POST', '/a', {})).toEqual({ ok: 1 });

    expect(aviso).toHaveBeenCalledTimes(2);
  });

  it('no avisa en las lecturas ni cuando la escritura falla', async () => {
    const aviso = jest.fn();
    const falla = { graphql: jest.fn().mockRejectedValue(new Error('F8')), rest: jest.fn() } as unknown as Api;

    await observarEscrituras(base(), aviso).graphql('{ pagosPendientes { id } }');
    await observarEscrituras(base(), aviso).rest('GET', '/a');
    await expect(observarEscrituras(falla, aviso).graphql('mutation { x }')).rejects.toThrow('F8');

    expect(aviso).not.toHaveBeenCalled();
  });
});
