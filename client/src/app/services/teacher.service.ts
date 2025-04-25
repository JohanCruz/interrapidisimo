import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  constructor(private http: HttpClient) {}

  getTeachers() {
    return this.http.get<any[]>('/api/teachers');
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`/api/teachers`, { headers: this.getHeaders() });
  }

  getOne(id: number): Observable<any> {
    return this.http.get<any>(`/api/teachers/${id}`, { headers: this.getHeaders() });
  }

  create(teacher: any): Observable<any> {
    return this.http.post(`/api/teachers`, teacher, { headers: this.getHeaders() });
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put(`/api/teachers/${id}`, data, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`/api/teachers/${id}`, { headers: this.getHeaders() });
  }

  getSubjects(teacherId: number): Observable<any[]> {
    return this.http.get<any[]>(`/api/teachers/${teacherId}/subjects`, { headers: this.getHeaders() });
  }
}
