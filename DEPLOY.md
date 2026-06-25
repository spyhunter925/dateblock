# Deploying Dateblock to a VPS (Contabo / any Linux server)

This project is fully Dockerized. You need a VPS with Docker installed and root access.

---

## 1. SSH into your VPS

```bash
ssh root@<your-vps-ip>
```

---

## 2. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
```

---

## 3. Get the project onto the server

### Option A: Git clone

```bash
git clone https://github.com/<your-username>/dateblock.git /opt/dateblock
cd /opt/dateblock
```

### Option B: SCP the folder

```bash
# From your local machine:
scp -r /home/andy/projects/eo/dateblock root@<your-vps-ip>:/opt/dateblock

# Then SSH in:
ssh root@<your-vps-ip>
cd /opt/dateblock
```

---

## 4. Configure environment

```bash
cp .env.example .env
nano .env
```

Fill in real values:

| Variable          | What to put                                      |
|-------------------|--------------------------------------------------|
| `AUTH_SECRET`     | `openssl rand -hex 32` (run this on the server)  |
| `NEXTAUTH_URL`    | `http://<your-vps-ip>:3000` (or your domain)     |
| `SMTP_*`          | Real SMTP creds, or leave as-is to skip emails   |
| `ADMIN_EMAIL`     | Your admin login email                           |
| `ADMIN_PASSWORD`  | Your admin password (min 6 chars)                |
| `ADMIN_NAME`      | Your admin display name                          |

---

## 5. Start the app

```bash
docker compose up -d --build
```

The first run applies migrations, seeds the admin user, and starts the app.

---

## 6. Open the app

```
http://<your-vps-ip>:3000
```

If nothing loads, check the firewall:

```bash
ufw allow 3000
```

---

## 7. (Optional) Add a domain with HTTPS

### 7a. Bind the app to localhost only

Edit `docker-compose.yml`:

```yaml
ports:
  - "127.0.0.1:3000:3000"   # was "3000:3000"
```

Recreate the container:

```bash
docker compose down && docker compose up -d --build
```

### 7b. Install Nginx and Certbot

```bash
apt install -y nginx certbot python3-certbot-nginx
```

### 7c. Create an Nginx config

```bash
nano /etc/nginx/sites-available/dateblock
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7d. Enable the site and get a certificate

```bash
ln -s /etc/nginx/sites-available/dateblock /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d your-domain.com
```

Your app is now live at `https://your-domain.com` with auto-renewed SSL.

---

## Updating the app

```bash
cd /opt/dateblock
git pull                    # or scp the updated files
docker compose up -d --build
```

Data (PostgreSQL) lives in a Docker volume and is preserved across updates.