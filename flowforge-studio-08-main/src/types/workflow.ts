export type NodeType = 'trigger' | 'action' | 'condition' | 'delay' | 'output';

export interface NodeConfig {
  label: string;
  description?: string;
  [key: string]: unknown;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeConfig;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  nodeId?: string;
}

export interface ExecutionLog {
  nodeId: string;
  nodeName: string;
  status: 'pending' | 'running' | 'success' | 'failure' | 'skipped';
  message: string;
  timestamp: number;
}

export interface ExecutionState {
  isRunning: boolean;
  currentNodeId: string | null;
  logs: ExecutionLog[];
  progress: number;
}

export const NODE_TYPE_CONFIG: Record<NodeType, {
  label: string;
  icon: string;
  description: string;
  defaultConfig: Record<string, unknown>;
  configFields: ConfigField[];
}> = {
  trigger: {
    label: 'Trigger',
    icon: 'Zap',
    description: 'Starts the workflow',
    defaultConfig: { triggerType: 'manual', schedule: '' },
    configFields: [
      { key: 'triggerType', label: 'Trigger Type', type: 'select', options: ['manual', 'scheduled', 'webhook'], required: true },
      { key: 'schedule', label: 'Schedule (cron)', type: 'text', required: false },
    ],
  },
  action: {
    label: 'Action',
    icon: 'Play',
    description: 'Performs an operation',
    defaultConfig: { actionType: 'http_request', url: '', method: 'GET' },
    configFields: [
      { key: 'actionType', label: 'Action Type', type: 'select', options: ['http_request', 'transform_data', 'send_email', 'log_message'], required: true },
      { key: 'url', label: 'URL', type: 'text', required: false },
      { key: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'], required: false },
    ],
  },
  condition: {
    label: 'Condition',
    icon: 'GitBranch',
    description: 'Branches the flow',
    defaultConfig: { field: '', operator: 'equals', value: '' },
    configFields: [
      { key: 'field', label: 'Field', type: 'text', required: true },
      { key: 'operator', label: 'Operator', type: 'select', options: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains'], required: true },
      { key: 'value', label: 'Value', type: 'text', required: true },
    ],
  },
  delay: {
    label: 'Delay',
    icon: 'Clock',
    description: 'Waits before continuing',
    defaultConfig: { duration: 1000, unit: 'ms' },
    configFields: [
      { key: 'duration', label: 'Duration', type: 'number', required: true },
      { key: 'unit', label: 'Unit', type: 'select', options: ['ms', 's', 'm'], required: true },
    ],
  },
  output: {
    label: 'Output',
    icon: 'CheckCircle',
    description: 'Ends the workflow',
    defaultConfig: { outputType: 'log', message: '' },
    configFields: [
      { key: 'outputType', label: 'Output Type', type: 'select', options: ['log', 'webhook', 'store'], required: true },
      { key: 'message', label: 'Message', type: 'text', required: false },
    ],
  },
};

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: string[];
  required: boolean;
}
