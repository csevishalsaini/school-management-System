package middlewares

import (
	"net/http"
	"restapi/pkg/utils"
)

func RequireRoles(allowedRoles ...string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			role, ok := r.Context().Value(utils.ContextKey("role")).(string)
			if !ok || role == "" {
				http.Error(w, "role not found in context", http.StatusUnauthorized)
				return
			}

			if _, err := utils.AuthorizeUser(role, allowedRoles...); err != nil {
				http.Error(w, err.Error(), http.StatusForbidden)
				return
			}

			next(w, r)
		}
	}
}
