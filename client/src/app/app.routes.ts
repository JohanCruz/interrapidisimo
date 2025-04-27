import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SubjectListComponent } from './components/subjects/subject-list/subject-list.component';
import { StudentSubjectsComponent } from './components/subjects/student-subjects/student-subjects.component';
import { TeacherListComponent } from './components/teachers/teacher-list/teacher-list.component';
import { authGuard, teacherGuard } from './guards/auth.guard';
import { RegisterComponent } from './components/register/register.component';

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
  },
  { 
    path: 'teachers', 
    component: TeacherListComponent,
    canActivate: [teacherGuard]
  },
  {
    path: 'register',
    component: RegisterComponent
  }
];
