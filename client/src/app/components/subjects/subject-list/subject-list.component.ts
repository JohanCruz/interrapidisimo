import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubjectService } from '../../../services/subject.service';
import { AuthService } from '../../../services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TeacherService } from '../../../../../client/src/app/services/teacher.service';
import { Subject } from '../../../interfaces/subject.interface'; 
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-subject-list',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FontAwesomeModule],
  template: `
    <div class="container mx-auto p-4">
      <!-- Vista de Profesor -->
      <ng-container *ngIf="isTeacher">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-3xl font-bold text-gray-800">Materias</h2>
          <button *ngIf="isTeacher" 
                  (click)="showAddForm()"
                  class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            + Agregar Materia
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let subject of subjects" 
               class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div class="p-6">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="text-xl font-semibold text-gray-800 mb-2">{{subject.name}}</h3>
                  <p class="text-gray-600">Código: {{subject.code}}</p>
                  <p class="text-gray-600">Créditos: {{subject.credits}}</p>
                  <p class="text-gray-600 mt-2">
                    Profesor: {{subject.teacher?.user?.name || 'Sin asignar'}}
                  </p>
                </div>
                <div *ngIf="isTeacher" class="flex gap-2">
                  <button (click)="editSubject(subject)"
                          class="text-yellow-600 hover:text-yellow-700">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button (click)="deleteSubject(subject.id)"
                          class="text-red-600 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal para agregar/editar -->
        <div *ngIf="showModal" class="fixed inset-0 overflow-y-auto z-[9999]">
          <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <!-- Overlay/Background -->
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" (click)="closeModal()"></div>

            <!-- Modal Panel -->
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div class="flex justify-between items-center mb-6">
                  <h3 class="text-2xl font-bold text-gray-900">
                    {{editingId ? 'Editar' : 'Agregar'}} Materia
                  </h3>
                  <button (click)="closeModal()" class="text-gray-400 hover:text-gray-500">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                
                <form [formGroup]="subjectForm" (ngSubmit)="saveSubject()" class="space-y-4">
                  <div class="grid grid-cols-1 gap-4">
                    <div>
                      <label class="block text-gray-700 font-medium mb-2">Nombre de la Materia</label>
                      <input formControlName="name" 
                             class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                             placeholder="Ej: Programación Web">
                    </div>

                    <div>
                      <label class="block text-gray-700 font-medium mb-2">Código de la Materia</label>
                      <input formControlName="code" 
                             class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                             placeholder="Ej: PW101">
                    </div>

                    <div>
                      <label class="block text-gray-700 font-medium mb-2">Créditos</label>
                      <input type="number" 
                             formControlName="credits"
                             class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                             placeholder="Ej: 3">
                    </div>

                    <div>
                      <label class="block text-gray-700 font-medium mb-2">Profesor</label>
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
                  </div>
                  
                  <div class="flex justify-end gap-3 mt-6">
                    <button type="button" 
                            (click)="closeModal()"
                            class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                      Cancelar
                    </button>
                    <button type="submit"
                            [disabled]="!subjectForm.valid"
                            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                      {{editingId ? 'Actualizar' : 'Guardar'}}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <!-- Mensaje de error -->
        <div *ngIf="errorMessage" 
             class="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-[9999] animate-fade-in">
          <div class="flex items-center">
            <span>{{ errorMessage }}</span>
            <button (click)="errorMessage = ''" 
                    class="ml-4 text-white hover:text-red-200">
              &times;
            </button>
          </div>
        </div>
      </ng-container>

      <!-- Vista de Estudiante -->
      <ng-container *ngIf="!isTeacher">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-3xl font-bold text-gray-800">Materias Disponibles</h2>
          <span class="text-gray-600">Materias inscritas: {{enrolledSubjects.length}}/3</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let subject of subjects" 
               class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div class="p-6">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="text-xl font-semibold text-gray-800 mb-2">{{subject.name}}</h3>
                  <p class="text-gray-600">Código: {{subject.code}}</p>
                  <p class="text-gray-600">Créditos: {{subject.credits}}</p>
                  <p class="text-gray-600 mt-2">
                    Profesor: {{subject.teacher?.user?.name || 'Sin asignar'}}
                  </p>
                  
                  <!-- Lista de estudiantes si está inscrito -->
                  <div *ngIf="isEnrolled(subject.id)" class="mt-4">
                    <p class="font-semibold text-gray-700">Compañeros de clase:</p>
                    <ul class="list-disc pl-5 text-sm text-gray-600">
                      <li *ngFor="let student of subject.students">
                        {{student.name}}
                      </li>
                    </ul>
                  </div>
                </div>
                
                <!-- Botones de inscripción/desinscripción -->
                <div class="mt-4">
                  <button *ngIf="!isEnrolled(subject.id)"
                          (click)="enrollInSubject(subject.id)"
                          [disabled]="!canEnrollInSubject(subject)"
                          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {{ getEnrollButtonText(subject) }}
                  </button>
                  <button *ngIf="isEnrolled(subject.id)"
                          (click)="unenrollFromSubject(subject.id)"
                          class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                    Cancelar Inscripción
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class SubjectListComponent implements OnInit {
  subjects: Subject[] = [];
  showModal = false;
  subjectForm!: FormGroup;
  isTeacher = false;
  editingId: number | null = null;
  teachers: any[] = [];
  errorMessage: string = '';
  enrolledSubjects: Subject[] = [];
  studentId: number = 0;

  constructor(
    private fb: FormBuilder,
    private subjectService: SubjectService,
    private authService: AuthService,
    private teacherService: TeacherService,
    private router: Router
  ) {
    this.initializeForm();
  }

  private initializeForm() {
    this.subjectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      code: ['', [Validators.required, Validators.minLength(2)]],
      credits: [3, [Validators.required, Validators.min(1)]],
      teacher_id: [null]
    });

    if (!this.authService.isTeacher()) {
      const id = this.authService.getCurrentUserId();
      if (id) {
        this.studentId = id;
      }
    }
  }

  ngOnInit() {
    const studentId = this.authService.getCurrentUserId();
    console.log('ID del estudiante en ngOnInit:', studentId);
    
    if (!studentId) {
      console.error('No se encontró ID de estudiante válido');
      this.router.navigate(['/login']);
      return;
    }

    this.loadTeachers();
    this.isTeacher = this.authService.isTeacher();
    if (!this.isTeacher) {
      this.loadEnrolledSubjects();
    }
  }

  loadSubjects() {
    this.subjectService.getAll().subscribe({
      next: (data: Subject[]) => {
        this.subjects = data;
      },
      error: (error) => {
        console.error('Error cargando materias:', error);
        this.errorMessage = 'Error al cargar las materias';
      }
    });
  }

  loadTeachers() {
    this.teacherService.getAll().subscribe({
      next: (data) => {
        this.teachers = data.map(teacher => ({
          ...teacher,
          subjectsCount: teacher.subjects?.length || 0
        }));
        this.loadSubjects();
      },
      error: (error) => {
        console.error('Error cargando profesores:', error);
        this.errorMessage = 'Error al cargar la lista de profesores';
      }
    });
  }

  showAddForm() {
    this.editingId = null;
    this.subjectForm.reset({credits: 3});
    this.showModal = true;
  }

  editSubject(subject: any) {
    this.editingId = subject.id;
    this.subjectForm.patchValue({
      name: subject.name,
      code: subject.code,
      credits: subject.credits,
      teacher_id: subject.teacher?.id || null
    });
    this.showModal = true;
  }

  saveSubject() {
    if (this.subjectForm.valid) {
      const formData = this.subjectForm.value;
      const data = {
        ...formData,
        teacher: formData.teacher_id ? { id: formData.teacher_id } : null
      };
      delete data.teacher_id;
      
      if (this.editingId) {
        this.subjectService.update(this.editingId, data).subscribe({
          next: () => {
            this.loadSubjects();
            this.loadTeachers();
            this.closeModal();
          },
          error: (error) => {
            if (error.status === 400) {
              this.errorMessage = 'El profesor ya tiene asignado el máximo de 2 materias permitidas';
              this.subjectForm.patchValue({ teacher_id: null });
            } else {
              this.errorMessage = 'Error al actualizar la materia';
            }
          }
        });
      } else {
        this.subjectService.create(data).subscribe({
          next: () => {
            this.loadSubjects();
            this.loadTeachers();
            this.closeModal();
          },
          error: (error) => {
            if (error.status === 400) {
              this.errorMessage = 'El profesor ya tiene asignado el máximo de 2 materias permitidas';
              this.subjectForm.patchValue({ teacher_id: null });
            } else {
              this.errorMessage = 'Error al crear la materia';
            }
          }
        });
      }
    }
  }

  deleteSubject(id: number) {
    if (confirm('¿Está seguro de eliminar esta materia?')) {
      this.subjectService.delete(id).subscribe({
        next: () => {
          this.loadSubjects();
          this.loadTeachers();
        }
      });
    }
  }

  closeModal() {
    this.showModal = false;
    this.subjectForm.reset();
    this.editingId = null;
    this.errorMessage = '';
  }

  onTeacherSelect(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;
    this.subjectForm.patchValue({
      teacher_id: value ? parseInt(value) : null
    });
  }

  loadEnrolledSubjects() {
    const studentId = this.authService.getCurrentUserId();
    console.log('Cargando materias para estudiante:', studentId);

    if (!studentId) {
      console.error('ID de estudiante no válido en loadEnrolledSubjects');
      return;
    }

    this.subjectService.getEnrolledSubjects(studentId).subscribe({
      next: (subjects) => {
        console.log('Materias inscritas recibidas:', subjects);
        this.enrolledSubjects = subjects;
      },
      error: (error) => {
        console.error('Error cargando materias inscritas:', error);
        if (error.status === 404) {
          this.enrolledSubjects = [];
        }
      }
    });
  }

  isEnrolled(subjectId: number): boolean {
    return this.enrolledSubjects.some(subject => subject.id === subjectId);
  }

  canEnrollInSubject(subject: Subject): boolean {
    if (this.enrolledSubjects.length >= 3) {
      return false;
    }
    return !this.enrolledSubjects.some(
      enrolled => enrolled.teacher?.id === subject.teacher?.id
    );
  }

  getEnrollButtonText(subject: Subject): string {
    if (this.enrolledSubjects.length >= 3) {
      return 'Límite de materias alcanzado';
    }
    if (this.enrolledSubjects.some(enrolled => enrolled.teacher?.id === subject.teacher?.id)) {
      return 'Ya tienes una materia con este profesor';
    }
    return 'Inscribirse';
  }

  enrollInSubject(subjectId: number) {
    this.subjectService.enrollInSubject(this.studentId, subjectId).subscribe({
      next: () => {
        this.loadEnrolledSubjects();
        this.loadSubjects();
      },
      error: (error) => {
        console.error('Error al inscribirse:', error);
        this.errorMessage = 'Error al inscribirse en la materia';
      }
    });
  }

  unenrollFromSubject(subjectId: number) {
    console.log('Intentando desinscribir estudiante:', this.studentId, 'de la materia:', subjectId);
    this.subjectService.unenrollStudent(this.studentId, subjectId).subscribe({
      next: (response) => {
        console.log('Desinscripción exitosa:', response);
        this.loadEnrolledSubjects();
        this.loadSubjects();
      },
      error: (error) => {
        console.error('Error al cancelar inscripción:', error);
        let errorMessage = 'Error al cancelar la inscripción';
        
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.status === 404) {
          errorMessage = 'No se encontró el estudiante o la materia';
        } else if (error.status === 400) {
          errorMessage = 'No se puede cancelar la inscripción en este momento';
        }
        
        this.errorMessage = errorMessage;
      }
    });
  }
}
