import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TeacherService } from '../../../services/teacher.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="container mx-auto p-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Lista de Profesores</h2>
        <button (click)="openModal()" class="bg-blue-500 text-white px-4 py-2 rounded">
          Agregar Profesor
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let teacher of teachers" class="bg-white p-4 rounded shadow">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-bold">{{teacher.name}}</h3>
              <p>{{teacher.email}}</p>
            </div>
            <div class="flex gap-2">
              <button (click)="openModal(teacher)" 
                      class="text-blue-500 hover:text-blue-700">
                <i class="fas fa-edit"></i>
              </button>
              <button (click)="deleteTeacher(teacher.id)"
                      class="text-red-500 hover:text-red-700">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para agregar/editar profesor -->
    <div *ngIf="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 class="text-xl font-bold mb-4">{{ isEditing ? 'Editar' : 'Agregar' }} Profesor</h3>
        
        <form [formGroup]="teacherForm" (ngSubmit)="onSubmit()">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Nombre</label>
            <input 
              type="text" 
              formControlName="name"
              class="w-full px-3 py-2 border rounded"
              placeholder="Nombre del profesor"
            >
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input 
              type="email" 
              formControlName="email"
              class="w-full px-3 py-2 border rounded"
              placeholder="Email del profesor"
            >
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Contraseña</label>
            <input 
              type="password" 
              formControlName="password"
              class="w-full px-3 py-2 border rounded"
              placeholder="Contraseña"
            >
          </div>

          <div class="flex justify-end gap-2">
            <button 
              type="button" 
              (click)="closeModal()"
              class="px-4 py-2 text-gray-600 border rounded"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              [disabled]="!teacherForm.valid"
              class="px-4 py-2 bg-blue-500 text-white rounded"
            >
              {{ isEditing ? 'Actualizar' : 'Crear' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class TeacherListComponent implements OnInit {
  teachers: any[] = [];
  showModal = false;
  isEditing = false;
  teacherForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService
  ) {
    this.teacherForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadTeachers();
  }

  loadTeachers() {
    this.teacherService.getAllTeachers().subscribe({
      next: (data) => {
        this.teachers = data;
      },
      error: (error) => {
        console.error('Error cargando profesores:', error);
      }
    });
  }

  openModal(teacher?: any) {
    this.isEditing = !!teacher;
    if (teacher) {
      this.teacherForm.patchValue({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email
      });
      this.teacherForm.get('password')?.setValidators(this.isEditing ? [] : [Validators.required]);
      this.teacherForm.get('password')?.updateValueAndValidity();
    } else {
      this.teacherForm.reset();
      this.teacherForm.get('password')?.setValidators([Validators.required]);
      this.teacherForm.get('password')?.updateValueAndValidity();
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.teacherForm.reset();
  }

  onSubmit() {
    if (this.teacherForm.valid) {
      if (this.isEditing) {
        const id = this.teacherForm.get('id')?.value;
        const teacherData = {
          name: this.teacherForm.get('name')?.value,
          email: this.teacherForm.get('email')?.value,
          ...(this.teacherForm.get('password')?.value ? 
              { password: this.teacherForm.get('password')?.value } : {})
        };
        
        this.teacherService.updateTeacher(id, teacherData).subscribe({
          next: (response) => {
            console.log('Profesor actualizado:', response);
            this.loadTeachers();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error actualizando profesor:', error);
          }
        });
      } else {
        this.teacherService.createTeacher(this.teacherForm.value).subscribe({
          next: (response) => {
            console.log('Profesor creado:', response);
            this.loadTeachers();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error creando profesor:', error);
          }
        });
      }
    }
  }

  deleteTeacher(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este profesor?')) {
      this.teacherService.deleteTeacher(id).subscribe({
        next: () => {
          console.log('Profesor eliminado');
          this.loadTeachers();
        },
        error: (error) => {
          console.error('Error eliminando profesor:', error);
        }
      });
    }
  }
}
