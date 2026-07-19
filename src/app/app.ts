import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { CargadorAjedrezComponent } from './components/cargador-ajedrez/cargador-ajedrez';
import { AppLoadingService } from './core/app-loading.service';
import { EditorAuthService } from './services/editor-auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CargadorAjedrezComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly authService = inject(EditorAuthService);
  private readonly router = inject(Router);
  private readonly appLoading = inject(AppLoadingService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly title = signal('Ajedrez VM');
  protected readonly profileMenuOpen = signal(false);
  protected readonly currentYear = new Date().getFullYear();
  protected readonly editorSession = this.authService.session;
  protected readonly cargadorVisible = this.appLoading.visible;
  protected readonly socialLinks = [
    { label: 'Instagram', href: 'https://instagram.com', icon: 'instagram' },
    { label: 'Facebook', href: 'https://facebook.com', icon: 'facebook' },
  ] as const;
  private finalizarNavegacion: (() => void) | undefined;

  constructor() {
    effect((onCleanup) => {
      if (!this.cargadorVisible()) {
        return;
      }

      const elementoEnfocado = document.activeElement instanceof HTMLElement
        && document.activeElement !== document.body
        ? document.activeElement
        : null;
      const overflowAnterior = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';

      onCleanup(() => {
        document.documentElement.style.overflow = overflowAnterior;

        if (elementoEnfocado?.isConnected) {
          elementoEnfocado.focus({ preventScroll: true });
        }
      });
    });

    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.finalizarNavegacion?.();
        this.finalizarNavegacion = this.appLoading.iniciar(true);
        return;
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.finalizarNavegacion?.();
        this.finalizarNavegacion = undefined;
      }
    });

    this.destroyRef.onDestroy(() => this.finalizarNavegacion?.());

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
