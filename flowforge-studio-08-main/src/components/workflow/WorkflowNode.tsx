import { memo, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Zap, Play, GitBranch, Clock, CheckCircle, Trash2 } from 'lucide-react';
import type { NodeType } from '@/types/workflow';
import { useWorkflowStore } from '@/stores/workflowStore';
import { cn } from '@/lib/utils';

const iconMap: Record<NodeType, React.ComponentType<{ className?: string }>> = {
  trigger: Zap,
  action: Play,
  condition: GitBranch,
  delay: Clock,
  output: CheckCircle,
};

const colorMap: Record<NodeType, { border: string; bg: string; icon: string }> = {
  trigger: { border: 'border-node-trigger', bg: 'bg-node-trigger-bg', icon: 'text-node-trigger' },
  action: { border: 'border-node-action', bg: 'bg-node-action-bg', icon: 'text-node-action' },
  condition: { border: 'border-node-condition', bg: 'bg-node-condition-bg', icon: 'text-node-condition' },
  delay: { border: 'border-node-delay', bg: 'bg-node-delay-bg', icon: 'text-node-delay' },
  output: { border: 'border-node-output', bg: 'bg-node-output-bg', icon: 'text-node-output' },
};

function WorkflowNodeComponent({ id, data, selected }: NodeProps) {
  const nodeType = (data._nodeType as NodeType) || 'action';
  const executingNodeId = useWorkflowStore(s => s.executingNodeId);
  const deleteNode = useWorkflowStore(s => s.deleteNode);
  const selectNode = useWorkflowStore(s => s.selectNode);
  const isExecuting = executingNodeId === id;

  const Icon = iconMap[nodeType];
  const colors = colorMap[nodeType];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative px-4 py-3 rounded-lg border-2 bg-card shadow-sm min-w-[160px] max-w-[220px] transition-all duration-200 group',
        colors.border,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        isExecuting && 'node-executing'
      )}
    >
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:scale-110"
      >
        <Trash2 className="h-3 w-3" />
      </button>

      {/* Input handle */}
      {nodeType !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
        />
      )}

      <div className="flex items-center gap-2">
        <div className={cn('p-1.5 rounded-md', colors.bg)}>
          <Icon className={cn('h-4 w-4', colors.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate text-card-foreground">
            {(data.label as string) || nodeType}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {(data.description as string) || ''}
          </div>
        </div>
      </div>

      {isExecuting && (
        <div className="absolute -bottom-1 left-2 right-2 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-executing animate-pulse rounded-full" style={{ width: '60%' }} />
        </div>
      )}

      {/* Output handle */}
      {nodeType !== 'output' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
        />
      )}

      {/* Condition has two outputs */}
      {nodeType === 'condition' && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="!w-3 !h-3 !bg-success !border-2 !border-background"
            style={{ left: '35%' }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="!w-3 !h-3 !bg-destructive !border-2 !border-background"
            style={{ left: '65%' }}
          />
        </>
      )}
    </div>
  );
}

export default memo(WorkflowNodeComponent);
