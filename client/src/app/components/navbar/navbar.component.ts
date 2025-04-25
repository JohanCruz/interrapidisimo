import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, NgIf],
  template: `
    <nav class="bg-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <span class="text-white">Sistema Universitario</span>
            </div>
            <div class="hidden md:block">
              <div class="ml-10 flex items-baseline space-x-4">
                <ng-container *ngIf="authService.isTeacher()">
                  <a routerLink="/subjects" 
                     routerLinkActive="bg-gray-900 text-white" 
                     class="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Gestionar Materias
                  </a>
                  <a routerLink="/teachers" 
                     routerLinkActive="bg-gray-900 text-white" 
                     class="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Profesores
                  </a>
                </ng-container>
                
                <ng-container *ngIf="!authService.isTeacher()">
                  <a routerLink="/subjects" 
                     routerLinkActive="bg-gray-900 text-white" 
                     class="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Mis Materias
                  </a>
                </ng-container>
              </div>
            </div>
          </div>
          <div class="hidden md:block">
            <div class="ml-4 flex items-center md:ml-6">
              <!-- Si NO está autenticado -->
              <ng-container *ngIf="!authService.isLoggedIn()">
                <a routerLink="/login" 
                   class="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Iniciar Sesión
                </a>
                <a routerLink="/register" 
                   class="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Registrarse
                </a>
              </ng-container>
              <!-- Si está autenticado -->
              <ng-container *ngIf="authService.isLoggedIn()">
                <button (click)="authService.logout()" 
                        class="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Cerrar Sesión
                </button>
              </ng-container>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  constructor(public authService: AuthService) {}
}
