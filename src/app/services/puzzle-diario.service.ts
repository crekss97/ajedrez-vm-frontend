import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../core/config/api.config';
import { OMITIR_CARGADOR_GLOBAL } from '../core/interceptors/app-loading.interceptor';
import { PuzzleDiario } from '../models/puzzle-diario';

@Injectable({
  providedIn: 'root',
})
export class PuzzleDiarioService {
  private readonly http = inject(HttpClient);

  getPuzzleDiario(): Observable<PuzzleDiario> {
    return this.http.get<PuzzleDiario>(`${API_URL}/puzzles/daily`, {
      context: new HttpContext().set(OMITIR_CARGADOR_GLOBAL, true),
    });
  }
}
