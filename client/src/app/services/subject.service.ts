import { HttpClient, HttpHeaders, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Subject } from '../interfaces/subject.interface';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private apiUrl = '/api';

  constructor(
    private http: HttpClient,
  ) {}

  private getHeaders(): HttpHeaders {
    const userData = localStorage.getItem('userData');
    if (!userData) return new HttpHeaders();
    const { token } = JSON.parse(userData);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en el servicio:', error);
    let errorMessage = 'Ha ocurrido un error';
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = error.error.message;
    } else {
      // Error del servidor
      errorMessage = error.error?.message || error.statusText;
    }
    return throwError(() => new Error(errorMessage));
  }

  getAll(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/subjects`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getAllSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/subjects`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getOne(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/subjects/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  create(subject: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/subjects`, subject, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError)
    );
  }

  update(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/subjects/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/subjects/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError)
    );
  }

  getEnrolledSubjects(studentId: number): Observable<any> {
    console.log('Obteniendo materias para estudiante:', studentId);
    return this.http.get(`${this.apiUrl}/students/${studentId}/subjects`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getAvailableSubjects() {
    return this.http.get<any[]>(`${this.apiUrl}/subjects/available`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  enrollInSubject(studentId: number, subjectId: number): Observable<any> {
    console.log('Inscribiendo estudiante:', studentId, 'en materia:', subjectId);
    return this.http.post(`${this.apiUrl}/students/${studentId}/subjects/${subjectId}/enroll`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  unenrollStudent(studentId: number, subjectId: number) {
    return this.http.post(`${this.apiUrl}/students/${studentId}/subjects/${subjectId}/drop`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }
}
