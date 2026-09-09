import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Zap,
  Eye,
  Cpu,
  Target,
  Gamepad2,
  Brain,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="w-7 h-7 text-amber-400" />
            <span className="text-xl font-bold">GameAI Automation</span>
          </div>
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2">
              Open Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="inline-block">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 border border-amber-400/30 w-fit">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-300">
                  Powered by AI Vision & Automation
                </span>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              AI-Powered Game
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Automation Platform
              </span>
            </h1>

            <p className="text-xl text-slate-300 max-w-2xl leading-relaxed">
              Real-time screen analysis and intelligent task automation for
              games, surveys, and any application. Harness the power of AI
              vision to automate complex workflows with precision.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link to="/dashboard">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  <Zap className="w-5 h-5" />
                  Launch Dashboard
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2">
                <Eye className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-700/50">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Powerful Capabilities
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Everything you need to automate and test your games and
              applications with AI-driven intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-400/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-400/20 rounded-lg">
                    <Eye className="w-5 h-5 text-amber-400" />
                  </div>
                  <CardTitle>Real-Time Screen Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-slate-300">
                Continuously captures and analyzes screenshots at 0.25s
                intervals using advanced computer vision and AI models.
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-400/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-400/20 rounded-lg">
                    <Brain className="w-5 h-5 text-blue-400" />
                  </div>
                  <CardTitle>AI-Powered Decisions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-slate-300">
                Uses Ollama vision models to understand game state, detect UI
                elements, and suggest optimal actions.
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-slate-800/50 border-slate-700 hover:border-green-400/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-400/20 rounded-lg">
                    <Cpu className="w-5 h-5 text-green-400" />
                  </div>
                  <CardTitle>Automated Control</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-slate-300">
                Intelligent mouse and keyboard automation with multiple backup
                methods for reliability across platforms.
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-400/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-400/20 rounded-lg">
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                  <CardTitle>Task Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-slate-300">
                Create, track, and execute complex tasks with priority levels,
                dependencies, and real-time progress monitoring.
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-400/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-400/20 rounded-lg">
                    <Gamepad2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <CardTitle>Game Automation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-slate-300">
                Complete game workflows including sign-ups, in-game purchases,
                navigation, and complex action sequences.
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="bg-slate-800/50 border-slate-700 hover:border-rose-400/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-400/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-rose-400" />
                  </div>
                  <CardTitle>Universal Platform</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-slate-300">
                Works with any game or application. Web dashboard, desktop app,
                and mobile screen capture support.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-700/50">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              A seamless workflow of observation, analysis, and action
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                step: 1,
                title: "Capture",
                description:
                  "Continuous screen capture at high frequency using multiple backup methods",
              },
              {
                step: 2,
                title: "Analyze",
                description:
                  "AI vision model analyzes game state, UI elements, and current situation",
              },
              {
                step: 3,
                title: "Decide",
                description:
                  "AI generates intelligent suggestions based on analysis and task goals",
              },
              {
                step: 4,
                title: "Execute",
                description:
                  "Automated mouse/keyboard control executes recommended actions",
              },
            ].map(({ step, title, description }) => (
              <div key={step} className="flex gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400">
                    <span className="text-xl font-bold text-slate-900">
                      {step}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{title}</h3>
                  <p className="text-slate-300">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-700/50">
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/30 rounded-2xl p-12 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Automate?</h2>
          <p className="text-slate-300 max-w-2xl mx-auto">
            Start automating your games and applications right now. No setup
            required.
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="gap-2">
              <Zap className="w-5 h-5" />
              Launch Dashboard Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-300 text-sm">
          <p>
            GameAI Automation Platform • Powered by AI Vision & Advanced
            Automation
          </p>
        </div>
      </footer>
    </div>
  );
}
