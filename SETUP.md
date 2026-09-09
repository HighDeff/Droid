# GameAI Automation Platform - Setup Guide

A powerful AI-driven game and application automation platform with real-time screen analysis and intelligent task execution.

## Features

- **Real-Time Screen Capture**: Captures screens at 0.25s intervals with multiple backup methods
- **AI Vision Analysis**: Uses Ollama vision models to understand game state and UI elements
- **Intelligent Automation**: Mouse and keyboard control with natural language task understanding
- **Task Management**: Create, track, and execute complex automation workflows
- **Multi-Platform Support**: Works on Windows, macOS, and Linux
- **Web Dashboard**: Intuitive interface for monitoring and control
- **Configurable LLM**: Support for Ollama endpoint with fallback options

## Prerequisites

### System Requirements

- Node.js 18+ (for web dashboard)
- Python 3.8+ (for automation service)
- 2GB RAM minimum
- Screen capture capability on your OS

### Python Dependencies

For the automation service, you'll need:

```bash
cd python-service
pip install -r requirements.txt
```

Key Python packages:
- `pyautogui>=0.9.53` - Screen capture and automation
- `Pillow>=10.0.0` - Image processing

### Node.js Dependencies

For the web dashboard:

```bash
pnpm install
```

## Installation

### 1. Clone and Install Dependencies

```bash
# Install Node dependencies
pnpm install

# Install Python dependencies
cd python-service
pip install -r requirements.txt
cd ..
```

### 2. Setup Environment Variables (Optional)

Create a `.env` file in the project root:

```env
OLLAMA_ENDPOINT=https://remote.quantumpass.io/ollama/api/chat
OLLAMA_MODEL=qwen2.5vl:7b
```

These can also be configured in the dashboard UI.

## Development

### Start Development Server

```bash
pnpm dev
```

This starts:
- React frontend on http://localhost:5173
- Express backend on http://localhost:5173/api
- Both with hot reload

### Access Dashboard

1. Open http://localhost:5173
2. Click "Open Dashboard" or navigate to http://localhost:5173/dashboard
3. Start screen capture and automation

## Usage

### Basic Workflow

1. **Start Capture**: Click "Start Capture" button to begin screen monitoring
2. **View Analysis**: AI analysis appears in real-time in the right panel
3. **Create Tasks**: Add tasks in the task manager (left sidebar)
4. **Execute Tasks**: Click "Execute" button to run automated actions
5. **Monitor Progress**: Watch task status and AI suggestions

### Creating Tasks

Tasks can be created with natural language descriptions:

- **Click Tasks**: "click at 100,200" or "click the play button"
- **Type Tasks**: 'type "username"' or "input text"
- **Scroll Tasks**: "scroll down 3 clicks" or "scroll up"
- **Wait Tasks**: "wait 2 seconds" or "delay for 1 second"
- **Screenshot**: "capture screen" or "take screenshot"

### Configuration

**LLM Settings:**
- Configure Ollama endpoint in Dashboard → Settings → LLM
- Default: https://remote.quantumpass.io/ollama/api/chat
- Model: qwen2.5vl:7b (configurable)

**Automation Settings:**
- Capture Rate: 0.25 seconds (fixed, can be modified in code)
- Status indicator shows Active/Inactive

## Architecture

### Components

```
├── client/                 # React frontend
│   ├── pages/
│   │   ├── Index.tsx       # Homepage
│   │   └── Dashboard.tsx   # Main automation dashboard
│   └── components/
│       └── ui/             # Shadcn UI components
│
├── server/                 # Express backend
│   ├── routes/
│   │   ├── screen-capture.ts
│   │   ├── analyze-screenshot.ts
│   │   └── execute-task.ts
│   └── index.ts
│
└── python-service/         # Python automation
    ├── automation.py       # Core automation module
    ├── capture.py          # Screen capture service
    ├── execute-task.py     # Task execution service
    └── requirements.txt
```

### Data Flow

```
Dashboard UI
    ↓
Express API Routes
    ↓
Python Services
    ├─→ Screen Capture
    ├─→ Ollama API (Analysis)
    └─→ Mouse/Keyboard Control
```

## Deployment

### Production Build

