import { Zap, Play, GitBranch, Clock, CheckCircle, GripVertical } from 'lucide-react';
import type { NodeType } from '@/types/workflow';
import { NODE_TYPE_CONFIG } from '@/types/workflow';
import { cn } from '@/lib/utils';

const iconMap: Record<NodeType, React.ComponentType<{ className?: string }>> = {
  trigger: Zap,
  action: Play,
  condition: GitBranch,
  delay: Clock,
  output: CheckCircle,
};

const colorMap: Record<NodeType, string> = {
  trigger: 'border-node-trigger bg-node-trigger-bg text-node-trigger',
  action: 'border-node-action bg-node-action-bg text-node-action',
  condition: 'border-node-condition bg-node-condition-bg text-node-condition',
  delay: 'border-node-delay bg-node-delay-bg text-node-delay',
  output: 'border-node-output bg-node-output-bg text-node-output',
};

interface NodeLibraryProps {
  className?: string;
}

export default function NodeLibrary({ className }: NodeLibraryProps) {
  const nodeTypes: NodeType[] = ['trigger', 'action', 'condition', 'delay', 'output'];

  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={cn('flex flex-col h-full bg-card border-r border-border', className)}>
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wider">Node Library</h2>
        <p className="text-xs text-muted-foreground mt-1">Drag nodes to the canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {nodeTypes.map((type) => {
          const config = NODE_TYPE_CONFIG[type];
          const Icon = iconMap[type];
          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => onDragStart(e, type)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing',
                'hover:shadow-md transition-all duration-200 hover:-translate-y-0.5',
                'select-none',
                colorMap[type]
              )}
            >
              <GripVertical className="h-4 w-4 opacity-40" />
              <Icon className="h-5 w-5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{config.label}</div>
                <div className="text-xs opacity-70">{config.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
