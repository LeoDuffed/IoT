from AlumnoRepository import AlumnoRepository

# name = input("Ingresa tu nombre: ")
# carrera = input("Ingresa el nombre de tu carrera: ")

alumno_repo = AlumnoRepository()
# alumno_repo.insert_alumno(name, carrera)
# alumnos = alumno_repo.get_alumnos()

print("Actualizar carrera de un alumno por id")
alumno_id = int(input("Ingresa el id del alumno: "))
nueva_carrera = input("Ingresa la nueva carrera: ")

actualizado = alumno_repo.update_alumno_carrera_by_id(alumno_id, nueva_carrera)
if actualizado:
    print("Carrera actualizada correctamente.")
    alumno = alumno_repo.get_alumno_by_id(alumno_id)
    if alumno:
        print("Alumno actualizado:", alumno)
else:
    print("No se actualizó ninguna fila. Verifica el id.")
