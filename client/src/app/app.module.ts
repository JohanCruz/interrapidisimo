import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http'; // Añadir esta importación
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SubjectListComponent } from './components/subjects/subject-list/subject-list.component';
import { TeacherListComponent } from './components/teachers/teacher-list/teacher-list.component';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms'; // También añadir esta si usas formularios reactivos

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    SubjectListComponent,
    TeacherListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    HttpClientModule,     // Añadir esto
    ReactiveFormsModule   // Y esto si usas formularios reactivos
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }