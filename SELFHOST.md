# Self-Hosting Dateblock

## Quick start

1. Copy `docker-compose.yml` and `.env.example` into a directory.
2. Review `.env.example` and set values in a `.env` file.
3. Run `docker compose up --build`.
4. Open `http://localhost:3000` and sign in with the admin credentials you configured.

## Update

- Replace the public `icon-192x192.svg` and `icon-512x512.svg` files with your own.
- Update `SMTP_FROM` in `.env`.
