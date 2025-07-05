import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  ConnectionMode,
  Panel,
  Handle,
  Position,
  NodeProps,
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  FileText, 
  Search, 
  Wrench, 
  Users, 
  ClipboardList, 
  CheckCircle, 
  Archive,
  Save,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  X,
  MessageSquare,
  Phone,
  BarChart3,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCw
} from 'lucide-react';

// Define the node types with their properties
const nodeTypes = [
  {
    id: 'email-notification',
    type: 'custom',
    label: 'Email Notification',
    icon: Mail,
    color: 'bg-blue-100 border-blue-300 text-blue-800',
    description: 'Send automated email notifications'
  },
  {
    id: 'sms-notification',
    type: 'custom',
    label: 'SMS Notification',
    icon: MessageSquare,
    color: 'bg-cyan-100 border-cyan-300 text-cyan-800',
    description: 'Send SMS text message notifications'
  },
  {
    id: 'whatsapp-notification',
    type: 'custom',
    label: 'WhatsApp Notification',
    icon: Phone,
    color: 'bg-green-100 border-green-400 text-green-800',
    description: 'Send WhatsApp message notifications'
  },
  {
    id: 'complaint-planning',
    type: 'custom',
    label: 'Complaint Planning',
    icon: FileText,
    color: 'bg-green-100 border-green-300 text-green-800',
    description: 'Plan and organize complaint response'
  },
  {
    id: 'field-verification',
    type: 'custom',
    label: 'Field Verification',
    icon: Search,
    color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    description: 'Verify complaint details on-site'
  },
  {
    id: 'field-work',
    type: 'custom',
    label: 'Field Work',
    icon: Wrench,
    color: 'bg-orange-100 border-orange-300 text-orange-800',
    description: 'Perform field work activities'
  },
  {
    id: 'field-contract-work',
    type: 'custom',
    label: 'Field Contract Work',
    icon: Users,
    color: 'bg-purple-100 border-purple-300 text-purple-800',
    description: 'Coordinate with contract workers'
  },
  {
    id: 'work-status-report',
    type: 'custom',
    label: 'Work Status Periodic Report',
    icon: ClipboardList,
    color: 'bg-indigo-100 border-indigo-300 text-indigo-800',
    description: 'Generate periodic status reports'
  },
  {
    id: 'analytics-reporting',
    type: 'custom',
    label: 'Advanced Analytics & Reporting',
    icon: BarChart3,
    color: 'bg-pink-100 border-pink-300 text-pink-800',
    description: 'Generate advanced analytics and reports'
  },
  {
    id: 'work-completion',
    type: 'custom',
    label: 'Work Completion',
    icon: CheckCircle,
    color: 'bg-emerald-100 border-emerald-300 text-emerald-800',
    description: 'Mark work as completed'
  },
  {
    id: 'work-review-closure',
    type: 'custom',
    label: 'Work Review and Closure',
    icon: Archive,
    color: 'bg-gray-100 border-gray-300 text-gray-800',
    description: 'Review and close the workflow'
  }
];

// Helper function to create initial nodes with delete callbacks
const createInitialNodes = (onDeleteNode: (id: string) => void): Node[] => [
  {
    id: '1',
    type: 'custom',
    position: { x: 100, y: 100 },
    data: { 
      label: 'Email Notification',
      icon: Mail,
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      description: 'Send automated email notifications',
      onDelete: onDeleteNode
    },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 100, y: 220 },
    data: { 
      label: 'SMS Notification',
      icon: MessageSquare,
      color: 'bg-cyan-100 border-cyan-300 text-cyan-800',
      description: 'Send SMS text message notifications',
      onDelete: onDeleteNode
    },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 100, y: 340 },
    data: { 
      label: 'WhatsApp Notification',
      icon: Phone,
      color: 'bg-green-100 border-green-400 text-green-800',
      description: 'Send WhatsApp message notifications',
      onDelete: onDeleteNode
    },
  },
  {
    id: '4',
    type: 'custom',
    position: { x: 350, y: 100 },
    data: { 
      label: 'Complaint Planning',
      icon: FileText,
      color: 'bg-green-100 border-green-300 text-green-800',
      description: 'Plan and organize complaint response',
      onDelete: onDeleteNode
    },
  },
  {
    id: '5',
    type: 'custom',
    position: { x: 350, y: 220 },
    data: { 
      label: 'Field Verification',
      icon: Search,
      color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      description: 'Verify complaint details on-site',
      onDelete: onDeleteNode
    },
  },
  {
    id: '6',
    type: 'custom',
    position: { x: 350, y: 340 },
    data: { 
      label: 'Field Work',
      icon: Wrench,
      color: 'bg-orange-100 border-orange-300 text-orange-800',
      description: 'Perform field work activities',
      onDelete: onDeleteNode
    },
  },
  {
    id: '7',
    type: 'custom',
    position: { x: 600, y: 100 },
    data: { 
      label: 'Advanced Analytics & Reporting',
      icon: BarChart3,
      color: 'bg-pink-100 border-pink-300 text-pink-800',
      description: 'Generate advanced analytics and reports',
      onDelete: onDeleteNode
    },
  },
  {
    id: '8',
    type: 'custom',
    position: { x: 600, y: 220 },
    data: { 
      label: 'Work Completion',
      icon: CheckCircle,
      color: 'bg-emerald-100 border-emerald-300 text-emerald-800',
      description: 'Mark work as completed',
      onDelete: onDeleteNode
    },
  },
  {
    id: '9',
    type: 'custom',
    position: { x: 600, y: 340 },
    data: { 
      label: 'Work Review and Closure',
      icon: Archive,
      color: 'bg-gray-100 border-gray-300 text-gray-800',
      description: 'Review and close the workflow',
      onDelete: onDeleteNode
    },
  },
];

