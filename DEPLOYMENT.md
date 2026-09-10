# Production Deployment Guide

Deploy GameAI Automation to production using Netlify, Vercel, or self-hosted solutions.

## Deployment Options

### 1. Netlify (Recommended)

Netlify provides integrated hosting with automatic builds and deployments.

#### Setup Steps

1. **Connect Repository**
   - Go to https://app.netlify.com/start
   - Select your Git provider (GitHub, GitLab, Bitbucket)
   - Authorize and select repository

2. **Configure Build**
   - Build command: `npm run build`
   - Publish directory: `dist/spa`
   - Environment variables: Set as needed

3. **Environment Variables**

   ```
   OLLAMA_ENDPOINT=https://remote.quantumpass.io/ollama/api/chat
   OLLAMA_MODEL=qwen2.5vl:7b
   ```

4. **Deploy**
   - Netlify automatically builds and deploys on push
   - View deployment at `https://yoursite.netlify.app`

#### Server Functions (Optional)

For backend API hosting on Netlify:

1. Create `netlify/functions/api.ts` (already scaffolded)
2. Deploy as serverless functions
3. Update API endpoints in frontend

#### Limitations

- **Python Service**: Cannot run Python directly on Netlify Functions
- **Solution Options**:
  - Run Python service locally and connect via API
  - Use Docker container on Netlify
  - Migrate to Node.js/JavaScript implementation

### 2. Vercel

Vercel is optimized for Next.js but supports any Node.js app.

#### Setup Steps

1. **Import Project**
   - Go to https://vercel.com/new
   - Import from Git provider
   - Select repository

2. **Configure**
   - Framework: Other
   - Build: `npm run build`
   - Output: `dist/spa`

3. **Environment Variables**
   - Add same variables as Netlify
   - Available to all deployments

4. **Deploy**
   - Automatic deployments on push
   - Preview URLs for each pull request

#### API Routes

Create `api/` endpoints for serverless functions:

```typescript
// api/capture.ts
import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Capture screen or call Python service
  res.json({ success: true });
}
```

### 3. Self-Hosted (Docker)

For maximum control, self-host using Docker.

#### Docker Setup

1. **Create Dockerfile**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install Python for automation
RUN apk add --no-cache python3 py3-pip xvfb

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# Install Python dependencies
COPY python-service ./python-service
RUN pip install -r python-service/requirements.txt

# Copy source code
COPY . .

# Build
RUN pnpm build

# Expose port
EXPOSE 3000

# Start services
CMD ["sh", "-c", "pnpm start"]
```

2. **Build Image**

```bash
docker build -t gameai-automation .
```

3. **Run Container**

```bash
docker run -it -p 3000:3000 \
  -e OLLAMA_ENDPOINT=https://remote.quantumpass.io/ollama/api/chat \
  gameai-automation
```

4. **Docker Compose** (Optional)

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      OLLAMA_ENDPOINT: https://remote.quantumpass.io/ollama/api/chat
    volumes:
      - ./python-service:/app/python-service

  # Optional: Ollama service
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0:11434

volumes:
  ollama_data:
```

#### Deploy to Cloud Platforms

**AWS EC2:**

```bash
# Connect to instance
ssh -i key.pem ec2-user@instance-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh

# Run container
docker run -d -p 80:3000 gameai-automation
```

**Google Cloud Run:**

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/gameai-automation

# Deploy
gcloud run deploy gameai-automation \
  --image gcr.io/PROJECT_ID/gameai-automation \
  --platform managed \
  --region us-central1
```

**DigitalOcean App Platform:**

1. Push image to Docker Hub
2. Connect GitHub repository
3. Configure environment variables
4. Deploy

## Web App Deployment (Frontend Only)

If deploying just the web interface:

### Build for Production

```bash
npm run build:client
```

### Upload to CDN

- Files in `dist/spa/` can be uploaded to any static host
- S3 + CloudFront
- GitHub Pages
- Cloudflare Pages
- Azure Static Web Apps

### Environment Configuration

For production API endpoints, update `client/pages/Dashboard.tsx`:

```typescript
const API_BASE = process.env.REACT_APP_API_URL || "https://api.yourdomain.com";

