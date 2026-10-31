import { signal } from '@angular/core';
import type { Api } from '../../core/api';
import { ConEstado } from '../../core/operacion';

export interface Saga { id: string; reservaId: string; estado: string; pasoActual: number; ultimoError?: string | null }

/** S3: sagas cuya compensación no se logró; el ADMIN las revisa aquí. */
export class SagasService extends ConEstado {
  readonly sagas = signal<Saga[]>([]);

  constructor(private readonly api: Api) {
    super();
  }

  cargar(): Promise<void> {
    return this.ejecutar(async () => {
      this.sagas.set(await this.api.rest<Saga[]>('GET', '/reservas/api/sagas/requieren-revision'));
    });
  }
}
