import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  isLoggedIn(): boolean {
    return !!localStorage.getItem('userData');
  }

  isTeacher(): boolean {
    const userData = localStorage.getItem('userData');
    if (!userData) return false;
    const user = JSON.parse(userData);
    return user.role === 'teacher';
  }

  login(email: string, password: string, type: 'teacher' | 'student') {
    console.log('Intentando login como:', type); // Debug
    return this.http.post(`${this.apiUrl}/login/${type}`, { email, password }).pipe(
      tap((response: any) => {
        console.log('Respuesta del servidor:', response); // Debug
        if (response && response.token) {
          const tokenData = this.decodeToken(response.token);
          console.log('Token decodificado:', tokenData); // Debug
          const userData = {
            id: tokenData.sub,
            email: tokenData.email,
            role: type, // Usamos el tipo seleccionado en el formulario
            token: response.token
          };
          console.log('Guardando userData:', userData); // Debug
          localStorage.setItem('userData', JSON.stringify(userData));
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('userData');
    this.router.navigate(['/login']);
  }

  getCurrentUserId(): number {
    const userData = localStorage.getItem('userData');
    if (!userData) return 0;
    const user = JSON.parse(userData);
    return user?.id || 0;
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(window.atob(base64));
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }
}
