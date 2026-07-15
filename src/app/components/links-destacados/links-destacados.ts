import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SidebarLink } from '../../models/sidebar-link';

@Component({
  selector: 'app-links-destacados',
  standalone: true,
  templateUrl: './links-destacados.html',
  styleUrl: './links-destacados.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksDestacadosComponent {
  readonly links = input.required<SidebarLink[]>();
}
