package router

import (
	"net/http"
	"restapi/internal/api/handlers"
	mw "restapi/internal/api/middleware"
)

func studentRouter() *http.ServeMux {
	mux := http.NewServeMux()
	readStudents := mw.RequireRoles("student", "teacher", "exec", "manager", "admin")
	writeStudents := mw.RequireRoles("manager", "admin")

	mux.HandleFunc("GET /students/", readStudents(handlers.GetStudentsHandler))
	mux.HandleFunc("POST /students", writeStudents(handlers.AddStudentsHandler))
	mux.HandleFunc("PATCH /students", writeStudents(handlers.PatchStudentsHandler))
	mux.HandleFunc("DELETE /students", writeStudents(handlers.DeleteStudentsHandler))

	mux.HandleFunc("GET /students/{id}", readStudents(handlers.GetOneStudentHandler))
	mux.HandleFunc("PUT /students/{id}", writeStudents(handlers.UpdateStudentsHandler))
	mux.HandleFunc("PATCH /students/{id}", writeStudents(handlers.PatchOneStudentsHandler))
	mux.HandleFunc("DELETE /students/{id}", writeStudents(handlers.DeleteOneStudentHandler))
	return mux

}
