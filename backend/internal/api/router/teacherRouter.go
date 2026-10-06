package router

import (
	"net/http"
	"restapi/internal/api/handlers"
	mw "restapi/internal/api/middleware"
)

func teacherRouter() *http.ServeMux {
	mux := http.NewServeMux()
	readTeachers := mw.RequireRoles("student", "teacher", "exec", "manager", "admin")
	writeTeachers := mw.RequireRoles("manager", "admin")

	mux.HandleFunc("GET /teachers/", readTeachers(handlers.GetTeachersHandler))
	mux.HandleFunc("POST /teachers", writeTeachers(handlers.AddTeachersHandler))
	mux.HandleFunc("PATCH /teachers", writeTeachers(handlers.PatchTeachersHandler))
	mux.HandleFunc("DELETE /teachers", writeTeachers(handlers.DeleteTeachersHandler))

	mux.HandleFunc("GET /teachers/{id}", readTeachers(handlers.GetOneTeacherHandler))
	mux.HandleFunc("PUT /teachers/{id}", writeTeachers(handlers.UpdateTeachersHandler))
	mux.HandleFunc("PATCH /teachers/{id}", writeTeachers(handlers.PatchOneTeachersHandler))
	mux.HandleFunc("DELETE /teachers/{id}", writeTeachers(handlers.DeleteOneTeacherHandler))

	mux.HandleFunc("GET /teachers/{id}/students", readTeachers(handlers.GetStudentByTeacherId))
	mux.HandleFunc("GET /teachers/{id}/studentcount", readTeachers(handlers.GetStudentCountByTeacherId))
	return mux
}
