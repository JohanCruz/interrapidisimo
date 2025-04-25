import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 class="text-center text-3xl font-bold">Iniciar Sesión</h2>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          <div>
            <input
              formControlName="email"
              type="email"
              class="w-full px-3 py-2 border rounded-md"
              placeholder="Email"
            />
          </div>
          
          <div>
            <input
              formControlName="password"
              type="password"
              class="w-full px-3 py-2 border rounded-md"
              placeholder="Contraseña"
            />
          </div>

          <div class="flex items-center space-x-4">
            <label class="flex items-center cursor-pointer">
              <input
                type="radio"
                formControlName="userType"
                value="teacher"
                class="mr-2"
                (change)="onUserTypeChange($event)"
              />
              <span class="text-gray-700">Profesor</span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input
                type="radio"
                formControlName="userType"
                value="student"
                class="mr-2"
                (change)="onUserTypeChange($event)"
              />
              <span class="text-gray-700">Estudiante</span>
            </label>
          </div>

          <button
            type="submit"
            [disabled]="!loginForm.valid"
            class="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Iniciar Sesión
          </button>

          <div *ngIf="errorMessage" class="text-red-500 text-center">
            {{ errorMessage }}
          </div>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      userType: ['student', Validators.required]
    });
  }

  onUserTypeChange(event: any) {
    console.log('Tipo de usuario seleccionado:', event.target.value);
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password, userType } = this.loginForm.value;
      console.log('Formulario enviado:', { email, userType });
      
      this.authService.login(email, password, userType).subscribe({
        next: (response) => {
          console.log('Login exitoso:', response);
          const userId = this.authService.getCurrentUserId();
          const isTeacher = this.authService.isTeacher();
          console.log('Es profesor:', isTeacher);
          console.log('Redirigiendo a:', isTeacher ? '/subjects' : '/student-subjects');
          
          this.router.navigate([isTeacher ? '/subjects' : '/student-subjects']);
        },
        error: (error) => {
          console.error('Error en login:', error);
          this.errorMessage = 'Error al iniciar sesión';
        }
      });
    }
  }
}