// Helper function to create initial edges with delete callbacks  
const createInitialEdges = (onDeleteEdge: (id: string) => void): Edge[] => [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'default',
    animated: true,
    label: 'Process',
    data: { onDelete: onDeleteEdge }
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    type: 'default',
    animated: true,
    label: 'Process',
    data: { onDelete: onDeleteEdge }
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    type: 'bidirectional',
    animated: true,
    label: 'Sync',
    data: { onDelete: onDeleteEdge }
  },
  {
    id: 'e4-5',
    source: '4',
    target: '5',
    type: 'conditional',
    animated: true,
    label: 'If Approved',
    data: { onDelete: onDeleteEdge, condition: true }
  },
  {
    id: 'e5-6',
    source: '5',
    target: '6',
    type: 'default',
    animated: true,
    label: 'Process',
    data: { onDelete: onDeleteEdge }
  },
  {
    id: 'e6-7',
    source: '6',
    target: '7',
    type: 'default',
    animated: true,
    label: 'Process',
    data: { onDelete: onDeleteEdge }
  },
  {
    id: 'e7-8',
    source: '7',
    target: '8',
    type: 'default',
    animated: true,
    label: 'Process',
    data: { onDelete: onDeleteEdge }
  },
];

// Custom node component with handles and delete button
const CustomNode = ({ data, id }: NodeProps) => {
  const Icon = data.icon;
  
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg border-2 ${data.color} min-w-[200px] relative group`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        isConnectable={true}
      />
      
      {/* Delete Button */}
      <button
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          data.onDelete?.(id);
        }}
      >
        <X className="h-3 w-3" />
      </button>
      
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      <div className="text-xs opacity-80">{data.description}</div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        isConnectable={true}
      />
    </div>
  );
};

// Custom edge component with delete button and labels
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data, label }: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} style={style} markerEnd="url(#arrow)" />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-2 py-1 shadow-md border">
            {label && (
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {label}
              </span>
            )}
            <button
              className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                data?.onDelete?.(id);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// Bidirectional edge component
const BidirectionalEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data, label }: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} style={style} markerStart="url(#arrow)" markerEnd="url(#arrow)" />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-2 py-1 shadow-md border">
            {label && (
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                {label}
              </span>
            )}
            <button
              className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                data?.onDelete?.(id);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// Conditional edge component
const ConditionalEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data, label }: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isTrue = data?.condition !== false;

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        style={{
          ...style,
          stroke: isTrue ? '#10b981' : '#ef4444',
          strokeDasharray: isTrue ? '0' : '5,5',
        }} 
        markerEnd="url(#arrow)" 
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className={`flex items-center gap-2 rounded-lg px-2 py-1 shadow-md border ${
            isTrue 
              ? 'bg-green-100 dark:bg-green-900 border-green-300' 
              : 'bg-red-100 dark:bg-red-900 border-red-300'
          }`}>
            <span className={`text-xs font-medium ${
              isTrue 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-red-700 dark:text-red-300'
            }`}>
              {label || (isTrue ? 'Yes' : 'No')}
            </span>
            <button
              className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                data?.onDelete?.(id);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// Self-connecting edge component
const SelfConnectingEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data, label }: EdgeProps) => {
  // Create a self-loop path
  const offset = 50;
  const path = `M ${sourceX} ${sourceY} C ${sourceX + offset} ${sourceY - offset}, ${sourceX + offset} ${sourceY + offset}, ${sourceX} ${sourceY}`;
  
  return (
    <>
      <path
        d={path}
        style={{
          ...style,
          fill: 'none',
          stroke: '#8b5cf6',
          strokeWidth: 2,
        }}
        markerEnd="url(#arrow)"
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${sourceX + offset}px,${sourceY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900 rounded-lg px-2 py-1 shadow-md border border-purple-300">
            {label && (
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                {label}
              </span>
            )}
            <button
              className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                data?.onDelete?.(id);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const nodeTypes_custom = {
  custom: CustomNode,
};

const edgeTypes_custom = {
  default: CustomEdge,
  custom: CustomEdge,
  bidirectional: BidirectionalEdge,
  conditional: ConditionalEdge,
  selfConnecting: SelfConnectingEdge,
};

export default function WorkflowDesigner() {
  const onDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, []);

  const onDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(createInitialNodes(onDeleteNode));
  const [edges, setEdges, onEdgesChange] = useEdgesState(createInitialEdges(onDeleteEdge));
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [selectedEdgeType, setSelectedEdgeType] = useState<string>('default');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const edgeLabels = {
        default: 'Process',
        bidirectional: 'Sync',
        conditional: 'If True',
        selfConnecting: 'Loop'
      };

      const newEdge = {
        ...params,
        type: selectedEdgeType,
        animated: true,
        label: edgeLabels[selectedEdgeType as keyof typeof edgeLabels] || 'Connect',
        data: { 
          onDelete: onDeleteEdge,
          condition: selectedEdgeType === 'conditional' ? true : undefined
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, onDeleteEdge, selectedEdgeType]
  );

  const onAddNode = useCallback((nodeType: any) => {
    const newNode: Node = {
      id: `${Date.now()}`, // Use timestamp for unique IDs
      type: 'custom',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: {
        label: nodeType.label,
        icon: nodeType.icon,
        color: nodeType.color,
        description: nodeType.description,
        onDelete: onDeleteNode,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, onDeleteNode]);

  const onSaveWorkflow = useCallback(() => {
    const workflowData = {
      nodes,
      edges,
      timestamp: new Date().toISOString(),
    };
    console.log('Saving workflow:', workflowData);
    // TODO: Implement actual save to backend
  }, [nodes, edges]);

  const onResetWorkflow = useCallback(() => {
    setNodes(createInitialNodes(onDeleteNode));
    setEdges(createInitialEdges(onDeleteEdge));
  }, [setNodes, setEdges, onDeleteNode, onDeleteEdge]);

  const onExportWorkflow = useCallback(() => {
    const workflowData = {
      nodes,
      edges,
      timestamp: new Date().toISOString(),
      zoomLevel,
      analytics: {
        totalNodes: nodes.length,
        totalConnections: edges.length,
        nodeTypes: nodes.reduce((acc, node) => {
          const label = node.data.label;
          acc[label] = (acc[label] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        connectionTypes: edges.reduce((acc, edge) => {
          acc[edge.type || 'default'] = (acc[edge.type || 'default'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };
    const dataStr = JSON.stringify(workflowData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `workflow-analytics-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [nodes, edges, zoomLevel]);

  // Advanced zoom and pan controls
  const onZoomIn = useCallback(() => {
    if (reactFlowInstance) {
      const currentZoom = reactFlowInstance.getZoom();
      const newZoom = Math.min(currentZoom * 1.2, 4);
      reactFlowInstance.zoomTo(newZoom);
      setZoomLevel(newZoom);
    }
  }, [reactFlowInstance]);

  const onZoomOut = useCallback(() => {
    if (reactFlowInstance) {
      const currentZoom = reactFlowInstance.getZoom();
      const newZoom = Math.max(currentZoom * 0.8, 0.1);
      reactFlowInstance.zoomTo(newZoom);
      setZoomLevel(newZoom);
    }
  }, [reactFlowInstance]);

  const onFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
      setZoomLevel(reactFlowInstance.getZoom());
    }
  }, [reactFlowInstance]);

  const onCenterView = useCallback(() => {
    if (reactFlowInstance) {
      const center = { x: 400, y: 300 };
      reactFlowInstance.setCenter(center.x, center.y);
    }
  }, [reactFlowInstance]);

  const onInit = useCallback((rfi: any) => {
    setReactFlowInstance(rfi);
    setZoomLevel(rfi.getZoom());
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Workflow Designer
          </CardTitle>
          <CardDescription>
            Design and configure complaint processing workflows using drag-and-drop components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Node Palette */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Available Nodes</h3>
                  <div className="space-y-2">
                    {nodeTypes.map((nodeType) => {
                      const Icon = nodeType.icon;
                      return (
                        <div
                          key={nodeType.id}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-sm ${nodeType.color}`}
                          onClick={() => onAddNode(nodeType)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4" />
                            <span className="text-sm font-medium">{nodeType.label}</span>
                          </div>
                          <p className="text-xs opacity-80">{nodeType.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Connector Types</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        onClick={() => setSelectedEdgeType('default')}
                        variant={selectedEdgeType === 'default' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs justify-start"
                      >
                        🏹 Default with Arrows
                      </Button>
                      <Button
                        onClick={() => setSelectedEdgeType('bidirectional')}
                        variant={selectedEdgeType === 'bidirectional' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs justify-start"
                      >
                        ↔️ Bidirectional
                      </Button>
                      <Button
                        onClick={() => setSelectedEdgeType('conditional')}
                        variant={selectedEdgeType === 'conditional' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs justify-start"
                      >
                        🔀 Conditional
                      </Button>
                      <Button
                        onClick={() => setSelectedEdgeType('selfConnecting')}
                        variant={selectedEdgeType === 'selfConnecting' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs justify-start"
                      >
                        🔄 Self Connecting
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Selected: <strong>{selectedEdgeType}</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Zoom & Pan Controls</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={onZoomIn}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <ZoomIn className="h-3 w-3 mr-1" />
                        Zoom In
                      </Button>
                      <Button
                        onClick={onZoomOut}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <ZoomOut className="h-3 w-3 mr-1" />
                        Zoom Out
                      </Button>
                      <Button
                        onClick={onFitView}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Move className="h-3 w-3 mr-1" />
                        Fit View
                      </Button>
                      <Button
                        onClick={onCenterView}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <RotateCw className="h-3 w-3 mr-1" />
                        Center
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      Zoom: {Math.round(zoomLevel * 100)}%
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Actions</h3>
                  <div className="space-y-2">
                    <Button
                      onClick={onSaveWorkflow}
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Workflow
                    </Button>
                    <Button
                      onClick={onResetWorkflow}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset to Default
                    </Button>
                    <Button
                      onClick={onExportWorkflow}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Analytics
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Advanced Analytics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Total Nodes:</span>
                      <Badge variant="secondary">{nodes.length}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Connections:</span>
                      <Badge variant="secondary">{edges.length}</Badge>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium mb-1">Node Types:</div>
                      {Object.entries(
                        nodes.reduce((acc, node) => {
                          const label = node.data.label;
                          acc[label] = (acc[label] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([type, count]) => (
                        <div key={type} className="flex justify-between text-xs py-1">
                          <span className="truncate">{type}:</span>
                          <Badge variant="outline" className="text-xs">{count}</Badge>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium mb-1">Connection Types:</div>
                      {Object.entries(
                        edges.reduce((acc, edge) => {
                          const type = edge.type || 'default';
                          acc[type] = (acc[type] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([type, count]) => (
                        <div key={type} className="flex justify-between text-xs py-1">
                          <span className="capitalize">{type}:</span>
                          <Badge variant="outline" className="text-xs">{count}</Badge>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium mb-1">Workflow Complexity:</div>
                      <div className="text-xs text-muted-foreground">
                        {nodes.length < 5 ? "Simple" : 
                         nodes.length < 10 ? "Moderate" : 
                         nodes.length < 15 ? "Complex" : "Very Complex"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow Canvas */}
            <div className="lg:col-span-3">
              <div className="border rounded-lg bg-gray-50 dark:bg-gray-900" style={{ height: '600px' }}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onInit={onInit}
                  nodeTypes={nodeTypes_custom}
                  edgeTypes={edgeTypes_custom}
                  connectionMode={ConnectionMode.Loose}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                >
                  <Background color="#aaa" gap={16} />
                  <Controls />
                  <MiniMap />
                  <Panel position="top-right">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg">
                      <div className="text-xs text-muted-foreground">
                        Drag nodes to reposition • Click and drag between handles to connect
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Selected connector: <strong>{selectedEdgeType}</strong>
                      </div>
                    </div>
                  </Panel>
                  <svg>
                    <defs>
                      <marker
                        id="arrow"
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="3"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto"
                      >
                        <path d="m0,0 l0,6 l9,3 l-9,3 l0,6" style={{ fill: '#b1b1b7' }} />
                      </marker>
                    </defs>
                  </svg>
                </ReactFlow>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}