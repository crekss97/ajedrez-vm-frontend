import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PuzzleDiario } from '../../models/puzzle-diario';
import { SidebarLink } from '../../models/sidebar-link';
import { TableroPuzzleComponent } from '../tablero-puzzle/tablero-puzzle';

@Component({
  selector: 'app-barra-lateral-home',
  standalone: true,
  imports: [TableroPuzzleComponent],
  templateUrl: './barra-lateral-home.html',
  styleUrl: './barra-lateral-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarraLateralHomeComponent {
  readonly links = input.required<SidebarLink[]>();
  readonly cargandoLinks = input(false);
  readonly errorLinks = input(false);
  readonly puzzle = input<PuzzleDiario | null>(null);
  readonly cargandoPuzzle = input(false);
  readonly errorPuzzle = input(false);
}
