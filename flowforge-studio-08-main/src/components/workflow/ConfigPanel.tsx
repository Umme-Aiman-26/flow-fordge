import { X } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { NODE_TYPE_CONFIG } from '@/types/workflow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfigPanelProps {
  className?: string;
}

export default function ConfigPanel({ className }: ConfigPanelProps) {
  const selectedNodeId = useWorkflowStore(s => s.selectedNodeId);
  const nodes = useWorkflowStore(s => s.nodes);
  const updateNode = useWorkflowStore(s => s.updateNode);
  const selectNode = useWorkflowStore(s => s.selectNode);
  const deleteNode = useWorkflowStore(s => s.deleteNode);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className={cn('flex flex-col h-full bg-card border-l border-border', className)}>
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wider">Configuration</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-muted-foreground text-center">
            Select a node to configure its properties
          </p>
        </div>
      </div>
    );
  }

  const config = NODE_TYPE_CONFIG[selectedNode.type];

  const handleChange = (key: string, value: unknown) => {
    updateNode(selectedNode.id, { [key]: value });
  };

  return (
    <div className={cn('flex flex-col h-full bg-card border-l border-border', className)}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wider">Configuration</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{config.label} Node</p>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Label</Label>
          <Input
            value={(selectedNode.data.label as string) || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Description</Label>
          <Textarea
            value={(selectedNode.data.description as string) || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            className="text-sm min-h-[60px] resize-none"
            rows={2}
          />
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Settings</p>
          {config.configFields.map((field) => (
            <div key={field.key} className="space-y-1.5 mb-3">
              <Label className="text-xs font-medium text-muted-foreground">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {field.type === 'select' && field.options ? (
                <Select
                  value={(selectedNode.data[field.key] as string) || ''}
                  onValueChange={(v) => handleChange(field.key, v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'textarea' ? (
                <Textarea
                  value={(selectedNode.data[field.key] as string) || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="text-sm min-h-[60px] resize-none"
                />
              ) : (
                <Input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={(selectedNode.data[field.key] as string | number) ?? ''}
                  onChange={(e) => handleChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                  className="h-8 text-sm"
                />
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-4">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => {
              deleteNode(selectedNode.id);
            }}
          >
            Delete Node
          </Button>
        </div>
      </div>
    </div>
  );
}
