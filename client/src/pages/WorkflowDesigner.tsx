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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
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
  RotateCw,
  FolderOpen,
  Settings,
  Play,
  Square,
  GitBranch,
  Shield,
  Eye,
  Gavel,
  Building,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

// Define the node types with their properties
const nodeTypes = [
  // Core workflow nodes
  {
    id: 'start',
    type: 'custom',
    label: 'Start',
    icon: Play,
    color: 'bg-green-100 border-green-400 text-green-800',
    description: 'Start point of the workflow'
  },
  {
    id: 'end',
    type: 'custom',
    label: 'End',
    icon: Square,
    color: 'bg-red-100 border-red-400 text-red-800',
    description: 'End point of the workflow'
  },
  {
    id: 'task',
    type: 'custom',
    label: 'Task',
    icon: CheckCircle,
    color: 'bg-blue-100 border-blue-300 text-blue-800',
    description: 'General task or activity'
  },
  {
    id: 'decision',
    type: 'custom',
    label: 'Decision',
    icon: GitBranch,
    color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    description: 'Decision point with multiple outcomes'
  },
  // Specific task nodes for Air Quality workflows
  {
    id: 'initial-inspection',
    type: 'custom',
    label: 'Initial Inspection',
    icon: Eye,
    color: 'bg-indigo-100 border-indigo-300 text-indigo-800',
    description: 'Conduct initial field inspection'
  },
  {
    id: 'assessment',
    type: 'custom',
    label: 'Assessment',
    icon: Search,
    color: 'bg-purple-100 border-purple-300 text-purple-800',
    description: 'Assess findings and determine next steps'
  },
  {
    id: 'enforcement',
    type: 'custom',
    label: 'Enforcement Action',
    icon: Gavel,
    color: 'bg-orange-100 border-orange-400 text-orange-800',
    description: 'Take enforcement action for violations'
  },
  {
    id: 'resolution',
    type: 'custom',
    label: 'Resolution',
    icon: CheckCircle,
    color: 'bg-emerald-100 border-emerald-300 text-emerald-800',
    description: 'Resolve the complaint or issue'
  },
  // Specific task nodes for Demolition workflows
  {
    id: 'permit-verification',
    type: 'custom',
    label: 'Permit Verification',
    icon: Shield,
    color: 'bg-teal-100 border-teal-300 text-teal-800',
    description: 'Verify demolition permits and documentation'
  },
  {
    id: 'safety-inspection',
    type: 'custom',
    label: 'Safety Inspection',
    icon: AlertTriangle,
    color: 'bg-amber-100 border-amber-400 text-amber-800',
    description: 'Conduct safety inspection for demolition'
  },
  {
    id: 'approve-demolition',
    type: 'custom',
    label: 'Approve Demolition',
    icon: CheckCircle,
    color: 'bg-green-100 border-green-400 text-green-800',
    description: 'Approve the demolition request'
  },
  {
    id: 'reject-demolition',
    type: 'custom',
    label: 'Reject Demolition',
    icon: X,
    color: 'bg-red-100 border-red-400 text-red-800',
    description: 'Reject the demolition request'
  },
  // Notification nodes
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

// Custom node component with handles, delete button, and configuration
const CustomNode = ({ data, id }: NodeProps) => {
  const Icon = data.icon;
  const [showConfig, setShowConfig] = useState(false);
  const [nodeConfig, setNodeConfig] = useState(data.config || {});
  
  const handleConfigSave = useCallback((config: any) => {
    setNodeConfig(config);
    data.onConfigUpdate?.(id, config);
    setShowConfig(false);
  }, [id, data]);
  
  const isConfigurable = data.label === 'Email Notification' || data.label === 'SMS Notification' || data.label === 'WhatsApp Notification';
  
  return (
    <>
      <div className={`px-4 py-3 shadow-md rounded-lg border-2 ${data.color} min-w-[200px] relative group`}>
        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-4 h-4 bg-blue-500 border-2 border-white shadow-md hover:bg-blue-600 transition-colors"
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
        
        {/* Config Button */}
        {isConfigurable && (
          <button
            className="absolute -top-2 -left-2 bg-blue-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setShowConfig(true);
            }}
          >
            <Settings className="h-3 w-3" />
          </button>
        )}
        
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4" />
          <div className="font-medium text-sm">{data.label}</div>
        </div>
        <div className="text-xs opacity-80">{data.description}</div>
        
        {/* Show configuration status */}
        {isConfigurable && Object.keys(nodeConfig).length > 0 && (
          <div className="text-xs text-blue-600 mt-1">✓ Configured</div>
        )}
        
        {/* Output Handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-4 h-4 bg-green-500 border-2 border-white shadow-md hover:bg-green-600 transition-colors"
          isConnectable={true}
        />
      </div>
      
      {/* Configuration Dialog */}
      {showConfig && (
        <NodeConfigDialog
          nodeId={id}
          nodeLabel={data.label}
          currentConfig={nodeConfig}
          onSave={handleConfigSave}
          onClose={() => setShowConfig(false)}
        />
      )}
    </>
  );
};

