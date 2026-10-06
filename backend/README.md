# REST API

Go REST API for the student management frontend. The React/Vite frontend is maintained in the adjacent `frontend` folder and deployed separately.

## Local Development

From the backend repository root:

```sh
cp .env.example .env
```

Set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` for a MySQL database you can reach. Set `JWT_SECRET` to a long random value. The example file contains placeholders only. Install/use a local MySQL server if you do not have a remote development database.

Install dependencies and run the API:

```sh
go mod tidy
go run ./cmd/api
```

The API listens on `PORT`, defaulting to `3000`. `GET /health` returns `{"status":"ok"}` and does not require authentication or a database connection.

The frontend dev server runs from `../frontend` with `npm install && npm run dev`. Its API URL can be set with `VITE_API_URL`; the local default is `http://localhost:3000`.

## Production environment

Set these in the hosting platform's environment settings:

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | Platform supplied | HTTP listen port; defaults to `3000` locally. |
| `DB_HOST` | Yes | Managed MySQL hostname. Legacy `HOST` is also accepted. |
| `DB_PORT` | Recommended | MySQL TCP port; defaults to `3306`. |
| `DB_USER` | Yes | MySQL account. |
| `DB_PASSWORD` | Yes when configured | MySQL account password. |
| `DB_NAME` | Yes | Database name. |
| `JWT_SECRET` | Yes | Secret used to sign and validate JWTs. No default is provided. |
| `CORS_ALLOWED_ORIGIN` | Yes for browser clients | Deployed frontend origin, including scheme (for example `https://app.example.com`). Multiple exact origins may be comma-separated. |
| `FRONTEND_URL` | Yes for password reset | Deployed frontend base URL. |
| `APP_ENV` | Recommended | Set to `production` to disable local password-reset link fallback. |
| `JWT_EXPIRES_IN` | Optional | JWT lifetime accepted by Go `time.ParseDuration`, default `50m`. |
| `RESET_TOKEN_EXP_DURATION` | Optional | Password reset token lifetime in minutes, default `10`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` | For password reset email | Outbound SMTP endpoint and sender. |
| `SMTP_USERNAME`, `SMTP_PASSWORD` | If SMTP requires authentication | SMTP credentials. |

Use a high-entropy JWT secret and managed secrets in the cloud dashboard. Never commit `.env` files, private keys, database passwords, SMTP credentials, or production URLs containing secrets.

## Deployment

Deploy the Go backend and React frontend as separate services. Provision a managed remote MySQL database and allow the backend service to connect to it. Set the backend environment variables above, with the exact deployed frontend origin in `CORS_ALLOWED_ORIGIN` and its base URL in `FRONTEND_URL`. In Vercel, set `VITE_API_URL` to the backend's public URL and redeploy the frontend.

Build and run the container from the backend repository root:

```sh
docker build -t restapi .
docker run --rm -p 3000:3000 --env-file .env -e PORT=3000 restapi
```

For Render, the included `render.yaml` creates a Docker web service and health check. Connect the backend repository, let Render build `./Dockerfile`, then fill in the variables marked `sync: false` in the service dashboard. Provide a managed MySQL endpoint and credentials there. The platform supplies `PORT` and terminates public HTTPS; the Go process serves HTTP inside the container. Railway can use the same Dockerfile: create a service from the backend repository, set the required environment variables, and use `/health` for its health check.

The backend repository does not contain the frontend source as a tracked project. Deploy `../frontend` from its own repository or configure the frontend hosting project to use that directory. The managed MySQL instance must be provisioned separately; this repository does not create or migrate database tables.
