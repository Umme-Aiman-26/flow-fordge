import { useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import WorkflowNodeComponent from './WorkflowNode';
import { useWorkflowStore } from '@/stores/workflowStore';
import { NODE_TYPE_CONFIG, type NodeType } from '@/types/workflow';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNodeComponent,
};

interface WorkflowCanvasProps {
  className?: string;
}

export default function WorkflowCanvas({ className }: WorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const store = useWorkflowStore();

  // Convert store nodes to React Flow nodes
  const rfNodes: Node[] = useMemo(() =>
    store.nodes.map(n => ({
      id: n.id,
      type: 'workflowNode',
      position: n.position,
      selected: n.id === store.selectedNodeId,
      data: { ...n.data, _nodeType: n.type },
    })),
    [store.nodes, store.selectedNodeId]
  );

  const rfEdges: Edge[] = useMemo(() =>
    store.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      animated: store.executingNodeId === e.source,
      style: {
        stroke: store.executingNodeId === e.source ? 'hsl(185, 90%, 55%)' : 'hsl(var(--muted-foreground))',
        strokeWidth: store.executingNodeId === e.source ? 3 : 2,
      },
      className: store.executingNodeId === e.source ? 'edge-executing' : '',
    })),
    [store.edges, store.executingNodeId]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  // Sync React Flow state back to store
  useEffect(() => {
    setNodes(rfNodes);
  }, [rfNodes, setNodes]);

  useEffect(() => {
    setEdges(rfEdges);
  }, [rfEdges, setEdges]);

  const onConnect = useCallback((params: Connection) => {
    // Prevent self-connections
    if (params.source === params.target) return;
    
    // Prevent duplicate connections
    const exists = store.edges.some(
      e => e.source === params.source && e.target === params.target
    );
    if (exists) return;

    const edgeId = `edge_${params.source}_${params.target}_${Date.now()}`;
    store.addEdge({
      id: edgeId,
      source: params.source!,
      target: params.target!,
      sourceHandle: params.sourceHandle || undefined,
      targetHandle: params.targetHandle || undefined,
    });
  }, [store]);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow') as NodeType;
    if (!type || !NODE_TYPE_CONFIG[type]) return;

    const wrapper = reactFlowWrapper.current;
    if (!wrapper) return;

    const bounds = wrapper.getBoundingClientRect();
    const position = {
      x: event.clientX - bounds.left - 80,
      y: event.clientY - bounds.top - 25,
    };

    store.addNode(type, position);
  }, [store]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
    store.moveNode(node.id, node.position);
  }, [store]);

  const onPaneClick = useCallback(() => {
    store.selectNode(null);
  }, [store]);

  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    store.deleteEdge(edge.id);
  }, [store]);

  return (
    <div ref={reactFlowWrapper} className={cn('flex-1 h-full', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} className="!bg-background" />
        <Controls className="!bg-card !border-border !rounded-lg !shadow-md [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted" />
        <MiniMap
          nodeStrokeWidth={3}
          className="!bg-card !border-border"
          maskColor="hsl(var(--background) / 0.7)"
        />
        {store.nodes.length === 0 && (
          <Panel position="top-center" className="!top-1/3">
            <div className="text-center pointer-events-none">
              <p className="text-lg font-medium text-muted-foreground">Drop nodes here to build your workflow</p>
              <p className="text-sm text-muted-foreground mt-1">Drag from the sidebar or click a node type</p>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
