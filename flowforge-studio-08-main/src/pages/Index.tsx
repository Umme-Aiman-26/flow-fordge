import { ReactFlowProvider } from '@xyflow/react';
import NodeLibrary from '@/components/workflow/NodeLibrary';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import ConfigPanel from '@/components/workflow/ConfigPanel';
import Toolbar from '@/components/workflow/Toolbar';
import ExecutionPanel from '@/components/workflow/ExecutionPanel';

const Index = () => {
  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
        {/* Toolbar */}
        <Toolbar />

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Node Library */}
          <NodeLibrary className="w-60 shrink-0" />

          {/* Center: Canvas + Execution Panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <WorkflowCanvas className="flex-1" />
            <ExecutionPanel />
          </div>

          {/* Right: Config Panel */}
          <ConfigPanel className="w-72 shrink-0" />
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default Index;