// Node Configuration Dialog Component
const NodeConfigDialog = ({ nodeId, nodeLabel, currentConfig, onSave, onClose }: {
  nodeId: string;
  nodeLabel: string;
  currentConfig: any;
  onSave: (config: any) => void;
  onClose: () => void;
}) => {
  const [config, setConfig] = useState(currentConfig);

  const handleSave = () => {
    onSave(config);
  };

  const renderEmailConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="emailAccount">To Email Account *</Label>
        <Input
          id="emailAccount"
          placeholder="e.g., complaints@orcaa.org"
          value={config.emailAccount || ''}
          onChange={(e) => setConfig({ ...config, emailAccount: e.target.value })}
        />
      </div>
      
      <div>
        <Label htmlFor="ccEmailAccount">CC Email Account</Label>
        <Input
          id="ccEmailAccount"
          placeholder="e.g., supervisor@orcaa.org"
          value={config.ccEmailAccount || ''}
          onChange={(e) => setConfig({ ...config, ccEmailAccount: e.target.value })}
        />
      </div>
      
      <div>
        <Label htmlFor="emailSubject">Email Subject Template *</Label>
        <Input
          id="emailSubject"
          placeholder="e.g., Complaint {{complaintId}} - {{status}}"
          value={config.emailSubject || ''}
          onChange={(e) => setConfig({ ...config, emailSubject: e.target.value })}
        />
      </div>
      
      <div>
        <Label htmlFor="emailTemplate">Email Body Template *</Label>
        <textarea
          id="emailTemplate"
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Dear {{recipientName}},&#10;&#10;This is regarding complaint {{complaintId}}.&#10;&#10;Current Status: {{status}}&#10;Description: {{description}}&#10;&#10;Thank you,&#10;ORCAA Team"
          value={config.emailTemplate || ''}
          onChange={(e) => setConfig({ ...config, emailTemplate: e.target.value })}
        />
        <div className="text-xs text-muted-foreground mt-1">
          Available variables: complaintId, status, description, recipientName, recipientEmail, date
        </div>
      </div>
      
      <div>
        <Label htmlFor="recipientType">Recipient Type *</Label>
        <select
          id="recipientType"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={config.recipientType || ''}
          onChange={(e) => setConfig({ ...config, recipientType: e.target.value })}
        >
          <option value="">Select recipient type</option>
          <option value="complainant">Complainant</option>
          <option value="assigned_staff">Assigned Staff</option>
          <option value="supervisor">Supervisor</option>
          <option value="custom">Custom Email</option>
        </select>
      </div>
      
      {config.recipientType === 'custom' && (
        <div>
          <Label htmlFor="customEmail">Custom Email Address *</Label>
          <Input
            id="customEmail"
            placeholder="recipient@example.com"
            value={config.customEmail || ''}
            onChange={(e) => setConfig({ ...config, customEmail: e.target.value })}
          />
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="sendCopy"
          checked={config.sendCopy || false}
          onChange={(e) => setConfig({ ...config, sendCopy: e.target.checked })}
          className="h-4 w-4 rounded border border-input"
        />
        <Label htmlFor="sendCopy">Send copy to complaint assignee</Label>
      </div>
    </div>
  );

  const renderSMSConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="smsFromNumber">From Phone Number *</Label>
        <Input
          id="smsFromNumber"
          placeholder="e.g., +1234567890"
          value={config.smsFromNumber || ''}
          onChange={(e) => setConfig({ ...config, smsFromNumber: e.target.value })}
        />
      </div>
      
      <div>
        <Label htmlFor="smsTemplate">SMS Message Template *</Label>
        <textarea
          id="smsTemplate"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="ORCAA Alert: Complaint {{complaintId}} status updated to {{status}}. Details: {{description}}"
          value={config.smsTemplate || ''}
          onChange={(e) => setConfig({ ...config, smsTemplate: e.target.value })}
        />
        <div className="text-xs text-muted-foreground mt-1">
          Available variables: complaintId, status, description, date. Max 160 characters.
        </div>
      </div>
      
      <div>
        <Label htmlFor="smsRecipientType">Recipient Type *</Label>
        <select
          id="smsRecipientType"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={config.smsRecipientType || ''}
          onChange={(e) => setConfig({ ...config, smsRecipientType: e.target.value })}
        >
          <option value="">Select recipient type</option>
          <option value="complainant">Complainant</option>
          <option value="assigned_staff">Assigned Staff</option>
          <option value="supervisor">Supervisor</option>
          <option value="custom">Custom Phone Number</option>
        </select>
      </div>
      
      {config.smsRecipientType === 'custom' && (
        <div>
          <Label htmlFor="customSmsPhone">Custom Phone Number *</Label>
          <Input
            id="customSmsPhone"
            placeholder="+1234567890"
            value={config.customPhone || ''}
            onChange={(e) => setConfig({ ...config, customPhone: e.target.value })}
          />
        </div>
      )}
    </div>
  );

  const renderWhatsAppConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="whatsappFromNumber">From WhatsApp Number *</Label>
        <Input
          id="whatsappFromNumber"
          placeholder="e.g., whatsapp:+1234567890"
          value={config.whatsappFromNumber || ''}
          onChange={(e) => setConfig({ ...config, whatsappFromNumber: e.target.value })}
        />
      </div>
      
      <div>
        <Label htmlFor="whatsappTemplate">WhatsApp Message Template *</Label>
        <textarea
          id="whatsappTemplate"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="🏢 *ORCAA Notification*&#10;&#10;Complaint ID: {{complaintId}}&#10;Status: {{status}}&#10;Description: {{description}}&#10;&#10;For more info, contact ORCAA."
          value={config.whatsappTemplate || ''}
          onChange={(e) => setConfig({ ...config, whatsappTemplate: e.target.value })}
        />
        <div className="text-xs text-muted-foreground mt-1">
          Available variables: complaintId, status, description, date
        </div>
      </div>
      
      <div>
        <Label htmlFor="whatsappRecipientType">Recipient Type *</Label>
        <select
          id="whatsappRecipientType"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={config.whatsappRecipientType || ''}
          onChange={(e) => setConfig({ ...config, whatsappRecipientType: e.target.value })}
        >
          <option value="">Select recipient type</option>
          <option value="complainant">Complainant</option>
          <option value="assigned_staff">Assigned Staff</option>
          <option value="supervisor">Supervisor</option>
          <option value="custom">Custom WhatsApp Number</option>
        </select>
      </div>
      
      {config.whatsappRecipientType === 'custom' && (
        <div>
          <Label htmlFor="customWhatsappNumber">Custom WhatsApp Number *</Label>
          <Input
            id="customWhatsappNumber"
            placeholder="whatsapp:+1234567890"
            value={config.customWhatsappNumber || ''}
            onChange={(e) => setConfig({ ...config, customWhatsappNumber: e.target.value })}
          />
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="whatsappMediaAttachment"
          checked={config.whatsappMediaAttachment || false}
          onChange={(e) => setConfig({ ...config, whatsappMediaAttachment: e.target.checked })}
          className="h-4 w-4 rounded border border-input"
        />
        <Label htmlFor="whatsappMediaAttachment">Include complaint attachments</Label>
      </div>
    </div>
  );

  const isConfigValid = () => {
    if (nodeLabel === 'Email Notification') {
      return config.emailAccount && config.emailSubject && config.emailTemplate && config.recipientType;
    } else if (nodeLabel === 'SMS Notification') {
      return config.smsTemplate && config.recipientType;
    } else if (nodeLabel === 'WhatsApp Notification') {
      return config.whatsappTemplate && config.recipientType;
    }
    return false;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure {nodeLabel}</DialogTitle>
          <DialogDescription>
            Set up the notification configuration for this workflow step.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {nodeLabel === 'Email Notification' && renderEmailConfig()}
          {nodeLabel === 'SMS Notification' && renderSMSConfig()}
          {nodeLabel === 'WhatsApp Notification' && renderWhatsAppConfig()}
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!isConfigValid()}
          >
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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

  const onConfigUpdate = useCallback((nodeId: string, config: any) => {
    setNodes((nds) => 
      nds.map((node) => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, config } }
          : node
      )
    );
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [selectedEdgeType, setSelectedEdgeType] = useState<string>('default');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  
  // Workflow save/load state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch workflows
  const { data: workflows = [], isLoading: workflowsLoading } = useQuery<any[]>({
    queryKey: ['/api/workflows'],
  });

  // Save workflow mutation
  const saveWorkflowMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; workflowData: any }) => {
      if (selectedWorkflowId) {
        return apiRequest('PUT', `/api/workflows/${selectedWorkflowId}`, data);
      } else {
        return apiRequest('POST', '/api/workflows', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      setSaveDialogOpen(false);
      setWorkflowName('');
      setWorkflowDescription('');
      setSelectedWorkflowId(null);
      toast({
        title: selectedWorkflowId ? "Workflow Updated" : "Workflow Saved",
        description: selectedWorkflowId ? "Workflow has been updated successfully." : "Workflow has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save workflow. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete workflow mutation
  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      toast({
        title: "Workflow Deleted",
        description: "Workflow has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete workflow. Please try again.",
        variant: "destructive",
      });
    },
  });

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
        onConfigUpdate: onConfigUpdate,
        config: {}
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, onDeleteNode, onConfigUpdate]);

  const onSaveWorkflow = useCallback(() => {
    const workflowData = {
      nodes,
      edges,
      timestamp: new Date().toISOString(),
    };
    console.log('Saving workflow:', workflowData);
    // TODO: Implement actual save to backend
  }, [nodes, edges]);

  const onClearDesigner = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setZoomLevel(1);
    if (reactFlowInstance) {
      reactFlowInstance.zoomTo(1);
    }
    toast({
      title: "Designer Cleared",
      description: "All nodes and edges have been removed from the designer.",
    });
  }, [setNodes, setEdges, reactFlowInstance, toast]);

  const onLoadExampleWorkflow = useCallback(() => {
    const exampleNodes = [
      {
        id: 'ex1',
        type: 'custom',
        position: { x: 100, y: 100 },
        data: {
          label: 'Start',
          icon: Play,
          color: 'bg-green-100 border-green-400 text-green-800',
          description: 'Start point of the workflow',
          onDelete: onDeleteNode,
          onConfigUpdate: onConfigUpdate,
          config: {}
        },
      },
      {
        id: 'ex2',
        type: 'custom',
        position: { x: 300, y: 100 },
        data: {
          label: 'Initial Inspection',
          icon: Eye,
          color: 'bg-blue-100 border-blue-300 text-blue-800',
          description: 'Perform initial field inspection',
          onDelete: onDeleteNode,
          onConfigUpdate: onConfigUpdate,
          config: {}
        },
      },
      {
        id: 'ex3',
        type: 'custom',
        position: { x: 500, y: 100 },
        data: {
          label: 'Assessment',
          icon: Search,
          color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
          description: 'Assess complaint validity',
          onDelete: onDeleteNode,
          onConfigUpdate: onConfigUpdate,
          config: {}
        },
      },
      {
        id: 'ex4',
        type: 'custom',
        position: { x: 700, y: 100 },
        data: {
          label: 'Resolution',
          icon: CheckCircle,
          color: 'bg-emerald-100 border-emerald-300 text-emerald-800',
          description: 'Close and resolve complaint',
          onDelete: onDeleteNode,
          onConfigUpdate: onConfigUpdate,
          config: {}
        },
      },
    ];

    const exampleEdges = [
      {
        id: 'ex-e1-2',
        source: 'ex1',
        target: 'ex2',
        type: 'default',
        animated: true,
        label: 'Process',
        data: { onDelete: onDeleteEdge }
      },
      {
        id: 'ex-e2-3',
        source: 'ex2',
        target: 'ex3',
        type: 'default',
        animated: true,
        label: 'Process',
        data: { onDelete: onDeleteEdge }
      },
      {
        id: 'ex-e3-4',
        source: 'ex3',
        target: 'ex4',
        type: 'default',
        animated: true,
        label: 'Process',
        data: { onDelete: onDeleteEdge }
      },
    ];

    setNodes(exampleNodes);
    setEdges(exampleEdges);
    
    toast({
      title: "Example Workflow Loaded",
      description: "A simple air quality complaint workflow has been loaded. You can now see the connection handles and try dragging between them.",
    });
  }, [setNodes, setEdges, onDeleteNode, onDeleteEdge, onConfigUpdate, toast]);

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

  // Workflow handlers
  const handleSaveWorkflow = useCallback(() => {
    const workflowData = {
      nodes,
      edges,
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

    saveWorkflowMutation.mutate({
      name: workflowName,
      description: workflowDescription,
      workflowData
    });
  }, [nodes, edges, zoomLevel, workflowName, workflowDescription, saveWorkflowMutation]);

  const handleLoadWorkflow = useCallback((workflow: any) => {
    if (workflow.workflowData) {
      const data = workflow.workflowData;
      
      // Icon mapping to restore icon components
      const iconMap: { [key: string]: any } = {
        // Core workflow nodes
        'Start': Play,
        'End': Square,
        'Task': CheckCircle,
        'Decision': GitBranch,
        // Specific task nodes for Air Quality workflows
        'Initial Inspection': Eye,
        'Assessment': Search,
        'Enforcement Action': Gavel,
        'Resolution': CheckCircle,
        // Specific task nodes for Demolition workflows
        'Permit Verification': Shield,
        'Safety Inspection': AlertTriangle,
        'Approve Demolition': CheckCircle,
        'Reject Demolition': X,
        // Notification nodes
        'Email Notification': Mail,
        'SMS Notification': MessageSquare,
        'WhatsApp Notification': Phone,
        // Legacy nodes
        'Complaint Planning': FileText,
        'Field Verification': Search,
        'Field Work': Wrench,
        'Field Contract Work': Users,
        'Work Status Periodic Report': ClipboardList,
        'Advanced Analytics & Reporting': BarChart3,
        'Work Completion': CheckCircle,
        'Work Review and Closure': Archive,
      };
      
      if (data.nodes) {
        setNodes(data.nodes.map((node: any) => ({
          ...node,
          data: {
            ...node.data,
            icon: iconMap[node.data.label] || FileText, // Fallback to FileText if icon not found
            onDelete: onDeleteNode,
            onConfigUpdate: onConfigUpdate
          }
        })));
      }
      if (data.edges) {
        setEdges(data.edges.map((edge: any) => ({
          ...edge,
          data: {
            ...edge.data,
            onDelete: onDeleteEdge
          }
        })));
      }
      if (data.zoomLevel && reactFlowInstance) {
        reactFlowInstance.zoomTo(data.zoomLevel);
        setZoomLevel(data.zoomLevel);
      }
    }
    setLoadDialogOpen(false);
    toast({
      title: "Workflow Loaded",
      description: `"${workflow.name}" has been loaded successfully.`,
    });
  }, [setNodes, setEdges, reactFlowInstance, onDeleteNode, onDeleteEdge, toast]);

  const handleEditWorkflow = useCallback((workflow: any) => {
    setSelectedWorkflowId(workflow.id);
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description || '');
    setSaveDialogOpen(true);
  }, []);

  const handleDeleteWorkflow = useCallback((id: number) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      deleteWorkflowMutation.mutate(id);
    }
  }, [deleteWorkflowMutation]);

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
              <div className="h-[600px] overflow-x-auto overflow-y-hidden">
                <div className="flex flex-col space-y-4 w-max min-w-full">
                  <div>
                    <h3 className="font-semibold mb-3">Available Nodes</h3>
                    <div className="grid grid-cols-2 gap-2 w-max">
                      {nodeTypes.map((nodeType) => {
                        const Icon = nodeType.icon;
                        return (
                          <div
                            key={nodeType.id}
                            className={`p-2 rounded border cursor-pointer transition-all hover:shadow-sm ${nodeType.color} w-32`}
                            onClick={() => onAddNode(nodeType)}
                          >
                            <div className="flex items-center gap-1">
                              <Icon className="h-3 w-3 flex-shrink-0" />
                              <span className="text-xs font-medium truncate">{nodeType.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Connector Types</h3>
                    <div className="space-y-2">
                      <Button
                        onClick={() => setSelectedEdgeType('default')}
                        variant={selectedEdgeType === 'default' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs justify-start w-full"
                      >
                        🏹 Default
                      </Button>
                      <Button
                        onClick={() => setSelectedEdgeType('bidirectional')}
                        variant={selectedEdgeType === 'bidirectional' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs justify-start w-full"
                      >
                        ↔️ Bidirectional
                      </Button>
                      <Button
                        onClick={() => setSelectedEdgeType('conditional')}
                        variant={selectedEdgeType === 'conditional' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs justify-start w-full"
                      >
                        🔀 Conditional
                      </Button>
                      <Button
                        onClick={() => setSelectedEdgeType('selfConnecting')}
                        variant={selectedEdgeType === 'selfConnecting' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs justify-start w-full"
                      >
                        🔄 Self Loop
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Selected: <strong>{selectedEdgeType}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow Canvas */}
            <div className="lg:col-span-3">
              <div className="space-y-4">
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
                    <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            setSelectedWorkflowId(null);
                            setWorkflowName('');
                            setWorkflowDescription('');
                          }}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Workflow
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{selectedWorkflowId ? 'Update' : 'Save'} Workflow</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="name">Name *</Label>
                            <Input
                              id="name"
                              value={workflowName}
                              onChange={(e) => setWorkflowName(e.target.value)}
                              placeholder="Enter workflow name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={workflowDescription}
                              onChange={(e) => setWorkflowDescription(e.target.value)}
                              placeholder="Enter workflow description (optional)"
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSaveDialogOpen(false);
                                setSelectedWorkflowId(null);
                                setWorkflowName('');
                                setWorkflowDescription('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSaveWorkflow}
                              disabled={!workflowName.trim() || saveWorkflowMutation.isPending}
                            >
                              {saveWorkflowMutation.isPending ? 'Saving...' : (selectedWorkflowId ? 'Update' : 'Save')}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                        >
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Load Workflow
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Load Workflow</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-96 overflow-y-auto">
                          {workflowsLoading ? (
                            <div className="text-center py-4">Loading workflows...</div>
                          ) : workflows.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">No saved workflows found</div>
                          ) : (
                            <div className="space-y-2">
                              {workflows.map((workflow: any) => (
                                <div key={workflow.id} className="border rounded p-3">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h4 className="font-medium">{workflow.name}</h4>
                                      {workflow.description && (
                                        <p className="text-sm text-muted-foreground mt-1">{workflow.description}</p>
                                      )}
                                      <p className="text-xs text-muted-foreground mt-2">
                                        Created: {new Date(workflow.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="flex space-x-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleLoadWorkflow(workflow)}
                                      >
                                        Load
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditWorkflow(workflow)}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDeleteWorkflow(workflow.id)}
                                        disabled={deleteWorkflowMutation.isPending}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      onClick={onLoadExampleWorkflow}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Load Example Workflow
                    </Button>

                    <Button
                      onClick={onClearDesigner}
                      variant="destructive"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Designer
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}