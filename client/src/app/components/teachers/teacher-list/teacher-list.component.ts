import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TeacherService } from '../../../services/teacher.service';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="container mx-auto p-4">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Profesores</h2>
        <button (click)="showAddForm()" class="bg-blue-500 text-white px-4 py-2 rounded">
          Agregar Profesor
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let teacher of teachers" class="bg-white p-4 rounded shadow">
          <h3 class="text-xl font-semibold">{{teacher.name}}</h3>
          <p class="text-gray-600">{{teacher.email}}</p>
          <div class="mt-4 flex gap-2">
            <button (click)="editTeacher(teacher)" class="bg-yellow-500 text-white px-3 py-1 rounded">
              Editar
            </button>
            <button (click)="deleteTeacher(teacher.id)" class="bg-red-500 text-white px-3 py-1 rounded">
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <!-- Modal para agregar/editar -->
      <div *ngIf="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white p-6 rounded-lg w-full max-w-md">
          <h3 class="text-xl font-bold mb-4">
            {{editingId ? 'Editar' : 'Agregar'}} Profesor
          </h3>
          
          <form [formGroup]="teacherForm" (ngSubmit)="saveTeacher()">
            <div class="space-y-4">
              <input 
                formControlName="name" 
                placeholder="Nombre"
                class="w-full p-2 border rounded"
              >
              
              <input 
                formControlName="email" 
                type="email"
                placeholder="Email"
                class="w-full p-2 border rounded"
              >
              
              <input 
                formControlName="password" 
                type="password"
                placeholder="Contraseña"
                class="w-full p-2 border rounded"
                *ngIf="!editingId"
              >

              <select formControlName="teacher_id" 
                      (change)="onTeacherSelect($event)"
                      class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option [ngValue]="null">Sin profesor</option>
                <option *ngFor="let teacher of teachers" 
                        [value]="teacher.id"
                        [disabled]="teacher.subjectsCount >= 2">
                  {{teacher.name}} ({{teacher.subjectsCount || 0}} materias)
                </option>
              </select>
            </div>
            
            <div class="flex justify-end gap-2 mt-4">
              <button 
                type="button" 
                (click)="closeModal()"
                class="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                [disabled]="!teacherForm.valid"
                class="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class TeacherListComponent implements OnInit {
  teachers: any[] = [];
  showModal = false;
  teacherForm: FormGroup;
  editingId?: number;

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService
  ) {
    this.teacherForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['']
    });
  }

  ngOnInit() {
    this.loadTeachers();
  }

  loadTeachers() {
    this.teacherService.getAll().subscribe({
      next: (data) => {
        this.teachers = data;
      },
      error: (error) => console.error('Error cargando profesores:', error)
    });
  }

  showAddForm() {
    this.editingId = undefined;
    this.teacherForm.reset();
    this.showModal = true;
  }

  editTeacher(teacher: any) {
    this.editingId = teacher.id;
    this.teacherForm.patchValue({
      name: teacher.name,
      email: teacher.email
    });
    this.showModal = true;
  }

  saveTeacher() {
    if (this.teacherForm.valid) {
      const data = this.teacherForm.value;
      
      if (this.editingId) {
        delete data.password; // No enviamos password en edición
        this.teacherService.update(this.editingId, data).subscribe({
          next: () => {
            this.loadTeachers();
            this.closeModal();
          }
        });
      } else {
        this.teacherService.create(data).subscribe({
          next: () => {
            this.loadTeachers();
            this.closeModal();
          }
        });
      }
    }
  }

  deleteTeacher(id: number) {
    if (confirm('¿Está seguro de eliminar este profesor?')) {
      this.teacherService.delete(id).subscribe({
        next: () => this.loadTeachers()
      });
    }
  }

  closeModal() {
    this.showModal = false;
    this.teacherForm.reset();
    this.editingId = undefined;
  }

  onTeacherSelect(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;
    this.teacherForm.patchValue({
      teacher_id: value ? parseInt(value) : null
    });
  }
}
