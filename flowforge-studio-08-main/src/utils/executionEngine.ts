import type { WorkflowNode, WorkflowEdge, ExecutionLog } from '@/types/workflow';
import { topologicalSort } from './graphUtils';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface ExecutionCallbacks {
  onNodeStart: (nodeId: string, log: ExecutionLog) => void;
  onNodeComplete: (nodeId: string, log: ExecutionLog) => void;
  onProgress: (progress: number) => void;
  onComplete: () => void;
  onError: (error: string) => void;
}

function simulateNode(node: WorkflowNode): { success: boolean; message: string; duration: number } {
  // Simulate different execution times and outcomes
  const random = Math.random();
  const baseDuration = node.type === 'delay' 
    ? Math.min(Number(node.data.duration) || 1000, 2000) 
    : 600 + Math.random() * 800;

  switch (node.type) {
    case 'trigger':
      return { success: true, message: `Trigger "${node.data.triggerType}" fired successfully`, duration: baseDuration };
    case 'action':
      return {
        success: random > 0.1,
        message: random > 0.1 
          ? `Action "${node.data.actionType}" completed` 
          : `Action "${node.data.actionType}" failed: timeout`,
        duration: baseDuration,
      };
    case 'condition':
      return {
        success: true,
        message: `Condition evaluated: ${node.data.field} ${node.data.operator} ${node.data.value} → ${random > 0.5 ? 'true' : 'false'}`,
        duration: baseDuration * 0.5,
      };
    case 'delay':
      return { success: true, message: `Waited ${node.data.duration}${node.data.unit}`, duration: baseDuration };
    case 'output':
      return { success: true, message: `Output: ${node.data.message || node.data.outputType}`, duration: baseDuration * 0.5 };
    default:
      return { success: true, message: 'Executed', duration: baseDuration };
  }
}

export async function executeWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  callbacks: ExecutionCallbacks
): Promise<void> {
  const sorted = topologicalSort(nodes, edges);
  
  if (!sorted) {
    callbacks.onError('Cannot execute: workflow contains cycles.');
    return;
  }

  const total = sorted.length;

  for (let i = 0; i < sorted.length; i++) {
    const node = sorted[i];
    
    const startLog: ExecutionLog = {
      nodeId: node.id,
      nodeName: node.data.label,
      status: 'running',
      message: `Executing "${node.data.label}"...`,
      timestamp: Date.now(),
    };
    callbacks.onNodeStart(node.id, startLog);

    const result = simulateNode(node);
    await delay(result.duration);

    const endLog: ExecutionLog = {
      nodeId: node.id,
      nodeName: node.data.label,
      status: result.success ? 'success' : 'failure',
      message: result.message,
      timestamp: Date.now(),
    };
    callbacks.onNodeComplete(node.id, endLog);
    callbacks.onProgress(((i + 1) / total) * 100);

    if (!result.success) {
      callbacks.onError(`Execution failed at "${node.data.label}": ${result.message}`);
      return;
    }
  }

  callbacks.onComplete();
}
