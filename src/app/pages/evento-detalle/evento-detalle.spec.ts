import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { EventoDetalle } from './evento-detalle';

describe('EventoDetalle', () => {
  let component: EventoDetalle;
  let fixture: ComponentFixture<EventoDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventoDetalle],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ slug: 'evento-de-prueba' })) },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventoDetalle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
