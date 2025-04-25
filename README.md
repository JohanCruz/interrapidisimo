
# Gestion de inventarios RIWI

La aplicacion funciona corectamente hace uso de typeOrm conectando a mysql debe tener la base de datos uni creada y habilitada para persistir la data de la aplicación propuesta

la configuración de la conexión se hace en el archivo

src\app.module.ts

se requiere tener instalado node luego desde consola dar el siguiente comando desde la carpeta reiz del proyecto

npm i

luego levantar la alicación con el comando
npm run start:dev

para interactuar, poblar, crear o borrar los datos de prueba de la aplicación se puede hacer uso del archivo de 
[documentación ](https://drive.google.com/file/d/1c-qE59XwDsXviS6NodWtff_yWHO67p_O/view?usp=sharing)

una breve descripcion de la documentación

Documentación app de gestión de inventarios RIWI

Funcionalidades adicionales realizadas: 

-> un usuario responsable se puede asignar a una bodega
desde la creación de la bodega pero sin ser obligatorio enviando el id_responsable que es el mismo id del usuario que va a ser el responsable de dicha bodega

-> los datos de prueba se pueden poblar por ruta POST http://localhost:3000/seeders
indicando los números que se desean crear de cada uno
{
    "cursos": ["Maths", "Science", "Programming", "Data Science", "Physics", "Chemistry", "Biology", "History", "Geography", "Literature"],
    "profesores": 5,
    "usuarios": 3,
    "estudiantes": 5
}



URL de la API documentada mediante postman
 https://documenter.getpostman.com/view/12905489/2s9Y5SWm3v#fe7508d8-bc9d-45f1-bb95-4ed0a8b21808


descripción endpoints de la API

POST /auth/login/student: Login para estudiantes
POST /auth/login/teacher: Login para profesores
POST /auth/check-email


POST /teachers - Crear profesor
GET /teachers - Listar profesores
GET /teachers/:id - Obtener profesor específico
PUT /teachers/:id - Actualizar profesor
DELETE /teachers/:id - Eliminar profesor
Para Subjects:
POST /subjects - Crear materia
GET /subjects - Listar materias
GET /subjects/:id - Obtener materia específica
PUT /subjects/:id - Actualizar materia
DELETE /subjects/:id - Eliminar materia

