import { signal } from '@angular/core';

/** Estado común de una pantalla: error y aviso de la última operación. Las pantallas lo extienden. */
export abstract class ConEstado {
  readonly error = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);

  protected async ejecutar(accion: () => Promise<void>): Promise<void> {
    this.error.set(null);
    this.aviso.set(null);
    try {
      await accion();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo completar la operación');
    }
  }
}
