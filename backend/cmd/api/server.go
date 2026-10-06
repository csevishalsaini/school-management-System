package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	mw "restapi/internal/api/middleware"
	"restapi/internal/api/router"
	"restapi/internal/repository/sqlconnect"
	"restapi/pkg/utils"

	"github.com/joho/godotenv"
)

func main() {
	// Load a developer's local .env when present; cloud platforms inject env vars.
	if err := godotenv.Load(); err != nil && !errors.Is(err, os.ErrNotExist) {
		log.Printf("could not load local .env: %v", err)
	}
	if strings.TrimSpace(os.Getenv("JWT_SECRET")) == "" {
		log.Fatal("JWT_SECRET must be set before starting the API")
	}

	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		// Keep compatibility with deployments that used API_PORT.
		port = strings.TrimSpace(os.Getenv("API_PORT"))
	}
	if port == "" {
		port = "3000"
	}
	if strings.HasPrefix(port, ":") {
		port = strings.TrimPrefix(port, ":")
	}

	mainRouter := router.MainRouter()
	jwtMiddleware := mw.MiddlewareExcludePaths(
		mw.JwtMiddleware,
		"/health",
		"/execs/login",
		"/execs/signup",
		"/execs/forgotpassword",
		"/execs/resetpassword/reset",
	)

	handler := utils.ApplyMiddlewares(
		mainRouter,
		mw.SecurityHeaders,
		mw.Compression,
		mw.XSSMiddleware,
		jwtMiddleware,
		mw.ResponseTimeMiddleware,
		mw.Cors,
	)

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	serverErrors := make(chan error, 1)
	go func() {
		log.Printf("server started on port %s", port)
		serverErrors <- server.ListenAndServe()
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	select {
	case err := <-serverErrors:
		if !errors.Is(err, http.ErrServerClosed) {
			log.Printf("server stopped: %v", err)
		}
	case sig := <-stop:
		log.Printf("received %s; shutting down", sig)
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := server.Shutdown(ctx); err != nil {
			log.Printf("graceful shutdown failed: %v", err)
			if closeErr := server.Close(); closeErr != nil {
				log.Printf("server close failed: %v", closeErr)
			}
		}
	}
	if err := sqlconnect.CloseDb(); err != nil {
		log.Printf("database pool close failed: %v", err)
	}
}
