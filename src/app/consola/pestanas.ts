export type Pestana = 'expensas' | 'pagos' | 'recargos' | 'reservas' | 'sagas' | 'agente' | 'reportes';

export interface ItemPestana { id: Pestana; titulo: string; ayuda: string; icono: string }

export const GRUPOS: { titulo: string; items: ItemPestana[] }[] = [
  {
    titulo: 'Cobranza',
    items: [
      { id: 'expensas', titulo: 'Expensas', ayuda: 'Emitir el mes', icono: 'M4 7h16v12H4zM4 11h16M8 3v4M16 3v4' },
      { id: 'pagos', titulo: 'Pagos', ayuda: 'Por conciliar', icono: 'M3 7h18v11H3zM3 11h18M7 15h4' },
      { id: 'recargos', titulo: 'Recargos', ayuda: 'Confirmar o rechazar', icono: 'M12 3v18M17 7H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6' },
    ],
  },
  {
    titulo: 'Áreas comunes',
    items: [
      { id: 'reservas', titulo: 'Reservas', ayuda: 'Ver y finalizar', icono: 'M4 20V9l8-5 8 5v11M9 20v-6h6v6' },
      { id: 'sagas', titulo: 'Sagas', ayuda: 'Reservas atascadas', icono: 'M12 3 3 20h18zM12 10v4M12 17h.01' },
    ],
  },
  {
    titulo: 'Asistentes',
    items: [
      { id: 'agente', titulo: 'Agente', ayuda: 'Morosidad y monitoreo', icono: 'M6 8h12v10H6zM12 8V4M9 12h.01M15 12h.01M3 12v3M21 12v3' },
      { id: 'reportes', titulo: 'Reportes por voz', ayuda: 'Excel, PDF o Word', icono: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3' },
    ],
  },
];
