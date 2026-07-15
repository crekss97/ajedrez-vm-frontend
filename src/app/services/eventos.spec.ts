import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { EventosService } from './evento.service';

describe('EventosService', () => {
  let service: EventosService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(EventosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
