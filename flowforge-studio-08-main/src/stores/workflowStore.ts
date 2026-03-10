import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { NODE_TYPE_CONFIG, type WorkflowNode, type WorkflowEdge, type ExecutionLog, type ValidationError, type NodeType } from '@/types/workflow';

interface WorkflowSnapshot {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface WorkflowState {
  // Workflow data
  workflowName: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;

  // Undo/Redo
  past: WorkflowSnapshot[];
  future: WorkflowSnapshot[];

  // Execution
  isExecuting: boolean;
  executingNodeId: string | null;
  executionLogs: ExecutionLog[];
  executionProgress: number;

  // Validation
  validationErrors: ValidationError[];

  // UI
  showExecutionPanel: boolean;

  // Actions
  setWorkflowName: (name: string) => void;
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNode: (id: string, data: Partial<WorkflowNode['data']>) => void;
  deleteNode: (id: string) => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  addEdge: (edge: WorkflowEdge) => void;
  deleteEdge: (id: string) => void;
  selectNode: (id: string | null) => void;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  saveSnapshot: () => void;

  // Execution
  setExecuting: (running: boolean) => void;
  setExecutingNode: (nodeId: string | null) => void;
  addExecutionLog: (log: ExecutionLog) => void;
  clearExecutionLogs: () => void;
  setExecutionProgress: (progress: number) => void;
  setShowExecutionPanel: (show: boolean) => void;

  // Validation
  setValidationErrors: (errors: ValidationError[]) => void;

  // Persistence
  loadWorkflow: (data: { name: string; nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => void;
  exportWorkflow: () => string;
  clearWorkflow: () => void;
}

let nodeIdCounter = 0;

const generateNodeId = () => {
  nodeIdCounter++;
  return `node_${Date.now()}_${nodeIdCounter}`;
};

const STORAGE_KEY = 'flowforge_workflow';

const loadFromStorage = (): Partial<WorkflowState> | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        workflowName: parsed.name || 'Untitled Workflow',
        nodes: parsed.nodes || [],
        edges: parsed.edges || [],
      };
    }
  } catch {
    // ignore
  }
  return null;
};

const saveToStorage = (state: { workflowName: string; nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      name: state.workflowName,
      nodes: state.nodes,
      edges: state.edges,
      savedAt: new Date().toISOString(),
    }));
  } catch {
    // ignore
  }
};

const initial = loadFromStorage();

export const useWorkflowStore = create<WorkflowState>()(
  subscribeWithSelector((set, get) => ({
    workflowName: initial?.workflowName || 'Untitled Workflow',
    nodes: initial?.nodes || [],
    edges: initial?.edges || [],
    selectedNodeId: null,
    past: [],
    future: [],
    isExecuting: false,
    executingNodeId: null,
    executionLogs: [],
    executionProgress: 0,
    validationErrors: [],
    showExecutionPanel: false,

    setWorkflowName: (name) => {
      set({ workflowName: name });
      const s = get();
      saveToStorage({ workflowName: name, nodes: s.nodes, edges: s.edges });
    },

    saveSnapshot: () => {
      const { nodes, edges, past } = get();
      set({
        past: [...past.slice(-49), { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }],
        future: [],
      });
    },

    addNode: (type, position) => {
      const config = NODE_TYPE_CONFIG[type];
      get().saveSnapshot();
      const id = generateNodeId();
      const newNode: WorkflowNode = {
        id,
        type,
        position,
        data: {
          label: config.label,
          description: config.description,
          ...config.defaultConfig,
        },
      };
      const nodes = [...get().nodes, newNode];
      set({ nodes });
      saveToStorage({ workflowName: get().workflowName, nodes, edges: get().edges });
    },

    updateNode: (id, data) => {
      get().saveSnapshot();
      const nodes = get().nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n);
      set({ nodes });
      saveToStorage({ workflowName: get().workflowName, nodes, edges: get().edges });
    },

    deleteNode: (id) => {
      get().saveSnapshot();
      const nodes = get().nodes.filter(n => n.id !== id);
      const edges = get().edges.filter(e => e.source !== id && e.target !== id);
      set({ nodes, edges, selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId });
      saveToStorage({ workflowName: get().workflowName, nodes, edges });
    },

    moveNode: (id, position) => {
      const nodes = get().nodes.map(n => n.id === id ? { ...n, position } : n);
      set({ nodes });
      saveToStorage({ workflowName: get().workflowName, nodes, edges: get().edges });
    },

    addEdge: (edge) => {
      get().saveSnapshot();
      const edges = [...get().edges, edge];
      set({ edges });
      saveToStorage({ workflowName: get().workflowName, nodes: get().nodes, edges });
    },

    deleteEdge: (id) => {
      get().saveSnapshot();
      const edges = get().edges.filter(e => e.id !== id);
      set({ edges });
      saveToStorage({ workflowName: get().workflowName, nodes: get().nodes, edges });
    },

    selectNode: (id) => set({ selectedNodeId: id }),

    setNodes: (nodes) => {
      set({ nodes });
      saveToStorage({ workflowName: get().workflowName, nodes, edges: get().edges });
    },

    setEdges: (edges) => {
      set({ edges });
      saveToStorage({ workflowName: get().workflowName, nodes: get().nodes, edges });
    },

    undo: () => {
      const { past, nodes, edges, future } = get();
      if (past.length === 0) return;
      const prev = past[past.length - 1];
      set({
        past: past.slice(0, -1),
        future: [{ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }, ...future],
        nodes: prev.nodes,
        edges: prev.edges,
      });
      saveToStorage({ workflowName: get().workflowName, nodes: prev.nodes, edges: prev.edges });
    },

    redo: () => {
      const { future, nodes, edges, past } = get();
      if (future.length === 0) return;
      const next = future[0];
      set({
        future: future.slice(1),
        past: [...past, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }],
        nodes: next.nodes,
        edges: next.edges,
      });
      saveToStorage({ workflowName: get().workflowName, nodes: next.nodes, edges: next.edges });
    },

    setExecuting: (running) => set({ isExecuting: running }),
    setExecutingNode: (nodeId) => set({ executingNodeId: nodeId }),
    addExecutionLog: (log) => set({ executionLogs: [...get().executionLogs, log] }),
    clearExecutionLogs: () => set({ executionLogs: [], executionProgress: 0, executingNodeId: null }),
    setExecutionProgress: (progress) => set({ executionProgress: progress }),
    setShowExecutionPanel: (show) => set({ showExecutionPanel: show }),

    setValidationErrors: (errors) => set({ validationErrors: errors }),

    loadWorkflow: (data) => {
      set({
        workflowName: data.name,
        nodes: data.nodes,
        edges: data.edges,
        past: [],
        future: [],
        selectedNodeId: null,
        executionLogs: [],
        validationErrors: [],
      });
      saveToStorage({ workflowName: data.name, nodes: data.nodes, edges: data.edges });
    },

    exportWorkflow: () => {
      const { workflowName, nodes, edges } = get();
      return JSON.stringify({
        name: workflowName,
        nodes,
        edges,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      }, null, 2);
    },

    clearWorkflow: () => {
      get().saveSnapshot();
      set({ nodes: [], edges: [], selectedNodeId: null, validationErrors: [], executionLogs: [] });
      saveToStorage({ workflowName: get().workflowName, nodes: [], edges: [] });
    },
  }))
);
