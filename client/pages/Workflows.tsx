import { WorkflowLibraryPanel } from "@/components/workflow-library-panel";

export default function Workflows() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-2xl font-semibold">Saved workflows</h1>
        <p className="mb-6 text-slate-400">
          Review durable-workflow foundations without triggering automatic
          execution.
        </p>
        <WorkflowLibraryPanel />
      </div>
    </main>
  );
}
