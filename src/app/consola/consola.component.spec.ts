import { mount } from '../../remoteEntry';

const usuario = { sub: 's', nombre: 'Admin', email: 'admin@condohub.test' };

function fetchPorRuta(): jest.Mock {
  return jest.fn((url: string, opciones?: { body?: string }) => {
    let cuerpo: unknown = [];
    if (url.endsWith('/gestion/graphql')) {
      const consulta = String(JSON.parse(opciones?.body ?? '{}').query);
      cuerpo = { data: consulta.includes('pagosPendientes') ? { pagosPendientes: [] } : { miPerfil: { roles: ['ADMIN'], unidades: [] } } };
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(cuerpo) });
  });
}

async function esperar(condicion: () => boolean) {
  for (let i = 0; i < 100 && !condicion(); i++) await new Promise((r) => setTimeout(r, 10));
  expect(condicion()).toBe(true);
}

describe('consola del ADMIN', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('muestra las pestañas y abre Expensas, la primera', async () => {
    globalThis.fetch = fetchPorRuta() as unknown as typeof fetch;
    const el = document.body.appendChild(document.createElement('div'));

    await mount(el, { getToken: () => 't', user: usuario });

    await esperar(() => (el.textContent ?? '').includes('Emisión de expensas'));
    const pestanas = Array.from(el.querySelectorAll('[role="tab"]')).map((b) => b.textContent?.trim());
    expect(pestanas).toEqual(['Expensas', 'Pagos', 'Recargos', 'Reservas', 'Sagas', 'Agente', 'Reportes por voz']);
  });

  it('S3_al_abrir_Sagas_consulta_a_Reservas_por_el_gateway', async () => {
    const fetchFalso = fetchPorRuta();
    globalThis.fetch = fetchFalso as unknown as typeof fetch;
    const el = document.body.appendChild(document.createElement('div'));
    await mount(el, { getToken: () => 't', user: usuario });
    await esperar(() => el.querySelector('[role="tab"]') !== null);

    (Array.from(el.querySelectorAll('[role="tab"]')).find((b) => b.textContent?.includes('Sagas')) as HTMLElement).click();

    await esperar(() => (el.textContent ?? '').includes('Ninguna saga necesita revisión'));
    expect(fetchFalso.mock.calls.some(([url]) => String(url).endsWith('/reservas/api/sagas/requieren-revision'))).toBe(true);
  });
});
