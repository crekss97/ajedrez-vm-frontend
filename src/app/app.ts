import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
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
  protected readonly editorSession = this.authService.session;
  protected readonly socialLinks = [
    { label: 'Instagram', href: 'https://instagram.com', icon: 'instagram' },
    { label: 'X', href: 'https://x.com', icon: 'x' },
    { label: 'YouTube', href: 'https://youtube.com', icon: 'youtube' },
  ] as const;

  constructor() {
    this.authService.ensureSession().subscribe();
  }

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
    this.closeProfileMenu();
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/']),
      error: () => void this.router.navigate(['/login'], {
        queryParams: { error: 'logout_failed' },
      }),
    });
  }
}
