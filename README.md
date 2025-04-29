
# Gestion de materias INTERAPIDISIMO

La aplicacion funciona corectamente hace uso de typeOrm conectando a mysql debe tener la base de datos llamada uni creada y habilitada para persistir la data de la aplicación propuesta, el schema, las relaciones y tablas se crean apenas se ejecuta el backend

la configuración de la conexión se hace en el archivo

src/typeorm/data-source.ts

se puede agregar un .env
DB_TYPE==mysql
DB_PORT=3306
process.env.DB_USER=root
DB_PASSWORD=
DB_NAME=uni

se requiere tener instalado node luego desde consola dar el siguiente comando desde la carpeta reiz del proyecto

npm i

luego levantar la alicación con el comando
npm run start:dev

para interactuar, poblar, crear o borrar los datos de prueba "seeders" de la aplicación se puede hacer uso de la ruta  http://localhost:3000/api/seeders por método POST


[documentación ](https://docs.google.com/document/d/1MuU0so2PweCxYx0mYAnwmEbynoKC96YNq425AeOwbeU/edit?usp=sharing)

una breve descripcion de la documentación

Documentación app de gestión de materias INTERAPIDISIMO

Funcionalidades adicionales realizadas: 

-> un profesor se logea y puede gestionar la creación o borrado de clase, asignar las clases a los profesores, la aplicación cuenta con usabilidad UX pare evitar errores

-> los datos de prueba se pueden poblar por ruta POST http://localhost:3000/api/seeders
indicando los números que se desean crear de cada uno
{
    "cursos": ["Maths", "Science", "Programming", "Data Science", "Physics", "Chemistry", "Biology", "History", "Geography", "Literature"],
    "profesores": 5,
    "usuarios": 3,
    "estudiantes": 5
}



URL de la API documentada mediante postman
 https://app.getpostman.com/join-team?invite_code=8e0994319b2fa66ff559e18aefae8eee8043bf73a6d499eba7f4b6f7dc7f9dc4&target_code=1b8ebd02b83be56a759ef69d0d7c920c


para iniciar el servidor frontend es necesario 
cd client
ng serve
para levantar angular


para hacer test rapido de todos los end points

post http://localhost:3000/api/seeders/test

body json 
{
    "count": 5
}

recibe 
{
    "message": "Pruebas completadas exitosamente y datos limpiados",
    "data": {
        "users": 5,
        "teachers": 3,
        "students": 2,
        "subjects": 5
    },
    "testResults": [
        {
            "endpoint": "GET /api/teachers/:id",
            "status": "ÉXITO",
            "details": "Profesor encontrado correctamente"
        },
        {
            "endpoint": "PUT /api/teachers/:id",
            "status": "ÉXITO",
            "details": "Profesor actualizado correctamente"
        },
        {
            "endpoint": "GET /api/teachers/:id/subjects",
            "status": "ÉXITO",
            "details": "Materias del profesor obtenidas correctamente"
        },
        {
            "endpoint": "GET /api/students/:id",
            "status": "ÉXITO",
            "details": "Estudiante encontrado correctamente"
        },
        {
            "endpoint": "GET /api/students/:id/subjects",
            "status": "ÉXITO",
            "details": "Materias del estudiante obtenidas correctamente"
        },
        {
            "endpoint": "GET /api/subjects/:id",
            "status": "ÉXITO",
            "details": "Materia encontrada correctamente"
        },
        {
            "endpoint": "PUT /api/subjects/:id",
            "status": "ÉXITO",
            "details": "Materia actualizada correctamente"
        },
        {
            "endpoint": "GET /api/subjects/:id/stats",
            "status": "ÉXITO",
            "details": "Estadísticas de la materia obtenidas correctamente"
        },
        {
            "endpoint": "GET /api/subjects/available",
            "status": "ÉXITO",
            "details": "Materias disponibles obtenidas correctamente"
        },
        {
            "endpoint": "POST /api/students/:id/subjects/:subjectId/enroll",
            "status": "ÉXITO",
            "details": "Inscripción exitosa"
        },
        {
            "endpoint": "POST /api/students/:id/subjects/:subjectId/drop",
            "status": "ÉXITO",
            "details": "Inscripción cancelada exitosamente"
        },
        {
            "endpoint": "DELETE /api/teachers/:id",
            "status": "ÉXITO",
            "details": "Profesor eliminado correctamente"
        },
        {
            "endpoint": "DELETE /api/subjects/:id",
            "status": "ÉXITO",
            "details": "Materia eliminada correctamente"
        },
        {
            "endpoint": "DELETE /api/students/:id",
            "status": "ÉXITO",
            "details": "Estudiante eliminado correctamente"
        }
    ]
}