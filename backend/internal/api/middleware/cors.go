package middlewares

import (
	"net/http"
	"os"
	"strings"
)

var defaultAllowedOrigins = []string{
	"http://localhost:5173",
}

func Cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		origin := r.Header.Get("Origin")

		if origin != "" && isOriginAllowed(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Expose-Headers", "Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Max-Age", "3600")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func isOriginAllowed(origin string) bool {
	for _, allowedOrigin := range allowedOrigins() {
		if allowedOrigin == origin {
			return true
		}
	}
	return false
}

func allowedOrigins() []string {
	envOrigins := os.Getenv("CORS_ALLOWED_ORIGIN")
	if envOrigins == "" {
		// Keep compatibility with the previous plural setting.
		envOrigins = os.Getenv("CORS_ALLOWED_ORIGINS")
	}
	if envOrigins == "" {
		return defaultAllowedOrigins
	}

	origins := strings.Split(envOrigins, ",")
	for i, origin := range origins {
		origins[i] = strings.TrimSpace(origin)
	}
	return origins
}
