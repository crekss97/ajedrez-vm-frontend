import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-editor-loading',
  standalone: true,
  template: `
    <div class="editor-loading" role="status" aria-live="polite">
      <span class="editor-loading__spinner" aria-hidden="true"></span>
      <span>{{ message() }}</span>
    </div>
  `,
  styles: `
    :host { display: block; }
    .editor-loading { display: flex; align-items: center; justify-content: center; gap: 0.7rem; min-height: 8rem; color: var(--text-soft); font-size: 0.85rem; font-weight: 700; }
    .editor-loading__spinner { width: 1.15rem; height: 1.15rem; border: 2px solid rgba(93, 135, 181, 0.22); border-top-color: var(--accent-primary-strong); border-radius: 50%; animation: editor-spin 0.8s linear infinite; }
    @keyframes editor-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .editor-loading__spinner { animation: none; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorLoading {
  readonly message = input('Cargando información...');
}
