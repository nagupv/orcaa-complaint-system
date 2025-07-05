import { storage } from '../storage';
import { emailService } from './emailService';
import * as twilioService from './twilioService';

export interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label: string;
    config?: any;
    [key: string]: any;
  };
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  data?: any;
}

export interface WorkflowContext {
  complaintId: number;
  complaint?: any;
  userId?: string;
  executionId: string;
  variables: Map<string, any>;
  results: Map<string, any>;
}

export class WorkflowOrchestrator {
  private nodes: Map<string, WorkflowNode>;
  private edges: WorkflowEdge[];
  private executionOrder: string[];
  private context: WorkflowContext;
  private executionStatus: Map<string, 'pending' | 'running' | 'completed' | 'failed'>;

  constructor(nodes: WorkflowNode[], edges: WorkflowEdge[], context: WorkflowContext) {
    this.nodes = new Map(nodes.map(node => [node.id, node]));
    this.edges = edges;
    this.context = context;
    this.executionStatus = new Map();
    
    // Initialize all nodes as pending
    nodes.forEach(node => {
      this.executionStatus.set(node.id, 'pending');
    });

    // Calculate execution order using topological sort
    this.executionOrder = this.topologicalSort();
  }

  /**
   * Topological sort to determine execution order
   * Uses Kahn's algorithm to ensure proper dependency order
   */
  private topologicalSort(): string[] {
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize all nodes
    this.nodes.forEach((node, id) => {
      adjacencyList.set(id, []);
      inDegree.set(id, 0);
    });

    // Build graph structure from edges
    this.edges.forEach(edge => {
      adjacencyList.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, inDegree.get(edge.target)! + 1);
    });

    // Find nodes with no incoming edges (start nodes)
    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    const executionOrder: string[] = [];

    while (queue.length > 0) {
      const currentNode = queue.shift()!;
      executionOrder.push(currentNode);

      // Process all outgoing edges
      adjacencyList.get(currentNode)!.forEach(neighbor => {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      });
    }

    // Check for cycles
    if (executionOrder.length !== this.nodes.size) {
      throw new Error('Cycle detected in workflow graph - workflows must be acyclic');
    }