const response = await fetch(`${API_BASE}/api/capture-screen`);
```

Build with environment variable:

```bash
REACT_APP_API_URL=https://api.yourdomain.com npm run build:client
```

## Python Service Deployment

### Option 1: Separate Python Server

Run Python service on dedicated machine:

```bash
# Start Python service
python3 python-service/capture.py &

# Flask wrapper for HTTP access
pip install flask
python3 -c "
from flask import Flask, jsonify
from automation import capture_screen_primary
app = Flask(__name__)

@app.route('/capture')
def capture():
    return jsonify({'image': capture_screen_primary()})

app.run(host='0.0.0.0', port=5000)
"
```

Update API endpoints in web app:

```typescript
const PYTHON_SERVICE_URL = "https://python-service.yourdomain.com";
```

### Option 2: Hybrid Deployment

- Web app on Netlify/Vercel
- Python service on separate server
- Communication via HTTPS REST API

### Option 3: All-in-One Docker

Single Docker image with everything:

```dockerfile
# See self-hosted section above
```

## Performance Optimization

### Frontend Optimization

```bash
# Build analysis
npm install -D vite-plugin-visualizer
npm run build -- --analyze

# Minimize bundle size
pnpm add tailwindcss-purge
```

### Backend Optimization

1. **Enable Compression**

```typescript
import compression from "compression";
app.use(compression());
```

2. **Cache Strategies**

```typescript
app.use(
  express.static("dist/spa", {
    maxAge: "1d",
    etag: false,
  }),
);
```

3. **Load Balancing**

- Nginx reverse proxy
- AWS ALB
- Cloudflare load balancing

## Security Considerations

### Environment Variables

Never commit secrets. Use platform-specific secret management:

- **Netlify**: Site Settings → Build & deploy → Environment
- **Vercel**: Settings → Environment Variables
- **Docker**: Use secrets or .env files (not in image)

### HTTPS/SSL

- Netlify: Automatic SSL
- Vercel: Automatic SSL
- Self-hosted: Use Let's Encrypt with Certbot

### API Security

```typescript
// Add authentication
import jwt from "jsonwebtoken";

app.post("/api/capture-screen", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  // Verify token and proceed
  // ...
});
```

### Rate Limiting

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/api/", limiter);
```

## Monitoring & Logging

### Application Monitoring

- **Sentry**: Error tracking and monitoring
- **New Relic**: Performance monitoring
- **Datadog**: Comprehensive observability

### Log Aggregation

- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Splunk**: Enterprise logging platform
- **CloudWatch**: AWS native logging

## Scaling

As usage grows:

1. **Database**: Add persistent storage (PostgreSQL, MongoDB)
2. **Caching**: Redis for session and data caching
3. **Message Queue**: RabbitMQ or AWS SQS for async tasks
4. **Microservices**: Break into separate services
5. **CDN**: Distribute static assets globally

## Continuous Integration/Deployment

### GitHub Actions

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci && npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### GitLab CI

```yaml
deploy:
  image: node:18
  script:
    - npm ci
    - npm run build
    - npx netlify-cli deploy --prod
  only:
    - main
```

## Rollback & Disaster Recovery

### Netlify Rollback

1. Go to Deploys in Netlify UI
2. Select previous deployment
3. Click "Publish deploy"

### Manual Backup

```bash
# Backup database
pg_dump mydb > backup.sql

# Backup code
git push origin backup-branch

# Backup configuration
cp .env .env.backup
```

## Post-Deployment

1. **Test**: Run full test suite in production environment
2. **Monitor**: Watch logs and metrics
3. **Alert**: Set up notification for errors
4. **Document**: Record deployment details
5. **Team**: Notify team of successful deployment

## Troubleshooting Deployments

### Build Failures

```bash
# Check build locally
npm run build

# Check for environment variables
echo $OLLAMA_ENDPOINT

# Check dependencies
npm ls
```

### Runtime Errors

- Check application logs
- Monitor for exceptions
- Review recent code changes
- Rollback if necessary

### Performance Issues

- Analyze bundle size
- Check API response times
- Monitor database queries
- Profile CPU and memory usage

## Conclusion

Choose deployment based on your needs:

- **Simple & Managed**: Netlify or Vercel
- **Full Control**: Self-hosted Docker
- **Scalability**: Kubernetes or cloud-native platforms

Start with Netlify for ease of use, migrate to Docker/K8s for advanced features.
