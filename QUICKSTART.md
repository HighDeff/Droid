# Quick Start Guide

Get GameAI Automation running in 5 minutes.

## 1. Install Dependencies (2 min)

```bash
# Install Node packages
pnpm install

# Install Python packages
cd python-service
pip install -r requirements.txt
cd ..
```

## 2. Start Development Server (1 min)

```bash
pnpm dev
```

This starts:

- React frontend: http://localhost:5173
- Express API: http://localhost:5173/api
- Hot reload enabled

## 3. Open Dashboard (1 min)

1. Go to http://localhost:5173 in your browser
2. Click "Open Dashboard" button
3. You're in the automation dashboard!

## 4. Start Automating (1 min)

### Basic Workflow

```
1. Click "Start Capture" button
   ↓
2. See live screen in main panel
   ↓
3. AI analysis appears on right
   ↓
4. Create a task: "click at 500,300"
   ↓
5. Click "Execute" to run automation
```

## Common Tasks

### Click Something

```
Name: Click button
Description: click at 500,300
```

### Type Text

```
Name: Type username
Description: type "myusername"
```

### Scroll Page

```
Name: Scroll down
Description: scroll down 5 clicks
```

### Wait Before Action

```
Name: Wait for page
Description: wait 2 seconds
```

## Configuring Ollama Endpoint

Dashboard → Settings → LLM tab:

```
Default: https://remote.quantumpass.io/ollama/api/chat
Model: qwen2.5vl:7b
```

Can be changed in UI without restart.

## Troubleshooting

### "No screenshots appearing"

- Check that browser has screen capture permissions
- On macOS: System Preferences → Security & Privacy
- Click "Continue" if permission prompt appears

### "Ollama connection error"

- Verify endpoint URL in Settings
- Check internet connection
- Try fallback endpoint if available

### "Python service not found"

- Ensure Python 3.8+ is installed
- Run: `python3 --version`
- Reinstall packages: `pip install -r python-service/requirements.txt`

## Next Steps

After basic testing:

1. **Create Complex Tasks** - Combine multiple actions
2. **Test with Your Game** - Run against actual game
3. **Monitor Performance** - Check AI accuracy and speed
4. **Adjust Settings** - Fine-tune capture rate and endpoints
5. **Deploy** - See DEPLOYMENT.md for production setup

## Building for Production

```bash
# Build everything
pnpm build

# Create desktop app
npm install -D electron electron-builder
pnpm electron-build

# Deploy to Netlify/Vercel
# (Connect Git repository at app.netlify.com or vercel.com)
```

## File Structure Quick Reference

```
client/
  pages/
    Index.tsx       ← Homepage
    Dashboard.tsx   ← Main interface
  components/ui/    ← Reusable UI components

server/
  routes/
    *.ts           ← API endpoints
  index.ts         ← Main server

python-service/
  automation.py    ← Core automation logic
  capture.py       ← Screen capture service
  execute-task.py  ← Task execution
```

## Key Features Checklist

- ✅ Real-time screen capture
- ✅ AI vision analysis (Ollama integration)
- ✅ Task creation and execution
- ✅ Mouse/keyboard automation
- ✅ Web dashboard
- ✅ Settings & configuration
- ✅ Multi-platform support
- ✅ Production deployment ready

## API Quick Reference

Send automation commands via API:

```bash
# Capture screen
curl http://localhost:5173/api/capture-screen

# Analyze screenshot
curl -X POST http://localhost:5173/api/analyze-screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "imageData": "data:image/png;base64,...",
    "endpoint": "https://remote.quantumpass.io/ollama/api/chat"
  }'

# Execute task
curl -X POST http://localhost:5173/api/execute-task \
  -H "Content-Type: application/json" \
  -d '{
    "task": {
      "id": "1",
      "name": "Click button",
      "description": "click at 500,300",
      "status": "pending",
      "priority": 1,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }'
```

## Video Tutorial (Coming Soon)

Watch the tutorial at: https://example.com/tutorial

## Community & Support

- **Issues**: Report bugs on GitHub
- **Discussions**: Ask questions in forum
- **Docs**: Full docs in SETUP.md and DEPLOYMENT.md
- **Examples**: See examples/ folder

## Quick Tips

1. **Batch Tasks** - Create multiple tasks to run in sequence
2. **Use Pauses** - Add wait tasks between actions for stability
3. **Test First** - Test tasks on simple apps before games
4. **Monitor Logs** - Browser console shows detailed info
5. **Save Settings** - Endpoint settings persist across sessions

---

**Ready to automate?** You're all set! Start with the dashboard and build from there.

For detailed documentation, see:

- SETUP.md - Full setup guide
- DEPLOYMENT.md - Production deployment
- ELECTRON.md - Desktop app guide
