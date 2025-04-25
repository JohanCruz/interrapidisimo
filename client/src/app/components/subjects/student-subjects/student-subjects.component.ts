import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubjectService } from '../../../services/subject.service';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-student-subjects',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-4">
      <h2 class="text-2xl font-bold mb-6">Gestión de Materias</h2>
      
      <!-- Materias Inscritas -->
      <div class="mb-8">
        <h3 class="text-xl font-semibold mb-4">Mis Materias Inscritas ({{enrolledSubjects.length}}/3)</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let subject of enrolledSubjects" 
               class="bg-white p-4 rounded-lg shadow-md">
            <div class="border-b pb-2 mb-2">
              <h4 class="font-bold text-lg">{{subject.name}}</h4>
              <p class="text-gray-600">Código: {{subject.code}}</p>
              <p class="text-gray-600">Profesor: {{subject.teacher?.name}}</p>
            </div>
            
            <!-- Compañeros de clase -->
            <div class="mb-3">
              <h5 class="font-semibold text-sm text-gray-700">Compañeros de clase:</h5>
              <ul class="list-disc pl-5 text-sm">
                <li *ngFor="let student of subject.students">
                  {{student.name}}
                </li>
              </ul>
            </div>

            <button (click)="unenrollFromSubject(subject.id)" 
                    class="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors">
              Cancelar Inscripción
            </button>
          </div>
        </div>
      </div>

      <!-- Materias Disponibles -->
      <div>
        <h3 class="text-xl font-semibold mb-4">Materias Disponibles</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let subject of availableSubjects" 
               class="bg-white p-4 rounded-lg shadow-md">
            <h4 class="font-bold text-lg">{{subject.name}}</h4>
            <p class="text-gray-600">Código: {{subject.code}}</p>
            <p class="text-gray-600">Profesor: {{subject.teacher?.name}}</p>
            <p class="text-gray-600">Créditos: {{subject.credits}}</p>
            
            <button (click)="enrollInSubject(subject.id)" 
                    [disabled]="!canEnrollInSubject(subject)"
                    class="w-full mt-3 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
              {{ getEnrollButtonText(subject) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentSubjectsComponent implements OnInit {
  enrolledSubjects: any[] = [];
  availableSubjects: any[] = [];
  studentId: number = 0;

  constructor(
    private subjectService: SubjectService,
    private authService: AuthService,
    private router: Router
  ) {
    this.studentId = this.authService.getCurrentUserId();
  }

  ngOnInit() {
    if (!this.studentId) {
      console.error('No se pudo obtener el ID del estudiante');
      this.router.navigate(['/login']);
      return;
    }
    console.log('ID del estudiante obtenido:', this.studentId);
    this.loadSubjects();
  }

  loadSubjects() {
    // Cargar materias inscritas
    this.subjectService.getEnrolledSubjects(this.studentId).subscribe({
      next: (subjects) => {
        console.log('Materias inscritas:', subjects);
        this.enrolledSubjects = subjects;
      },
      error: (error) => {
        console.error('Error cargando materias inscritas:', error);
      }
    });

    // Cargar todas las materias
    this.subjectService.getAllSubjects().subscribe(subjects => {
      // Filtrar las materias disponibles (no inscritas)
      this.availableSubjects = subjects.filter(subject => 
        !this.enrolledSubjects.some(enrolled => enrolled.id === subject.id)
      );
    });
  }

  canEnrollInSubject(subject: any): boolean {
    // Verificar si ya está inscrito en 3 materias
    if (this.enrolledSubjects.length >= 3) {
      return false;
    }

    // Verificar si ya tiene una materia con el mismo profesor
    // Primero verificamos que la materia tenga profesor asignado
    if (!subject.teacher) {
      return true; // Si no tiene profesor, se puede inscribir
    }

    return !this.enrolledSubjects.some(
      enrolled => enrolled.teacher && enrolled.teacher.id === subject.teacher.id
    );
  }

  getEnrollButtonText(subject: any): string {
    if (this.enrolledSubjects.length >= 3) {
      return 'Límite de materias alcanzado';
    }
    // También protegemos esta validación
    if (subject.teacher && this.enrolledSubjects.some(
      enrolled => enrolled.teacher && enrolled.teacher.id === subject.teacher.id
    )) {
      return 'Ya tienes una materia con este profesor';
    }
    return 'Inscribirse';
  }

  enrollInSubject(subjectId: number) {
    const studentId = this.authService.getCurrentUserId();
    if (!studentId) {
      console.error('No se pudo obtener el ID del estudiante');
      return;
    }

    this.subjectService.enrollInSubject(studentId, subjectId).subscribe({
      next: () => {
        this.loadSubjects();
      },
      error: (error) => {
        console.error('Error al inscribirse:', error);
      }
    });
  }

  unenrollFromSubject(subjectId: number) {
    this.subjectService.unenrollStudent(this.studentId, subjectId).subscribe({
      next: () => {
        this.loadSubjects();
      },
      error: (error) => {
        console.error('Error al cancelar inscripción:', error);
        alert('No se pudo cancelar la inscripción. ' + error.message);
      }
    });
  }
}
