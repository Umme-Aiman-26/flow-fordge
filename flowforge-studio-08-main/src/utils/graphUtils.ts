import type { WorkflowNode, WorkflowEdge } from '@/types/workflow';

/**
 * Detect cycles in the workflow graph using DFS
 */
export function detectCycles(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  const adjacency = new Map<string, string[]>();
  nodes.forEach(n => adjacency.set(n.id, []));
  edges.forEach(e => {
    const list = adjacency.get(e.source);
    if (list) list.push(e.target);
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true;
    }
  }

  return false;
}

/**
 * Topological sort using Kahn's algorithm
 * Returns null if cycle detected
 */
export function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] | null {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  nodes.forEach(n => {
    inDegree.set(n.id, 0);
    adjacency.set(n.id, []);
  });

  edges.forEach(e => {
    adjacency.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  });

  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    for (const neighbor of adjacency.get(current) || []) {
      const newDeg = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  if (sorted.length !== nodes.length) return null;

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  return sorted.map(id => nodeMap.get(id)!);
}

/**
 * Find all root nodes (no incoming edges)
 */
export function findRootNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const targets = new Set(edges.map(e => e.target));
  return nodes.filter(n => !targets.has(n.id));
}

/**
 * Get downstream nodes from a given node
 */
export function getDownstreamNodes(nodeId: string, edges: WorkflowEdge[]): string[] {
  const downstream: string[] = [];
  const adjacency = new Map<string, string[]>();
  edges.forEach(e => {
    if (!adjacency.has(e.source)) adjacency.set(e.source, []);
    adjacency.get(e.source)!.push(e.target);
  });

  const visited = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of adjacency.get(current) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        downstream.push(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return downstream;
}
