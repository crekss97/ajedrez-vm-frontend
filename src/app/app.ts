import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { EditorAuthService } from './services/editor-auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly authService = inject(EditorAuthService);
  private readonly router = inject(Router);
  protected readonly title = signal('Ajedrez VM');
  protected readonly profileMenuOpen = signal(false);
  protected readonly currentYear = new Date().getFullYear();
  protected readonly editorSession = toSignal(this.authService.session$, {
    initialValue: this.authService.getSession(),
  });
  protected readonly socialLinks = [
    { label: 'Instagram', href: 'https://instagram.com', icon: 'instagram' },
    { label: 'X', href: 'https://x.com', icon: 'x' },
    { label: 'YouTube', href: 'https://youtube.com', icon: 'youtube' },
  ] as const;

  protected toggleProfileMenu(): void {
    this.profileMenuOpen.update((isOpen) => !isOpen);
  }

  protected closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected closeProfileMenuWhenClickingOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    if (!target?.closest('.profile-menu')) {
      this.closeProfileMenu();
    }
  }

  @HostListener('document:keydown.escape')
  protected closeProfileMenuWithEscape(): void {
    this.closeProfileMenu();
  }

  protected logout(): void {
    this.authService.logout();
    this.closeProfileMenu();
    void this.router.navigate(['/']);
  }
}
