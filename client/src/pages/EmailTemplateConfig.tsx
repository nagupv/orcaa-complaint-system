import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Eye, Send, Settings, FileText, Copy } from 'lucide-react';

export default function EmailTemplateConfig() {
  const [selectedTemplate, setSelectedTemplate] = useState('status_update');
  const [previewData, setPreviewData] = useState({
    recipientName: 'John Doe',
    complaintId: 'AQ-2025-001',
    status: 'In Progress',
    priority: 'High',
    problemType: 'Odor Complaint',
    submissionDate: '2025-01-05',
    lastUpdated: '2025-01-05',
    assignedStaff: 'Jane Smith',
    updateDescription: 'Initial inspection completed. Issue confirmed and investigation in progress.',
    nextSteps: 'Field team will conduct detailed environmental assessment within 48 hours.'
  });

  const emailTypes = [
    { id: 'complaint_received', name: 'Complaint Received', description: 'Sent when a new complaint is submitted' },
    { id: 'status_update', name: 'Status Update', description: 'Sent when complaint status changes' },
    { id: 'action_required', name: 'Action Required', description: 'Sent when user action is needed' },
    { id: 'complaint_resolved', name: 'Complaint Resolved', description: 'Sent when complaint is resolved' },
    { id: 'assignment_notification', name: 'Assignment Notification', description: 'Sent to staff when assigned to a task' },
    { id: 'escalation_alert', name: 'Escalation Alert', description: 'Sent when complaint is escalated' },
    { id: 'follow_up_reminder', name: 'Follow-up Reminder', description: 'Sent as reminder for pending items' }
  ];

  const workflowIntegrations = [
    { 
      name: 'Initial Inspection', 
      description: 'Send notification when inspection is scheduled',
      emailType: 'status_update',
      trigger: 'Task Assignment'
    },
    { 
      name: 'Assessment Complete', 
      description: 'Notify complainant when assessment is finished',
      emailType: 'status_update',
      trigger: 'Task Completion'
    },
    { 
      name: 'Enforcement Action', 
      description: 'Send notification when enforcement action is taken',
      emailType: 'status_update',
      trigger: 'Action Triggered'
    },
    { 
      name: 'Resolution Notification', 
      description: 'Notify when complaint is resolved',
      emailType: 'complaint_resolved',
      trigger: 'Workflow End'
    },
    { 
      name: 'Permit Verification', 
      description: 'Send notification during permit verification process',
      emailType: 'status_update',
      trigger: 'Task Assignment'
    },
    { 
      name: 'Field Work Assignment', 
      description: 'Notify staff when field work is assigned',
      emailType: 'assignment_notification',
      trigger: 'Task Assignment'
    }
  ];

  const templateVariables = [
    { variable: '{{recipientName}}', description: 'Name of the email recipient' },
    { variable: '{{complaintId}}', description: 'Unique complaint identifier' },
    { variable: '{{status}}', description: 'Current complaint status' },
    { variable: '{{priority}}', description: 'Priority level (High, Medium, Low)' },
    { variable: '{{problemType}}', description: 'Type of problem reported' },
    { variable: '{{submissionDate}}', description: 'Date complaint was submitted' },
    { variable: '{{lastUpdated}}', description: 'Last update timestamp' },
    { variable: '{{assignedStaff}}', description: 'Staff member assigned to complaint' },
    { variable: '{{updateDescription}}', description: 'Description of the latest update' },
    { variable: '{{nextSteps}}', description: 'Information about next steps' },
    { variable: '{{actionRequired}}', description: 'Boolean for action required section' },
    { variable: '{{actionDescription}}', description: 'Description of required action' },
    { variable: '{{actionUrl}}', description: 'URL for taking action' }
  ];

  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
  };

  const handlePreview = () => {
    // In a real implementation, this would generate the actual email preview
    console.log('Preview email with:', previewData);
  };

  const handleTestEmail = () => {
    // In a real implementation, this would send a test email
    console.log('Send test email to:', previewData.recipientName);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Template Configuration</h1>
          <p className="text-muted-foreground">
            Configure email templates for various workflow actions and notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePreview} variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleTestEmail}>
            <Send className="w-4 h-4 mr-2" />
            Test Email
          </Button>
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="workflow">Workflow Integration</TabsTrigger>
          <TabsTrigger value="variables">Template Variables</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Types
                </CardTitle>
                <CardDescription>
                  Select and configure different types of email notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {emailTypes.map((type) => (
                  <div 
                    key={type.id} 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(type.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{type.name}</h3>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                      <Badge variant={selectedTemplate === type.id ? "default" : "secondary"}>
                        {selectedTemplate === type.id ? "Selected" : "Available"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Preview Configuration
                </CardTitle>
                <CardDescription>
                  Configure sample data for email preview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recipientName">Recipient Name</Label>
                    <Input 
                      id="recipientName" 
                      value={previewData.recipientName}
                      onChange={(e) => setPreviewData({...previewData, recipientName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="complaintId">Complaint ID</Label>
                    <Input 
                      id="complaintId" 
                      value={previewData.complaintId}
                      onChange={(e) => setPreviewData({...previewData, complaintId: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={previewData.status} onValueChange={(value) => setPreviewData({...previewData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={previewData.priority} onValueChange={(value) => setPreviewData({...previewData, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="updateDescription">Update Description</Label>
                  <Textarea 
                    id="updateDescription" 
                    value={previewData.updateDescription}
                    onChange={(e) => setPreviewData({...previewData, updateDescription: e.target.value})}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="nextSteps">Next Steps</Label>
                  <Textarea 
                    id="nextSteps" 
                    value={previewData.nextSteps}
                    onChange={(e) => setPreviewData({...previewData, nextSteps: e.target.value})}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Workflow Email Integration
              </CardTitle>
              <CardDescription>
                Configure email notifications for different workflow actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowIntegrations.map((integration, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{integration.name}</h3>
                        <p className="text-sm text-muted-foreground">{integration.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{integration.trigger}</Badge>
                        <Badge>{integration.emailType}</Badge>
                        <Button size="sm" variant="outline">
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="w-5 h-5" />
                Template Variables
              </CardTitle>
              <CardDescription>
                Available variables for use in email templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templateVariables.map((item, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {item.variable}
                        </code>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCopyVariable(item.variable)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Email Template Location</CardTitle>
          <CardDescription>
            The email template is stored in your project root directory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-mono">
              📁 Project Root<br />
              └── 📄 email_template_sample.html
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This file contains the HTML template with styling and variable placeholders.
              You can modify this file directly or use the configuration interface above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}