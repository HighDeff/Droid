# GameAI Automation Platform

AI-powered game and application automation with real-time screen analysis, intelligent task execution, and multi-platform support.

[![Latest Release](https://img.shields.io/badge/release-v1.0.0-blue)](https://github.com/HighDeff/Droid/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.8+-blue)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/node.js-18+-green)](https://nodejs.org/)

## Overview

GameAI Automation is a comprehensive platform for automating games, surveys, and applications using AI vision and intelligent task execution. It continuously monitors your screen, analyzes game state, and executes complex automation workflows with minimal setup.

### Key Features

- **🎥 Real-Time Screen Capture** - 0.25s interval monitoring with multiple backup methods
- **🧠 AI Vision Analysis** - Understands UI elements, game state, and context using Ollama models
- **🤖 Intelligent Automation** - Mouse/keyboard control with natural language task understanding
- **📋 Task Management** - Create, track, and execute complex automation workflows
- **🌐 Web Dashboard** - Intuitive interface for monitoring and control from any device
- **🖥️ Desktop App** - Native Electron app for Windows, macOS, and Linux
- **⚙️ Configurable** - Customizable LLM endpoints and automation parameters
- **🔄 Multi-Platform** - Works with any game or application

## Quick Start

Get up and running in 5 minutes:

```bash
# 1. Install dependencies
pnpm install
cd python-service && pip install -r requirements.txt && cd ..

# 2. Start development server
pnpm dev

# 3. Open browser and navigate to dashboard
# http://localhost:5173/dashboard

# 4. Click "Start Capture" and begin automating!
```

See [QUICKSTART.md](QUICKSTART.md) for detailed quick start guide.

## Documentation

- **[Quick Start](QUICKSTART.md)** - Get running in 5 minutes
- **[Setup Guide](SETUP.md)** - Comprehensive installation and configuration
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment to Netlify, Vercel, or self-hosted
- **[Electron Guide](ELECTRON.md)** - Building desktop application
- **[API Reference](SETUP.md#api-reference)** - Complete API documentation

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Web Dashboard (React)                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Screen Viewer │ Task Manager │ AI Analysis Panel │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Express API Backend (TypeScript)           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Screen Capture │ Analysis │ Task Execution       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│         Python Automation Services                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │ pyautogui │ PIL │ Subprocess (Backup Methods)   │   │
│  └─────────────────────────���────────────────────────┘   │
│                            ↓                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Ollama API │ Keyboard Control │ Mouse Control   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Radix UI** - Component library
- **React Router** - Client-side routing
- **Lucide Icons** - Icon library

### Backend

- **Express.js** - API server
- **TypeScript** - Type safety
- **CORS** - Cross-origin support
- **Vite** - Build tool and dev server

### Automation

- **Python 3.8+** - Automation runtime
- **pyautogui** - Screen capture and mouse/keyboard control
- **Pillow** - Image processing
- **Ollama** - AI vision model hosting

### Deployment

- **Netlify** - Recommended static hosting
- **Vercel** - Alternative edge deployment
- **Docker** - Container deployment
- **Electron** - Desktop application packaging

## Installation

### System Requirements

- **OS**: Windows 10+, macOS 10.12+, Ubuntu 18.04+
- **Memory**: 2GB RAM minimum, 4GB+ recommended
- **Disk**: 500MB free space

### Step 1: Clone Repository

```bash
git clone https://github.com/HighDeff/Droid.git
cd gameai-automation
```

### Step 2: Install Node Dependencies

```bash
pnpm install
```

### Step 3: Install Python Dependencies

```bash
cd python-service
pip install -r requirements.txt
cd ..
```

### Step 4: Configure Environment (Optional)

Create `.env` file:

```env
OLLAMA_ENDPOINT=https://remote.quantumpass.io/ollama/api/chat
OLLAMA_MODEL=qwen2.5vl:7b
```

### Step 5: Start Development Server

```bash
pnpm dev
```

### Step 6: Open Dashboard

Visit http://localhost:5173/dashboard in your browser.

## Usage

### Basic Automation Workflow

1. **Start Capture**
   - Click "Start Capture" button
   - Dashboard shows live screen updates

2. **Monitor Analysis**
   - AI analyzes each screenshot
   - Displays detected UI elements and suggestions
   - Shows confidence scores

3. **Create Tasks**
   - Name: Task description (e.g., "Click play button")
   - Description: Specific instructions (e.g., "click at 500,300")
   - Priority: Execution priority

4. **Execute Tasks**
   - Click "Execute" to run task
   - Monitor progress in real-time
   - View results and suggestions

### Task Types

```
Click:    "click at 100,200"
Type:     'type "username"'
Scroll:   "scroll down 5 clicks"
Wait:     "wait 2 seconds"
Drag:     "drag from 100,200 to 300,400"
Key:      "press enter"
Hotkey:   "hotkey ctrl+s"
```

### Configuration

Access Settings in dashboard:

- **LLM Tab**: Configure Ollama endpoint and model
- **Automation Tab**: View capture rate and status
- **Settings**: Adjust parameters and preferences

## API Reference

### Screen Capture

```http
GET /api/capture-screen
```

Captures current screen and returns base64-encoded image.

### Screenshot Analysis

```http
POST /api/analyze-screenshot
Content-Type: application/json

{
  "imageData": "data:image/png;base64,...",
  "endpoint": "https://remote.quantumpass.io/ollama/api/chat"
}
```

### Task Execution

```http
POST /api/execute-task
Content-Type: application/json

{
  "task": {
    "id": "task-123",
    "name": "Click button",
    "description": "click at 500,300",
    "status": "pending",
    "priority": 1,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

See [SETUP.md#api-reference](SETUP.md#api-reference) for complete API documentation.

## Deployment

### Quick Deployment to Netlify

1. Push code to GitHub
2. Visit https://app.netlify.com/start
3. Connect repository
4. Set build command: `npm run build`
5. Set publish directory: `dist/spa`
6. Deploy!

### Docker Deployment

```bash
docker build -t gameai-automation .
docker run -p 3000:3000 gameai-automation
```

### Desktop App

```bash
npm install -D electron electron-builder
pnpm electron-build
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Performance

- **Screenshot Capture**: ~50-100ms per capture
- **AI Analysis**: ~2-5 seconds (depends on Ollama)
- **Task Execution**: ~100-500ms per task
- **Dashboard Latency**: <100ms

## Troubleshooting

### No Screenshots Captured

**Problem**: Dashboard shows "Waiting for AI analysis..."

**Solutions**:

1. Check browser permissions for screen capture
2. On macOS: Grant app permissions in System Preferences
3. Ensure screen is not locked
4. Verify Python service is running

### Ollama Connection Error

**Problem**: "Failed to connect to Ollama endpoint"

**Solutions**:

1. Verify Ollama is running: `ollama serve`
2. Check endpoint URL in dashboard settings
3. Test connection: `curl https://remote.quantumpass.io/ollama/api/chat`
4. Check firewall and network connectivity

### Task Execution Fails

**Problem**: "Task execution timeout"

**Solutions**:

1. Ensure Python 3.8+ is installed
2. Verify Python dependencies: `pip list`
3. Check pyautogui installation: `python3 -c "import pyautogui"`
4. Try simpler tasks first

## Advanced Usage

### Custom Task Scripts

Create custom task handlers in `python-service/execute-task.py`:

```python
def execute_custom_task(task: dict) -> dict:
    # Your custom logic here
    return {"success": True, "result": "..."}
```

### Multiple Game Profiles

Create separate task lists for different games:

```typescript
const gameProfiles = {
  "Game A": [task1, task2, task3],
  "Game B": [task4, task5, task6],
};
```

### Monitoring & Analytics

Track task execution over time:

```typescript
interface TaskMetrics {
  totalExecuted: number;
  successRate: number;
  averageExecutionTime: number;
}
```

## Contributing

Contributions welcome! Please:

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

- Never commit secrets to repository
- Use environment variables for API keys
- Validate all user input
- Keep dependencies updated
- Run with minimal required privileges
- Consider code signing for desktop apps

See [SECURITY.md](SECURITY.md) for security best practices.

## Performance Tips

1. **Optimize Images**: Reduce screenshot resolution if needed
2. **Batch Tasks**: Group related actions together
3. **Cache Results**: Store AI analysis results when applicable
4. **Use Pauses**: Add delays between rapid actions for stability
5. **Monitor Resources**: Watch CPU and memory usage
6. **Test Locally**: Verify tasks on simple apps before complex games

## Known Limitations

- Python service requires local system with screen capture capability
- Mouse/keyboard control limited to desktop applications
- Some DRM-protected games may block automation
- Network latency affects real-time response
- AI analysis accuracy depends on model and image quality

## Roadmap

- [ ] Ollama integration improvements
- [ ] Advanced task chaining and loops
- [ ] Visual task builder (no-code)
- [ ] Cloud-based screenshot services
- [ ] Mobile app with cloud backend
- [ ] Machine learning for action prediction
- [ ] Voice command integration
- [ ] Multi-monitor support

## Support

- 📖 **Documentation**: See [docs/](docs/) folder
- 🐛 **Issues**: Report bugs on [GitHub Issues](https://github.com/HighDeff/Droid/issues)
- 💬 **Discussions**: Ask questions on [GitHub Discussions](https://github.com/HighDeff/Droid/discussions)
- 📧 **Email**: support@example.com

## License

MIT License - See [LICENSE](LICENSE) for details

## Acknowledgments

- [Ollama](https://ollama.ai/) - Open-source AI models
- [Radix UI](https://www.radix-ui.com/) - Accessible components
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS
- [React](https://react.dev/) - JavaScript UI library
- [Express.js](https://expressjs.com/) - Node.js framework

## Disclaimer

This tool is provided for educational and personal use. Users are responsible for complying with the terms of service of any game or application they automate. The creators are not responsible for account bans or other consequences resulting from automation usage.

---

**Ready to automate?** [Start with the Quick Start Guide](QUICKSTART.md)

Made with ❤️ by the GameAI Team

# Workflow persistence

The assistant workflow APIs under `/api/assistant/workflows` currently use the
existing in-memory repository abstraction. Workflow definitions, operation
packs, checkpoints, schedules, and progress are scoped to an assistant session,
but restart persistence is not yet guaranteed. No workflow is automatically
executed by the workflow library UI.