```bash
pnpm build
pnpm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install Python
RUN apk add --no-cache python3 py3-pip

# Copy files
COPY . .

# Install dependencies
RUN pnpm install
RUN cd python-service && pip install -r requirements.txt && cd ..

# Build
RUN pnpm build

# Expose port
EXPOSE 3000

# Start
CMD ["pnpm", "start"]
```

### Netlify/Vercel Deployment

The project is configured for Netlify/Vercel:

1. Connect repository
2. Build command: `pnpm build`
3. Publish directory: `dist/spa`
4. Environment variables: Set `OLLAMA_ENDPOINT` if needed
5. Ensure Python service runs as a background worker (requires alternative setup)

**Note**: Python automation service requires running on a system with screen capture capability. For cloud deployments, consider:
- Running Python service locally and connecting via API
- Using headless browser automation instead
- Cloud-based screenshot services

### Electron Desktop App

For a full desktop application with system-wide automation:

```bash
# Install Electron dependencies
npm install electron electron-builder

# Create main process file
# Build as executable
npm run make
```

See `ELECTRON.md` for detailed setup.

## Troubleshooting

### Screen Capture Not Working

**Issue**: "All capture methods failed"

**Solutions**:
1. Ensure app has screen capture permissions
2. On macOS: Grant terminal/app permissions in System Preferences
3. On Linux: Install `scrot` or `gnome-screenshot`
4. On Windows: Run as Administrator

### Ollama Connection Error

**Issue**: "Failed to connect to Ollama endpoint"

**Solutions**:
1. Verify Ollama is running: `ollama serve`
2. Check endpoint URL in settings
3. Verify firewall allows connection
4. Test manually: `curl https://remote.quantumpass.io/ollama/api/chat`

### Task Execution Fails

**Issue**: "Task execution timeout"

**Solutions**:
1. Check Python environment is properly set up
2. Verify pyautogui can access system
3. Try simpler tasks first
4. Check browser console for API errors

### Performance Issues

**Solutions**:
1. Reduce capture frequency in code (default 0.25s)
2. Run Python service on faster machine
3. Disable real-time AI analysis for batch tasks
4. Check system resources (CPU, RAM)

## API Reference

### POST /api/capture-screen

Captures current screen

**Response**:
```json
{
  "success": true,
  "imageData": "data:image/png;base64,...",
  "method": "pyautogui"
}
```

### POST /api/analyze-screenshot

Analyzes screenshot with AI

**Request**:
```json
{
  "imageData": "data:image/png;base64,...",
  "endpoint": "https://remote.quantumpass.io/ollama/api/chat"
}
```

**Response**:
```json
{
  "success": true,
  "detection": "Game menu with play button visible...",
  "suggestion": "Click play to start game",
  "confidence": 0.95
}
```

### POST /api/execute-task

Executes a task

**Request**:
```json
{
  "task": {
    "id": "12345",
    "name": "Click play button",
    "description": "click at 500,300",
    "status": "pending",
    "priority": 1,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Response**:
```json
{
  "success": true,
  "result": "Clicked at (500, 300)"
}
```

## Development Tips

### Adding New Automation Features

1. Add method to `python-service/automation.py`
2. Create handler in `server/routes/`
3. Add UI component in dashboard
4. Register API route in `server/index.ts`

### Debugging

- Enable Python debug output: `export DEBUG=1`
- Browser DevTools: F12
- API responses show in Network tab
- Python errors in browser console

### Performance Optimization

- Use WebSocket for real-time updates (vs polling)
- Cache screen analysis results
- Batch multiple actions
- Optimize image compression

## Security Considerations

- Never hardcode sensitive credentials
- Use environment variables for API keys
- Restrict API access in production
- Validate all user input
- Run with minimal privileges needed
- Consider sandboxing untrusted tasks

## Support & Documentation

- **Issues**: Check GitHub issues
- **Documentation**: See docs/ folder
- **Examples**: Check examples/ folder
- **Community**: Discussions on platform

## License

[Your License Here]

## Contributing

Contributions welcome! Please:
1. Fork repository
2. Create feature branch
3. Make changes
4. Submit pull request

## Changelog

### v1.0.0 (Initial Release)
- Real-time screen capture
- AI-powered analysis
- Automated task execution
- Task management system
- Web dashboard
- Multi-platform support
