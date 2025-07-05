import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  HelpCircle, 
  Users, 
  FileText, 
  Settings, 
  Clock, 
  Mail, 
  Search,
  BarChart3,
  Workflow,
  Shield
} from "lucide-react";

export default function Help() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Documentation</h1>
        <p className="text-gray-600">Complete guide to using the ORCAA Complaint Management System</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="timesheet">Time Tracking</TabsTrigger>
          <TabsTrigger value="admin">Administration</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>The ORCAA Complaint Management System is designed to help staff efficiently manage air quality complaints from the public.</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold">Key Features</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      Complaint submission and tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <Workflow className="h-4 w-4 text-green-500" />
                      Automated workflow processing
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      Time tracking and reporting
                    </li>
                    <li className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-purple-500" />
                      Analytics and dashboard
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-500" />
                      Role-based access control
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold">User Roles</h3>
                  <div className="space-y-2">
                    <Badge variant="outline">Field Staff</Badge>
                    <Badge variant="outline">Contract Staff</Badge>
                    <Badge variant="outline">Supervisor</Badge>
                    <Badge variant="outline">Approver</Badge>
                    <Badge variant="outline">Admin</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">1. Dashboard</h4>
                  <p className="text-sm text-gray-600">View complaint statistics, charts, and use advanced search filters</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">2. Inbox</h4>
                  <p className="text-sm text-gray-600">Manage assigned tasks, complaints, and approval requests</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">3. Time Management</h4>
                  <p className="text-sm text-gray-600">Track time entries, submit leave and overtime requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complaints" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Complaint Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Complaint Types</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-blue-600">Air Quality Complaints (AQ-YYYY-NNN)</h4>
                    <ul className="text-sm text-gray-600 mt-2 space-y-1">
                      <li>• Odor issues</li>
                      <li>• Visible emissions</li>
                      <li>• Dust complaints</li>
                      <li>• Smoke concerns</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-green-600">Demolition Notices (DN-YYYY-NNN)</h4>
                    <ul className="text-sm text-gray-600 mt-2 space-y-1">
                      <li>• Asbestos notifications</li>
                      <li>• Renovation projects</li>
                      <li>• Demolition permits</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Complaint Status Flow</h3>
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge className="bg-blue-100 text-blue-800">Initiated</Badge>
                  <span>→</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Inspection</Badge>
                  <span>→</span>
                  <Badge className="bg-orange-100 text-orange-800">Work In Progress</Badge>
                  <span>→</span>
                  <Badge className="bg-purple-100 text-purple-800">Reviewed</Badge>
                  <span>→</span>
                  <Badge className="bg-green-100 text-green-800">Approved/Closed</Badge>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Dashboard Search & Filters</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Real-time Search</h4>
                    <p className="text-sm text-gray-600">Search across complaint IDs, descriptions, addresses, and comments as you type</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Filter Options</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Status (Initiated, In Progress, etc.)</li>
                      <li>• Priority (Urgent, High, Normal)</li>
                      <li>• Problem Type</li>
                      <li>• City and County</li>
                      <li>• Assigned User</li>
                      <li>• Date Range</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Workflow System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Automated Task Assignment</h3>
                <p className="text-gray-600">When complaints are submitted, the system automatically:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                    Creates workflow tasks based on complaint type
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                    Assigns tasks to users based on role permissions
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                    Sends email notifications to assigned staff
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                    Creates inbox items for task management
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Task Actions</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-green-600">Approve</h4>
                    <p className="text-sm text-gray-600 mt-2">Complete the task and move to next workflow step</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-red-600">Reject</h4>
                    <p className="text-sm text-gray-600 mt-2">Mark task as rejected with detailed notes</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-blue-600">Forward</h4>
                    <p className="text-sm text-gray-600 mt-2">Reassign task to another qualified user</p>
                  </div>
                </div>
              </div>

              <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertDescription>
                  All workflow actions are logged in the audit trail for compliance and tracking purposes.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timesheet" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Time Entries</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Recording Time</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Select date and hours worked</li>
                      <li>• Choose activity type from predefined list</li>
                      <li>• Link to specific complaint ID (optional)</li>
                      <li>• Add comments for details</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Activity Types</h4>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">Field Inspection</Badge>
                      <Badge variant="outline" className="text-xs">Office Work</Badge>
                      <Badge variant="outline" className="text-xs">Travel</Badge>
                      <Badge variant="outline" className="text-xs">Training</Badge>
                      <Badge variant="outline" className="text-xs">Meetings</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Leave Requests</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Leave Types</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Annual Leave</li>
                      <li>• Sick Leave</li>
                      <li>• Personal Leave</li>
                      <li>• Emergency Leave</li>
                      <li>• Bereavement Leave</li>
                      <li>• Jury Duty</li>
                      <li>• Military Leave</li>
                      <li>• Unpaid Leave</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Approval Process</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                        <span className="text-sm">→ Awaiting supervisor approval</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Approved</Badge>
                        <span className="text-sm">→ Request accepted</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                        <span className="text-sm">→ Request denied with reason</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Overtime Requests</h3>
                <p className="text-sm text-gray-600">Submit requests for overtime work with project details, hours, and justification. Requires supervisor approval.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Administration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">User Management</h3>
                <p className="text-sm text-gray-600">Administrators can create, update, and manage user accounts with role assignments.</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">User Roles & Permissions</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>Admin:</strong> Full system access</li>
                      <li>• <strong>Supervisor:</strong> Team management, approvals</li>
                      <li>• <strong>Approver:</strong> Workflow task approvals</li>
                      <li>• <strong>Field Staff:</strong> Complaint handling</li>
                      <li>• <strong>Contract Staff:</strong> Limited access</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Role-Action Mapping</h4>
                    <p className="text-sm text-gray-600">Fine-grained control over which actions each role can perform across different system areas.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Workflow Designer</h3>
                <p className="text-sm text-gray-600">Create and modify automated workflows with drag-and-drop interface including:</p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Task nodes for user assignments</li>
                  <li>• Decision nodes for conditional routing</li>
                  <li>• Email, SMS, and WhatsApp notifications</li>
                  <li>• Workflow templates for different complaint types</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">System Configuration</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">List Values</h4>
                    <p className="text-sm text-gray-600">Manage dropdown options for activities, problem types, and other system values.</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Email Templates</h4>
                    <p className="text-sm text-gray-600">Customize automated email notifications with dynamic variables.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Support & Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Technical Support</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold">System Issues</h4>
                    <p className="text-sm text-gray-600 mt-2">For login problems, system errors, or technical difficulties</p>
                    <p className="text-sm font-medium mt-2">Contact: IT Support</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold">Training & Usage</h4>
                    <p className="text-sm text-gray-600 mt-2">For help with features, workflows, or general usage questions</p>
                    <p className="text-sm font-medium mt-2">Contact: System Administrator</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">ORCAA Contact Information</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm">
                    <strong>Olympic Region Clean Air Agency</strong><br />
                    2940 Limited Lane NW<br />
                    Olympia, WA 98502<br />
                    Phone: (360) 539-7610<br />
                    Website: <a href="https://orcaa.org" className="text-blue-600 hover:underline">orcaa.org</a>
                  </p>
                </div>
              </div>

              <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertDescription>
                  For urgent air quality complaints from the public, direct them to use the public complaint form on the ORCAA website or call the main office.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}