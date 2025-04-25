import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from 'rxjs';
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

  getAll(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/subjects`);
  }

  getAllSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/subjects`);
  }

  getOne(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/subjects/${id}`);
  }

  create(subject: any): Observable<any> {
    return this.http.post(this.apiUrl + '/subjects', subject, { headers: this.getHeaders() });
  }

  update(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/subjects/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/subjects/${id}`, { headers: this.getHeaders() });
  }

  getEnrolledSubjects(studentId: number): Observable<any> {
    console.log('Obteniendo materias para estudiante:', studentId);
    return this.http.get(`${this.apiUrl}/students/${studentId}/subjects`, {
      headers: this.getHeaders()
    });
  }

  getAvailableSubjects() {
    return this.http.get<any[]>(`${this.apiUrl}/subjects/available`);
  }

  enrollInSubject(studentId: number, subjectId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/students/${studentId}/inscribir-materias`, {
      subjectId: subjectId
    }, {
      headers: this.getHeaders()
    });
  }

  unenrollStudent(studentId: number, subjectId: number) {
    return this.http.delete(`${this.apiUrl}/students/${studentId}/subjects/${subjectId}`, {
      headers: this.getHeaders()
    });
  }
}
