package router

import (
	"net/http"
	"restapi/internal/api/handlers"
	mw "restapi/internal/api/middleware"
)

func execsRouter() *http.ServeMux {
	mux := http.NewServeMux()
	readExecs := mw.RequireRoles("manager", "admin")
	writeExecs := mw.RequireRoles("admin")
	changePassword := mw.RequireRoles("student", "teacher", "exec", "manager", "admin")

	mux.HandleFunc("GET /execs/", readExecs(handlers.GetExecsHandler))
	mux.HandleFunc("POST /execs", writeExecs(handlers.AddExecsHandler))
	mux.HandleFunc("PATCH /execs", writeExecs(handlers.PatchExecsHandler))
	mux.HandleFunc("POST /execs/signup", handlers.AddExecsHandler)

	mux.HandleFunc("GET /execs/{id}", readExecs(handlers.GetOneExecHandler))
	mux.HandleFunc("PATCH /execs/{id}", writeExecs(handlers.PatchOneExecsHandler))
	mux.HandleFunc("DELETE /execs/{id}", writeExecs(handlers.DeleteOneExecHandler))
	mux.HandleFunc("POST /execs/{id}/updatepassword", changePassword(handlers.UpdatePasswordHandler))

	mux.HandleFunc("POST /execs/login", handlers.LoginHandler)
	mux.HandleFunc("POST /execs/logout", handlers.LogOutHandler)
	mux.HandleFunc("POST /execs/forgotpassword", handlers.ForgotPasswordHandler)
	mux.HandleFunc("POST /execs/resetpassword/reset/{resetcode}", handlers.ResetPasswordHandler)

	return mux
}
