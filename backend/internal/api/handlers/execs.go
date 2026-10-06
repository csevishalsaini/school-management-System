package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"restapi/internal/models"
	"restapi/internal/repository/sqlconnect"
	"restapi/pkg/utils"
	"strconv"
	"time"
)

func GetExecsHandler(w http.ResponseWriter, r *http.Request) {
	// studentList := make([]models.Student, 0)
	// firstName := r.URL.Query().Get("first_name")
	// lastName := r.URL.Query().Get("last_name")

	page, limit := utils.GetPaginationParam(r)
	var execs []models.Exec
	execs, err, totalExecs := sqlconnect.GetExecsDbOperation(execs, r, page, limit)
	// if shouldReturn {
	// 	return
	// }

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	response := struct {
		Status string        `json:"status"`
		Count  int           `json:"count"`
		Page   int           `json:"page"`
		Limit  int           `json:"limit"`
		Data   []models.Exec `json:"data"`
	}{
		Status: "success",
		Count:  totalExecs,
		Page:   page,
		Limit:  limit,
		Data:   execs,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

}

func GetOneExecHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)

	if err != nil {
		http.Error(w, "Invalid Id", http.StatusBadRequest)
		return
	}

	exec, err := sqlconnect.GetExecById(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "Application/json")
	json.NewEncoder(w).Encode(exec)

}
func AddExecsHandler(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request", http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	fields := GetFieldsName(models.Exec{})
	allowedField := make(map[string]struct{})
	for _, field := range fields {
		allowedField[field] = struct{}{}
	}

	var rawExecs []map[string]interface{}
	if err := json.Unmarshal(body, &rawExecs); err != nil {
		var rawExec map[string]interface{}
		if err := json.Unmarshal(body, &rawExec); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		rawExecs = []map[string]interface{}{rawExec}
	}

	for _, exec := range rawExecs {
		for key := range exec {
			if _, ok := allowedField[key]; !ok {
				http.Error(w, "Unacceptable field found in request. Only use allowed fields.", http.StatusBadRequest)
				return
			}
		}
	}

	var newExecs []models.Exec
	if err := json.Unmarshal(body, &newExecs); err != nil {
		var newExec models.Exec
		if err := json.Unmarshal(body, &newExec); err != nil {
			http.Error(w, "Failed to parse exec data", http.StatusBadRequest)
			return
		}
		newExecs = []models.Exec{newExec}
	}

	for _, exec := range newExecs {
		if err := CheckBlankField(exec); err != nil {
			http.Error(w, "Incorrect field error, Check your field", http.StatusBadRequest)
			return
		}
		if r.URL.Path == "/execs/signup" && !isPublicSignupRole(exec.Role) {
			http.Error(w, "role not allowed for public signup", http.StatusForbidden)
			return
		}
	}

	addedExecs, err := sqlconnect.AddExecsDBHandler(newExecs)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	response := struct {
		Status string        `json:"status"`
		Count  int           `json:"count"`
		Data   []models.Exec `json:"data"`
	}{
		Status: "success",
		Count:  len(addedExecs),
		Data:   addedExecs,
	}
	json.NewEncoder(w).Encode(&response)
}

func isPublicSignupRole(role string) bool {
	return role == "student" || role == "teacher" || role == "exec" || role == "admin"
}

func PatchExecsHandler(w http.ResponseWriter, r *http.Request) {

	var updates []map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err := sqlconnect.PatchExecs(updates)
	if err != nil {
		http.Error(w, "Error to connect with database ", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func PatchOneExecsHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)

	if err != nil {
		http.Error(w, "Invalid exec id", http.StatusBadRequest)
		return
	}
	updated := make(map[string]interface{})
	err = json.NewDecoder(r.Body).Decode(&updated)
	if err != nil {
		http.Error(w, "Invalid payload request", http.StatusInternalServerError)
		return
	}

	existingExec, err := sqlconnect.PatchOneExec(id, updated)

	if err != nil {

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(existingExec)
}

func DeleteOneExecHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)

	if err != nil {
		http.Error(w, "Invalid exec id", http.StatusBadRequest)
		return
	}

	err = sqlconnect.DeleteOneExec(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	response := struct {
		Status string `json:"status"`
		Id     int    `json:"id"`
	}{
		Status: "Exec successfully deleted ",
		Id:     id,
	}
	json.NewEncoder(w).Encode(response)

}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var req models.Exec
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Username == "" || req.Password == "" {
		http.Error(w, "username and password are required ", http.StatusBadRequest)
		return
	}

	user, err := sqlconnect.GetUserByUserName(req.Username)
	if err != nil {
		http.Error(w, "Invalid username or password ", http.StatusForbidden)
		return
	}

	if user.InactiveStatus {
		http.Error(w, "Account is incative", http.StatusForbidden)
		return
	}

	err = utils.VerifyPassword(req.Password, user.Password)
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	tokenString, err := utils.SignToken(user.ID, req.Username, user.Role)

	if err != nil {
		http.Error(w, "Could not create login token ", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "Bearer",
		Value:    tokenString,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		Expires:  time.Now().Add(24 * time.Hour),
		SameSite: http.SameSiteNoneMode,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "test",
		Value:    "testing",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		Expires:  time.Now().Add(24 * time.Hour),
		SameSite: http.SameSiteNoneMode,
	})

	response := struct {
		Token string `json:"token"`
	}{
		Token: tokenString,
	}

	json.NewEncoder(w).Encode(response)
}

