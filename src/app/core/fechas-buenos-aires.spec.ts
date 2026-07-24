import {
  addBuenosAiresDays,
  diasEntreFechasBuenosAires,
  fromBuenosAiresInput,
  isValidBuenosAiresDate,
  isValidBuenosAiresDateTime,
  toBuenosAiresInput,
  ZONA_HORARIA_BUENOS_AIRES,
} from './fechas-buenos-aires';

describe('fechas de Buenos Aires', () => {
  it('expone la zona horaria editorial oficial', () => {
    expect(ZONA_HORARIA_BUENOS_AIRES).toBe('America/Argentina/Buenos_Aires');
  });

  it('convierte un instante UTC a la fecha y hora local de Buenos Aires', () => {
    expect(toBuenosAiresInput('2026-07-23T02:30:00.000Z')).toBe('2026-07-22T23:30');
  });

  it('convierte una fecha local editorial en un instante UTC', () => {
    expect(fromBuenosAiresInput('2026-07-23T18:30').toISOString()).toBe('2026-07-23T21:30:00.000Z');
  });

  it('rechaza fechas de calendario imposibles', () => {
    expect(isValidBuenosAiresDateTime('2026-02-30T10:00')).toBeFalse();
    expect(isValidBuenosAiresDateTime('2026-07-23T10:00')).toBeTrue();
  });

  it('calcula rangos de días usando el calendario local', () => {
    expect(addBuenosAiresDays('2026-07-01', -29)).toBe('2026-06-02');
    expect(diasEntreFechasBuenosAires('2026-07-01', '2026-07-03')).toBe(3);
    expect(isValidBuenosAiresDate('2026-02-30')).toBeFalse();
    expect(isValidBuenosAiresDate('2026-07-23')).toBeTrue();
  });
});
