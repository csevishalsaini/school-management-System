package router

import (
	"encoding/json"
	"net/http"
)

func MainRouter() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	mux.Handle("/students/", studentRouter())
	mux.Handle("/teachers/", teacherRouter())
	mux.Handle("/execs/", execsRouter())
	return mux

}
