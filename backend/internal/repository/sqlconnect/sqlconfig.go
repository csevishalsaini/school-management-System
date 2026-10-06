package sqlconnect

import (
	"database/sql"
	"errors"
	"net"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/go-sql-driver/mysql"
)

var (
	dbOnce sync.Once
	dbPool *sql.DB
	dbErr  error
)

// ConnectDb returns the process-wide MySQL pool. Credentials are only read
// from the environment and are never included in returned errors.
func ConnectDb() (*sql.DB, error) {
	dbOnce.Do(func() {
		dbName := os.Getenv("DB_NAME")
		user := os.Getenv("DB_USER")
		password := os.Getenv("DB_PASSWORD")
		host := os.Getenv("DB_HOST")
		if host == "" { // retain compatibility with the former HOST setting
			host = os.Getenv("HOST")
		}
		port := os.Getenv("DB_PORT")
		if port == "" {
			port = "3306"
		}
		if dbName == "" || user == "" || host == "" {
			dbErr = errors.New("database configuration is incomplete")
			return
		}
		portNumber, err := strconv.Atoi(port)
		if err != nil || portNumber < 1 || portNumber > 65535 {
			dbErr = errors.New("DB_PORT must be a valid TCP port")
			return
		}

		config := mysql.Config{
			User:      user,
			Passwd:    password,
			Net:       "tcp",
			Addr:      net.JoinHostPort(host, port),
			DBName:    dbName,
			ParseTime: true,
		}
		dbPool, dbErr = sql.Open("mysql", config.FormatDSN())
		if dbErr != nil {
			dbErr = errors.New("could not configure database connection")
			return
		}
		dbPool.SetMaxOpenConns(25)
		dbPool.SetMaxIdleConns(5)
		dbPool.SetConnMaxLifetime(5 * time.Minute)
	})
	return dbPool, dbErr
}

// CloseDb releases the shared connection pool during process shutdown.
func CloseDb() error {
	if dbPool == nil {
		return nil
	}
	return dbPool.Close()
}
