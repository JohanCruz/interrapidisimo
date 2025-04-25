import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SubjectListComponent } from './components/subjects/subject-list/subject-list.component';
import { StudentSubjectsComponent } from './components/subjects/student-subjects/student-subjects.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'subjects', 
    component: SubjectListComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'student-subjects', 
    component: StudentSubjectsComponent,
    canActivate: [authGuard]
  }
];
