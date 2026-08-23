# InferForge API Deployment Guide

## Quick Deploy Options

### 1. Railway (Recommended)

```bash
railway login
railway init
railway up
```

Railway will auto-detect Python and deploy.

**Environment Variables:**
```
INFERFORGE_ENV=production
PORT=11435
```

### 2. Render

Push `deploy/render.yaml` and connect your repo at render.com

### 3. Docker

```bash
cd deploy
docker-compose up -d
```

API runs on `http://localhost:11435`

### 4. VPS/Bare Metal

```bash
pip install -e .
pip install uvicorn gunicorn

gunicorn inferforge.server.api:app \
  --bind 0.0.0.0:11435 \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --access-logfile - \
  --error-logfile -
```

### 5. Nginx Reverse Proxy

Copy `deploy/nginx.conf` to `/etc/nginx/sites-available/inferforge`

```bash
sudo ln -s /etc/nginx/sites-available/inferforge /etc/nginx/sites-enabled/
sudo certbot --nginx -d hyperneural.cfd
sudo systemctl restart nginx
```

## API Keys

Generate API keys:

```bash
forge api-key create
```

Use keys in requests:

```bash
curl -H "Authorization: Bearer sk-xxxxx" \
  https://hyperneural.cfd/api/v1/models
```

## Environment Variables

- `INFERFORGE_ENV`: Set to `production` for production
- `PORT`: API port (default: 11435)
- `HOST`: API host (default: 0.0.0.0)
- `WORKERS`: Number of worker processes (default: 4)

## Health Checks

```bash
curl https://hyperneural.cfd/health
```

Returns: `{"status": "ok", "version": "0.6.0"}`

## Rate Limits

Default: 60 requests/minute per IP

Configure in `src/inferforge/server/auth.py`:

```python
_rate_limiter = RateLimiter(requests_per_minute=120, burst=20)
```

## SSL/TLS

Use Let's Encrypt with certbot:

```bash
sudo certbot --nginx -d hyperneural.cfd
```

Auto-renewal:

```bash
sudo certbot renew --dry-run
```

## Monitoring

Health check endpoint: `/health`

Setup monitoring with:
- UptimeRobot
- Better Uptime
- Datadog
- New Relic

## Scaling

For high traffic:

1. Increase workers: `--workers 8`
2. Use Redis for rate limiting
3. Add load balancer (nginx)
4. Deploy multiple regions

## Costs

- Railway: $5/month (Starter)
- Render: $7/month (Starter)
- VPS: $5-20/month (DigitalOcean, Linode)
- Vercel: Free tier available

## Security Checklist

- [ ] API keys enabled
- [ ] Rate limiting active
- [ ] HTTPS/SSL configured
- [ ] CORS properly configured
- [ ] Firewall rules set
- [ ] Regular backups
- [ ] Log monitoring

## Support

Issues: https://github.com/inferforge/inferforge/issues
Discord: https://discord.gg/inferforge
