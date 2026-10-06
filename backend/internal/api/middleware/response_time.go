package middlewares

import (
	"log"
	"net/http"
	"time"
)

func ResponseTimeMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		wrappedWriter := &responseWriter{ResponseWriter: w, code: http.StatusOK}
		w.Header().Set("X-Response-Time", time.Since(start).String())
		next.ServeHTTP(wrappedWriter, r)

		duration := time.Since(start)
		log.Printf("http request method=%s status=%d duration=%s", r.Method, wrappedWriter.code, duration)
	})
}

type responseWriter struct {
	http.ResponseWriter
	code int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.code = code
	rw.ResponseWriter.WriteHeader(code)
}
