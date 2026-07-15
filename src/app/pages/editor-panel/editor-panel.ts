import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { EditorLoading } from '../../components/editor-loading/editor-loading';

@Component({
  selector: 'app-editor-panel',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, EditorLoading],
  templateUrl: './editor-panel.html',
  styleUrl: './editor-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorPanel {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly navigating = signal(false);

  constructor() {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationStart || event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((event) => {
      this.navigating.set(event instanceof NavigationStart);
    });
  }
}
