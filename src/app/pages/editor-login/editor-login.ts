import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MOCK_EDITOR_EMAIL, MOCK_EDITOR_PASSWORD } from '../../models/editor';
import { EditorAuthService } from '../../services/editor-auth.service';

@Component({
  selector: 'app-editor-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './editor-login.html',
  styleUrl: './editor-login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorLogin {
  private readonly authService = inject(EditorAuthService);
  private readonly router = inject(Router);

  protected readonly loginError = signal('');
  protected readonly mockEmail = MOCK_EDITOR_EMAIL;
  protected readonly mockPassword = MOCK_EDITOR_PASSWORD;

  protected readonly loginForm = new FormGroup({
    email: new FormControl(MOCK_EDITOR_EMAIL, {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl(MOCK_EDITOR_PASSWORD, {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  protected submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const success = this.authService.login(this.loginForm.getRawValue());

    if (!success) {
      this.loginError.set('Las credenciales mock no coinciden. Usa las que figuran en pantalla.');
      return;
    }

    this.loginError.set('');
    void this.router.navigate(['/editor']);
  }
}
