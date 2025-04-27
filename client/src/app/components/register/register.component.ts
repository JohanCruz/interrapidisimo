// src/app/components/register/register.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
    RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 class="text-center text-3xl font-bold">Registro</h2>
        
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              formControlName="name"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="Tu nombre"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input
              formControlName="email"
              type="email"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="tu@email.com"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              formControlName="password"
              type="password"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="********"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Tipo de Usuario</label>
            <select
              formControlName="userType"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="student">Estudiante</option>
              <option value="teacher">Profesor</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              [disabled]="!registerForm.valid"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Registrarse
            </button>
          </div>

          <div class="text-center">
            <a routerLink="/login" class="text-indigo-600 hover:text-indigo-500">
              ¿Ya tienes cuenta? Inicia sesión
            </a>
          </div>
        </form>
      </div>
    </div>
  `
})
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      userType: ['student', Validators.required]
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const { userType, ...userData } = this.registerForm.value;
      
      this.authService.register(userData, userType).subscribe({
        next: (response) => {
          console.log('Registro exitoso:', response);
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Error en el registro:', error);
        }
      });
    }
  }
}