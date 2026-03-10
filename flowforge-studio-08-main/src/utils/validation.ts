import type { WorkflowNode, WorkflowEdge, ValidationError } from '@/types/workflow';
import { NODE_TYPE_CONFIG } from '@/types/workflow';
import { detectCycles } from './graphUtils';

export function validateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check empty workflow
  if (nodes.length === 0) {
    errors.push({ type: 'error', message: 'Workflow is empty. Add at least one node.' });
    return errors;
  }

  // Check for at least one trigger node
  const triggerNodes = nodes.filter(n => n.type === 'trigger');
  if (triggerNodes.length === 0) {
    errors.push({ type: 'error', message: 'Workflow must have at least one Trigger node.' });
  }

  // Check for cycles
  if (detectCycles(nodes, edges)) {
    errors.push({ type: 'error', message: 'Workflow contains cyclic dependencies.' });
  }

  // Check required config fields
  nodes.forEach(node => {
    const config = NODE_TYPE_CONFIG[node.type];
    config.configFields.forEach(field => {
      if (field.required) {
        const value = node.data[field.key];
        if (value === undefined || value === null || value === '') {
          errors.push({
            type: 'warning',
            message: `"${node.data.label}" is missing required field: ${field.label}`,
            nodeId: node.id,
          });
        }
      }
    });
  });

  // Check for disconnected nodes (no edges at all)
  if (nodes.length > 1) {
    const connectedNodes = new Set<string>();
    edges.forEach(e => {
      connectedNodes.add(e.source);
      connectedNodes.add(e.target);
    });
    nodes.forEach(node => {
      if (!connectedNodes.has(node.id)) {
        errors.push({
          type: 'warning',
          message: `"${node.data.label}" is not connected to any other node.`,
          nodeId: node.id,
        });
      }
    });
  }

  return errors;
}
