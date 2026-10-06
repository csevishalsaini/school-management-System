package main

import (
	"embed"
	"fmt"
	"log"
	"net/http"
	"os"
	mw "restapi/internal/api/middleware"
	"restapi/internal/api/router"
	"restapi/pkg/utils"

	"github.com/joho/godotenv"
)

//go:embed .env
var envFile embed.FS

func loadEnvFromEmbeddedFile() {
	content, err := envFile.ReadFile(".env")
	if err != nil {
		log.Fatal("Error reading embedded env file:", err)
	}

	tempFile, err := os.CreateTemp("", ".env")
	if err != nil {
		log.Fatal("Error creating temp file:", err)
	}

	defer os.Remove(tempFile.Name())

	_, err = tempFile.Write(content)
	if err != nil {
		log.Fatal("Error writing to temp file:", err)
	}

	err = tempFile.Close()
	if err != nil {
		log.Fatal("Error closing temp file:", err)
	}

	err = godotenv.Load(tempFile.Name())
	if err != nil {
		log.Fatal("Error loading .env file:", err)
	}
}

func main() {

	loadEnvFromEmbeddedFile()



	port := os.Getenv("API_PORT")
if port == "" {
    port = "3000"
}

	// r1 := mw.NewRateLimiter(5, time.Minute)

	// hppOptions := mw.HPPOptions{
	// 	CheckQuery:                  true,
	// 	CheckBody:                   true,
	// 	CheckBodyOnlyForContentType: "application/x-www-form-urlencoded",
	// 	Whitelist:                   []string{"name", "sortby", "sortorder"},
	// }

	mainRouter := router.MainRouter()

	jwtMiddleware := mw.MiddlewareExcludePaths(
		mw.JwtMiddleware,
		"/execs/login",
		"/execs/signup",
		"/execs/forgotpassword",
		"/execs/resetpassword/reset",
	)

securemux := utils.ApplyMiddlewares(
	mainRouter,
	mw.SecurityHeaders,
	mw.Compression,
	mw.XSSMiddleware,
	jwtMiddleware,
	mw.ResponseTimeMiddleware,
	mw.Cors, 
)

	server := &http.Server{
		Addr:    port,
		Handler: securemux,
	}

	fmt.Println("Server is running on port", port)

	err := server.ListenAndServe()
	if err != nil {
		log.Fatal("Error starting the server:", err)
	}
}
