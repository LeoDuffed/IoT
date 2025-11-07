from AlumnoRepository import AlumnoRepository

#name = input("Ingresa tu nombre: ")
#carrera = input("Ingresa el nombre de tu carrera: ")

alumno_repo = AlumnoRepository()
#alumno_repo.insert_alumno(name, carrera )
#alumnos = alumno_repo.get_alumnos()

alumno_id = int(input("Ingrese: "))
alumno = alumno_repo.get_alumno_by_id(alumno_id)
if alumno:
    print(alumno)
