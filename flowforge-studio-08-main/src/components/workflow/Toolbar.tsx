import { useRef } from 'react';
import {
  Undo2, Redo2, Play, Square, Download, Upload, Trash2, AlertTriangle, CheckCircle2,
  FileJson,
} from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { validateWorkflow } from '@/utils/validation';
import { executeWorkflow } from '@/utils/executionEngine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Toolbar() {
  const store = useWorkflowStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleValidate = () => {
    const errors = validateWorkflow(store.nodes, store.edges);
    store.setValidationErrors(errors);
    if (errors.length === 0) {
      toast.success('Workflow is valid!');
    } else {
      toast.error(`${errors.filter(e => e.type === 'error').length} errors, ${errors.filter(e => e.type === 'warning').length} warnings`);
    }
  };

  const handleExecute = async () => {
    const errors = validateWorkflow(store.nodes, store.edges);
    store.setValidationErrors(errors);
    const hasErrors = errors.some(e => e.type === 'error');
    if (hasErrors) {
      toast.error('Fix validation errors before executing');
      return;
    }

    store.clearExecutionLogs();
    store.setExecuting(true);
    store.setShowExecutionPanel(true);

    await executeWorkflow(store.nodes, store.edges, {
      onNodeStart: (nodeId, log) => {
        store.setExecutingNode(nodeId);
        store.addExecutionLog(log);
      },
      onNodeComplete: (_nodeId, log) => {
        store.addExecutionLog(log);
      },
      onProgress: (progress) => {
        store.setExecutionProgress(progress);
      },
      onComplete: () => {
        store.setExecuting(false);
        store.setExecutingNode(null);
        toast.success('Workflow executed successfully!');
      },
      onError: (error) => {
        store.setExecuting(false);
        store.setExecutingNode(null);
        toast.error(error);
      },
    });
  };

  const handleStop = () => {
    store.setExecuting(false);
    store.setExecutingNode(null);
  };

  const handleExport = () => {
    const json = store.exportWorkflow();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${store.workflowName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Workflow exported');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.nodes && data.edges) {
          store.loadWorkflow({ name: data.name || 'Imported Workflow', nodes: data.nodes, edges: data.edges });
          toast.success('Workflow imported');
        } else {
          toast.error('Invalid workflow file');
        }
      } catch {
        toast.error('Failed to parse workflow file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const validationErrorCount = store.validationErrors.filter(e => e.type === 'error').length;
  const validationWarningCount = store.validationErrors.filter(e => e.type === 'warning').length;

  return (
    <div className="h-12 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
      {/* Workflow name */}
      <Input
        value={store.workflowName}
        onChange={(e) => store.setWorkflowName(e.target.value)}
        className="h-7 w-48 text-sm font-medium bg-transparent border-none hover:bg-muted focus:bg-muted"
      />

      <div className="h-5 w-px bg-border mx-1" />

      {/* Undo/Redo */}
      <Button variant="ghost" size="sm" onClick={store.undo} disabled={store.past.length === 0} className="h-7 w-7 p-0">
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={store.redo} disabled={store.future.length === 0} className="h-7 w-7 p-0">
        <Redo2 className="h-4 w-4" />
      </Button>

      <div className="h-5 w-px bg-border mx-1" />

      {/* Validate */}
      <Button variant="ghost" size="sm" onClick={handleValidate} className="h-7 gap-1.5 text-xs">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Validate
      </Button>

      {/* Execute / Stop */}
      {store.isExecuting ? (
        <Button variant="destructive" size="sm" onClick={handleStop} className="h-7 gap-1.5 text-xs">
          <Square className="h-3.5 w-3.5" />
          Stop
        </Button>
      ) : (
        <Button variant="default" size="sm" onClick={handleExecute} className="h-7 gap-1.5 text-xs">
          <Play className="h-3.5 w-3.5" />
          Run
        </Button>
      )}

      {/* Validation indicator */}
      {store.validationErrors.length > 0 && (
        <div className="flex items-center gap-1 text-xs">
          {validationErrorCount > 0 && (
            <span className="flex items-center gap-0.5 text-destructive">
              <AlertTriangle className="h-3 w-3" />
              {validationErrorCount}
            </span>
          )}
          {validationWarningCount > 0 && (
            <span className="flex items-center gap-0.5 text-warning">
              <AlertTriangle className="h-3 w-3" />
              {validationWarningCount}
            </span>
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* Import/Export */}
      <Button variant="ghost" size="sm" onClick={handleExport} className="h-7 gap-1.5 text-xs">
        <Download className="h-3.5 w-3.5" />
        Export
      </Button>
      <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="h-7 gap-1.5 text-xs">
        <Upload className="h-3.5 w-3.5" />
        Import
      </Button>
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

      {/* Clear */}
      <Button variant="ghost" size="sm" onClick={store.clearWorkflow} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      {/* Execution progress */}
      {store.isExecuting && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${store.executionProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