    return executionOrder;
  }

  /**
   * Execute the entire workflow
   */
  async executeWorkflow(): Promise<Map<string, any>> {
    console.log(`Starting workflow execution for complaint ${this.context.complaintId}`);
    
    // Load complaint data into context
    this.context.complaint = await storage.getComplaint(this.context.complaintId);
    
    try {
      for (const nodeId of this.executionOrder) {
        await this.executeNode(nodeId);
      }
      
      console.log(`Workflow execution completed for complaint ${this.context.complaintId}`);
      return this.context.results;
    } catch (error) {
      console.error(`Workflow execution failed for complaint ${this.context.complaintId}:`, error);
      throw error;
    }
  }

  /**
   * Execute a single node
   */
  private async executeNode(nodeId: string): Promise<any> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    this.executionStatus.set(nodeId, 'running');
    console.log(`Executing node: ${nodeId} (${node.data.label})`);

    try {
      let result: any = null;

      switch (node.type) {
        case 'start':
          result = await this.executeStartNode(node);
          break;
        case 'end':
          result = await this.executeEndNode(node);
          break;
        case 'custom':
          // Handle custom nodes based on their label
          result = await this.executeCustomNode(node);
          break;
        case 'task':
          result = await this.executeTaskNode(node);
          break;
        case 'decision':
          result = await this.executeDecisionNode(node);
          break;
        default:
          console.log(`Unknown node type: ${node.type}, skipping execution`);
          result = { status: 'skipped', reason: 'unknown_node_type' };
      }

      this.context.results.set(nodeId, result);
      this.executionStatus.set(nodeId, 'completed');
      
      console.log(`Node ${nodeId} completed with result:`, result);
      return result;
    } catch (error) {
      this.executionStatus.set(nodeId, 'failed');
      console.error(`Node ${nodeId} failed:`, error);
      throw error;
    }
  }

  /**
   * Execute start node
   */
  private async executeStartNode(node: WorkflowNode): Promise<any> {
    return {
      type: 'start',
      timestamp: new Date().toISOString(),
      complaintId: this.context.complaintId
    };
  }

  /**
   * Execute end node
   */
  private async executeEndNode(node: WorkflowNode): Promise<any> {
    return {
      type: 'end',
      timestamp: new Date().toISOString(),
      complaintId: this.context.complaintId
    };
  }

  /**
   * Execute custom nodes based on their label
   */
  private async executeCustomNode(node: WorkflowNode): Promise<any> {
    const label = node.data.label?.toLowerCase() || '';

    // Handle notification nodes
    if (label.includes('email notification')) {
      return await this.executeEmailNotification(node);
    } else if (label.includes('sms notification')) {
      return await this.executeSmsNotification(node);
    } else if (label.includes('whatsapp notification')) {
      return await this.executeWhatsAppNotification(node);
    }
    
    // Handle task nodes by label
    else if (label.includes('initial inspection')) {
      return await this.executeInitialInspection(node);
    } else if (label.includes('assessment')) {
      return await this.executeAssessment(node);
    } else if (label.includes('enforcement')) {
      return await this.executeEnforcementAction(node);
    } else if (label.includes('resolution')) {
      return await this.executeResolution(node);
    }
    
    // Default handling for unknown custom nodes
    console.log(`Custom node with unknown label: ${label}`);
    return { status: 'completed', nodeType: 'custom', label };
  }

  /**
   * Execute task node
   */
  private async executeTaskNode(node: WorkflowNode): Promise<any> {
    // Task nodes create workflow tasks that users need to complete
    // This is handled by the existing workflow task system
    return {
      type: 'task',
      label: node.data.label,
      status: 'task_created',
      message: 'Workflow task will be created for user assignment'
    };
  }

  /**
   * Execute decision node
   */
  private async executeDecisionNode(node: WorkflowNode): Promise<any> {
    // Decision nodes create workflow tasks that users need to complete
    // The decision outcome determines which path the workflow takes next
    return {
      type: 'decision',
      label: node.data.label,
      status: 'decision_created',
      message: 'Decision task will be created for user input'
    };
  }

  /**
   * Execute email notification
   */
  private async executeEmailNotification(node: WorkflowNode): Promise<any> {
    const config = node.data.config || {};
    const complaint = this.context.complaint;
    
    if (!complaint) {
      throw new Error('Complaint data not available for email notification');
    }

    // Determine recipient based on configuration
    let recipientEmail = '';
    let recipientName = '';

    switch (config.recipientType) {
      case 'complainant':
        recipientEmail = complaint.complainantEmail;
        recipientName = `${complaint.complainantFirstName} ${complaint.complainantLastName}`;
        break;
      case 'assigned_staff':
        // Get assigned user's email
        if (complaint.assignedTo) {
          const assignedUser = await storage.getUser(complaint.assignedTo);
          if (assignedUser) {
            recipientEmail = assignedUser.email;
            recipientName = `${assignedUser.firstName || ''} ${assignedUser.lastName || ''}`.trim();
          }
        }
        break;
      case 'role_based':
        // Send to users with specific action permission
        const actionId = config.actionId || 'initial_inspection';
        const usersWithPermission = await this.getUsersWithActionPermission(actionId);
        
        if (usersWithPermission.length > 0) {
          // Send to all users with permission (for now, send to first user as primary recipient)
          const primaryUser = usersWithPermission[0];
          recipientEmail = primaryUser.email;
          recipientName = `${primaryUser.firstName || ''} ${primaryUser.lastName || ''}`.trim();
        }
        break;
      case 'custom':
        recipientEmail = config.customEmail || '';
        recipientName = config.customName || 'Recipient';
        break;
      default:
        recipientEmail = complaint.complainantEmail;
        recipientName = `${complaint.complainantFirstName} ${complaint.complainantLastName}`;
    }

    if (!recipientEmail) {
      console.log('No recipient email found, skipping email notification');
      return { status: 'skipped', reason: 'no_recipient_email' };
    }

    // Prepare email data with template variable substitution
    const emailData = {
      recipientName,
      recipientEmail,
      complaintId: complaint.complaintId,
      status: complaint.status,
      priority: complaint.priority,
      problemType: Array.isArray(complaint.problemTypes) ? complaint.problemTypes.join(', ') : complaint.problemTypes,
      submissionDate: complaint.createdAt.toLocaleDateString(),
      lastUpdated: complaint.updatedAt.toLocaleDateString(),
      assignedStaff: 'ORCAA Staff',
      updateDescription: config.emailTemplate || `Your complaint ${complaint.complaintId} has been received and is being processed.`,
      complaintDescription: complaint.otherDescription || '',
      location: complaint.sourceAddress || '',
      dateReceived: complaint.createdAt.toLocaleDateString(),
      complainantPhone: complaint.complainantPhone || 'Not provided',
      preferredContact: 'Email'
    };

    // Send email using the email service
    const emailType = this.determineEmailType(config, complaint);
    const success = await emailService.sendEmail(emailData, emailType);

    return {
      type: 'email_notification',
      success,
      recipient: recipientEmail,
      subject: config.emailSubject || `ORCAA Complaint Notification - ${complaint.complaintId}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get users with specific action permission
   */
  private async getUsersWithActionPermission(actionId: string): Promise<any[]> {
    try {
      // Get roles that have permission for this action
      const rolesWithPermission = await storage.getRolesForAction(actionId);
      
      if (rolesWithPermission.length === 0) {
        console.log(`No roles found with permission for action: ${actionId}`);
        return [];
      }
      
      // Get all users with these roles
      const allUsers = await storage.getAllUsers();
      const usersWithPermission = allUsers.filter(user => {
        if (!user.roles || !Array.isArray(user.roles)) return false;
        return user.roles.some(role => rolesWithPermission.includes(role));
      });
      
      console.log(`Found ${usersWithPermission.length} users with permission for action: ${actionId}`);
      return usersWithPermission;
    } catch (error) {
      console.error('Error getting users with action permission:', error);
      return [];
    }
  }

  /**
   * Send email to a single recipient
   */
  private async sendSingleEmail(emailData: any, config: any): Promise<boolean> {
    try {
      const subject = this.substituteVariables(
        config.emailSubject || `ORCAA Complaint Notification - ${emailData.complaintId}`,
        emailData
      );
      
      const emailBody = this.substituteVariables(
        config.emailTemplate || `Your complaint ${emailData.complaintId} has been received and is being processed.`,
        emailData
      );

      console.log(`Preparing to send email:`);
      console.log(`To: ${emailData.recipientEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body preview: ${emailBody.substring(0, 100)}...`);

      const success = await emailService.sendEmail(emailData.recipientEmail, subject, emailBody, emailData.recipientName);
      
      if (success) {
        console.log('Email sent successfully via SendGrid');
      } else {
        console.log('Failed to send email via SendGrid');
      }
      
      return success;
    } catch (error) {
      console.error('Error sending single email:', error);
      return false;
    }
  }

  /**
   * Execute SMS notification
   */
  private async executeSmsNotification(node: WorkflowNode): Promise<any> {
    const config = node.data.config || {};
    const complaint = this.context.complaint;
    
    if (!complaint) {
      throw new Error('Complaint data not available for SMS notification');
    }

    const phoneNumber = complaint.complainantPhone;
    if (!phoneNumber) {
      console.log('No phone number found, skipping SMS notification');
      return { status: 'skipped', reason: 'no_phone_number' };
    }

    const message = this.substituteVariables(
      config.messageTemplate || `ORCAA Alert: Your complaint ${complaint.complaintId} has been received. Status: ${complaint.status}`,
      complaint
    );

    const success = await twilioService.sendSMSNotification(phoneNumber, message);

    return {
      type: 'sms_notification',
      success,
      recipient: phoneNumber,
      message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute WhatsApp notification
   */
  private async executeWhatsAppNotification(node: WorkflowNode): Promise<any> {
    const config = node.data.config || {};
    const complaint = this.context.complaint;
    
    if (!complaint) {
      throw new Error('Complaint data not available for WhatsApp notification');
    }

    const phoneNumber = complaint.complainantPhone;
    if (!phoneNumber) {
      console.log('No phone number found, skipping WhatsApp notification');
      return { status: 'skipped', reason: 'no_phone_number' };
    }

    const message = this.substituteVariables(
      config.messageTemplate || `ORCAA Alert: Your complaint ${complaint.complaintId} has been received. Status: ${complaint.status}`,
      complaint
    );

    const success = await twilioService.sendWhatsAppNotification(phoneNumber, message);

    return {
      type: 'whatsapp_notification',
      success,
      recipient: phoneNumber,
      message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute initial inspection task
   */
  private async executeInitialInspection(node: WorkflowNode): Promise<any> {
    // This creates a workflow task for field staff
    return {
      type: 'initial_inspection',
      status: 'notification_sent',
      message: 'Initial inspection task will be assigned to field staff'
    };
  }

  /**
   * Execute assessment task
   */
  private async executeAssessment(node: WorkflowNode): Promise<any> {
    return {
      type: 'assessment',
      status: 'notification_sent',
      message: 'Assessment task will be assigned to supervisor'
    };
  }

  /**
   * Execute enforcement action
   */
  private async executeEnforcementAction(node: WorkflowNode): Promise<any> {
    return {
      type: 'enforcement_action',
      status: 'notification_sent',
      message: 'Enforcement action task will be assigned'
    };
  }

  /**
   * Execute resolution
   */
  private async executeResolution(node: WorkflowNode): Promise<any> {
    return {
      type: 'resolution',
      status: 'notification_sent',
      message: 'Resolution task will be assigned'
    };
  }

  /**
   * Substitute template variables in text
   */
  private substituteVariables(text: string, complaint: any): string {
    return text
      .replace(/\{\{complaintId\}\}/g, complaint.complaintId)
      .replace(/\{\{status\}\}/g, complaint.status)
      .replace(/\{\{priority\}\}/g, complaint.priority)
      .replace(/\{\{problemType\}\}/g, Array.isArray(complaint.problemTypes) ? complaint.problemTypes.join(', ') : complaint.problemTypes)
      .replace(/\{\{dateReceived\}\}/g, complaint.createdAt.toLocaleDateString())
      .replace(/\{\{location\}\}/g, complaint.sourceAddress || 'Not specified')
      .replace(/\{\{description\}\}/g, complaint.otherDescription || '')
      .replace(/\{\{complainantName\}\}/g, `${complaint.complainantFirstName} ${complaint.complainantLastName}`)
      .replace(/\{\{complainantPhone\}\}/g, complaint.complainantPhone || 'Not provided')
      .replace(/\{\{complainantEmail\}\}/g, complaint.complainantEmail || 'Not provided');
  }

  /**
   * Determine email type for proper template selection
   */
  private determineEmailType(config: any, complaint: any): string {
    if (config.templateType) {
      return config.templateType;
    }
    
    // Auto-determine based on complaint status
    switch (complaint.status) {
      case 'initiated':
        return 'complaint_received';
      case 'in_progress':
        return 'status_update';
      case 'resolved':
      case 'closed':
        return 'complaint_resolved';
      default:
        return 'status_update';
    }
  }

  /**
   * Get execution status for a node
   */
  getNodeStatus(nodeId: string): string {
    return this.executionStatus.get(nodeId) || 'unknown';
  }

  /**
   * Get all execution statuses
   */
  getAllStatuses(): Map<string, string> {
    return new Map(this.executionStatus);
  }
}