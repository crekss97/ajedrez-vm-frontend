import { TestBed } from '@angular/core/testing';

import { Eventos } from './evento.service';

describe('Eventos', () => {
  let service: Eventos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Eventos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
