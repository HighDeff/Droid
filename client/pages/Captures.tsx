import { AssistantWorkspace } from "@/components/assistant-workspace";
import { AnalysisPanel } from "@/components/analysis-panel";

export default function Captures() {
  return (
    <div>
      <AssistantWorkspace view="captures" />
      <div className="bg-[#0b1020] px-5 pb-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <AnalysisPanel />
        </div>
      </div>
    </div>
  );
}
