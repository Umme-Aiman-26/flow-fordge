import { X, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ExecutionPanel() {
  const executionLogs = useWorkflowStore(s => s.executionLogs);
  const isExecuting = useWorkflowStore(s => s.isExecuting);
  const showPanel = useWorkflowStore(s => s.showExecutionPanel);
  const setShowPanel = useWorkflowStore(s => s.setShowExecutionPanel);
  const validationErrors = useWorkflowStore(s => s.validationErrors);
  const executionProgress = useWorkflowStore(s => s.executionProgress);

  if (!showPanel) return null;

  return (
    <div className="h-56 bg-card border-t border-border flex flex-col shrink-0">
      <div className="h-9 flex items-center justify-between px-3 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-card-foreground uppercase tracking-wider">
            Execution Log
          </span>
          {isExecuting && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running... {Math.round(executionProgress)}%
            </span>
          )}
        </div>
        <button
          onClick={() => setShowPanel(false)}
          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1 font-mono text-xs">
          {/* Validation errors first */}
          {validationErrors.map((err, i) => (
            <div key={`val-${i}`} className={cn(
              'flex items-start gap-2 py-1 px-2 rounded',
              err.type === 'error' ? 'text-destructive bg-destructive/5' : 'text-warning bg-warning/5'
            )}>
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{err.message}</span>
            </div>
          ))}

          {/* Execution logs */}
          {executionLogs.map((log, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2 py-1 px-2 rounded',
                log.status === 'running' && 'text-primary bg-primary/5',
                log.status === 'success' && 'text-success',
                log.status === 'failure' && 'text-destructive bg-destructive/5',
              )}
            >
              {log.status === 'running' && <Loader2 className="h-3 w-3 mt-0.5 shrink-0 animate-spin" />}
              {log.status === 'success' && <CheckCircle className="h-3 w-3 mt-0.5 shrink-0" />}
              {log.status === 'failure' && <XCircle className="h-3 w-3 mt-0.5 shrink-0" />}
              <span className="text-muted-foreground">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className="font-medium">[{log.nodeName}]</span>
              <span>{log.message}</span>
            </div>
          ))}

          {executionLogs.length === 0 && validationErrors.length === 0 && (
            <p className="text-muted-foreground py-4 text-center">
              No logs yet. Run the workflow to see execution results.
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
