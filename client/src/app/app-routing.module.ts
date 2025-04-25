import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SubjectListComponent } from './components/subjects/subject-list/subject-list.component';
import { TeacherListComponent } from './components/teachers/teacher-list/teacher-list.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { authGuard, teacherGuard } from './guards/auth.guard';
import { StudentSubjectsComponent } from './components/subjects/student-subjects/student-subjects.component';

// Exportamos las rutas
export const routes: Routes = [
  { path: '', redirectTo: '/subjects', pathMatch: 'full' },
  { 
    path: 'subjects', 
    component: SubjectListComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'teachers', 
    component: TeacherListComponent,
    canActivate: [teacherGuard]
  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }