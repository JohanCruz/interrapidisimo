import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Obtener el token del localStorage
  const userData = localStorage.getItem('userData');
  if (userData) {
    const user = JSON.parse(userData);
    if (user.token) {
      // Clonar la petición y agregar el token en el header
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${user.token}`)
      });
      return next(authReq);
    }
  }
  return next(req);
}; 