func LogOutHandler(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "Bearer",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		Expires:  time.Unix(0, 0),
		SameSite: http.SameSiteStrictMode,
	})
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{message: "Logged out Succesfully"}`))
}

func UpdatePasswordHandler(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	userId, err := strconv.Atoi(id)
	if err != nil {
		http.Error(w, "Invalid exec ID", http.StatusBadRequest)
		return
	}

	requesterRole, _ := r.Context().Value(utils.ContextKey("role")).(string)
	requesterID, ok := contextUserID(r)
	if !ok {
		http.Error(w, "user not found in context", http.StatusUnauthorized)
		return
	}
	if requesterRole != "admin" && requesterID != userId {
		http.Error(w, "user not allowed", http.StatusForbidden)
		return
	}

	var req models.UpdatePasswordRequest
	err = json.NewDecoder(r.Body).Decode(&req)

	if err != nil {
		http.Error(w, "Invalid Request", http.StatusBadRequest)
		return
	}
	r.Body.Close()

	if req.CurrentPassword == "" || req.NewPassword == "" {
		http.Error(w, "Please enter password ", http.StatusBadRequest)
		return
	}

	token, err := sqlconnect.UpdatePasswordInDb(userId, w, req)
	if err != nil {
		http.Error(w, "Error updating password", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "Bearer",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		Expires:  time.Now().Add(24 * time.Hour),
		SameSite: http.SameSiteStrictMode,
	})

	w.Header().Set("content-Type", "application/json")

	response := struct {
		Message string `json:"message"`
	}{
		Message: "Password updated succesfully",
	}
	json.NewEncoder(w).Encode(response)

}

func contextUserID(r *http.Request) (int, bool) {
	switch id := r.Context().Value(utils.ContextKey("userId")).(type) {
	case int:
		return id, true
	case float64:
		return int(id), true
	case json.Number:
		userID, err := id.Int64()
		return int(userID), err == nil
	default:
		return 0, false
	}
}

func ForgotPasswordHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	err := json.NewDecoder(r.Body).Decode(&req)

	if err != nil {
		http.Error(w, "Invalid request body ", http.StatusBadRequest)
		return
	}
	r.Body.Close()
	if req.Email == "" {
		utils.ErrorHandler(fmt.Errorf("email field empty"), "Please enter email")
		return
	}
	err = sqlconnect.ForgotPasswordDbHandler(req.Email)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	fmt.Fprintf(w, "password reset link sent to %s successfully", req.Email)

}

func ResetPasswordHandler(w http.ResponseWriter, r *http.Request) {
	token := r.PathValue("resetcode")

	var req models.Request
	err := json.NewDecoder(r.Body).Decode(&req)

	if err != nil {
		http.Error(w, "Invalid values in request ", http.StatusBadRequest)
		return
	}

	if req.NewPassword == "" || req.ConfirmPassword == "" {
		http.Error(w, "password should not empty", http.StatusBadRequest)
		return
	}

	if req.NewPassword != req.ConfirmPassword {
		http.Error(w, "Password should match", http.StatusBadRequest)
		return
	}

	bytes, err := hex.DecodeString(token)

	if err != nil {
		http.Error(w, "Internal Error", http.StatusInternalServerError)
		return
	}

	hashedToken := sha256.Sum256(bytes)
	hashedTokenString := hex.EncodeToString(hashedToken[:])

	err = sqlconnect.ResetPasswordDbHandler(hashedTokenString, req)
	if err != nil {
		http.Error(w, "Internal Error", http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "password reset sucessfully")

}
