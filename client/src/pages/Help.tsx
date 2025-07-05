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
  Shield,
  CheckCircle,
  AlertTriangle,
  Info,
  Phone,
  Globe,
  UserCheck,
  BookOpen,
  Target,
  Zap
} from "lucide-react";

export default function Help() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">ORCAA Staff Help Center</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Your comprehensive guide to the Olympic Region Clean Air Agency's Complaint Management System. 
          Learn how to efficiently process air quality complaints, manage workflows, track time, and leverage 
          advanced features to serve our community better.
        </p>
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
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="w-6 h-6 text-orcaa-blue" />
                System Overview & Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-orcaa-blue/10 to-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-orcaa-blue">Our Mission</h3>
                <p className="text-gray-700 leading-relaxed">
                  The ORCAA Complaint Management System empowers the Olympic Region Clean Air Agency to 
                  efficiently protect public health and environmental quality. Our comprehensive platform 
                  ensures every air quality complaint receives prompt, professional attention through 
                  structured workflows, automated task assignment, and thorough documentation.
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-orcaa-blue">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Zap className="w-5 h-5 text-orcaa-blue" />
                      Core Capabilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm"><strong>Intelligent Complaint Processing:</strong> Automated intake, categorization, and routing based on complaint type and urgency</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm"><strong>Dynamic Workflow Management:</strong> Customizable workflows that adapt to different complaint types and regulatory requirements</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm"><strong>Role-Based Authorization:</strong> Granular permissions ensuring staff access only appropriate functions for their responsibilities</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm"><strong>Comprehensive Time Tracking:</strong> Detailed activity logging for project billing, compliance reporting, and performance analytics</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm"><strong>Advanced Search & Analytics:</strong> Powerful filtering and reporting tools for compliance, trend analysis, and operational insights</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <UserCheck className="w-5 h-5 text-green-500" />
                      Staff Benefits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-orcaa-blue mt-0.5 flex-shrink-0" />
                        <span className="text-sm"><strong>Streamlined Daily Operations:</strong> Automated task assignment eliminates manual routing, ensuring balanced workloads</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-orcaa-blue mt-0.5 flex-shrink-0" />
                        <span className="text-sm"><strong>Enhanced Collaboration:</strong> Real-time updates and shared documentation improve team coordination</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-orcaa-blue mt-0.5 flex-shrink-0" />
                        <span className="text-sm"><strong>Regulatory Compliance:</strong> Built-in audit trails and documentation standards ensure regulatory adherence</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-orcaa-blue mt-0.5 flex-shrink-0" />
                        <span className="text-sm"><strong>Performance Insights:</strong> Individual and team productivity metrics support professional development</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-orcaa-blue mt-0.5 flex-shrink-0" />
                        <span className="text-sm"><strong>Mobile-Friendly Access:</strong> Responsive design enables field work and remote accessibility</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Info className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Quick Start:</strong> New users should begin with the Dashboard to familiarize themselves with 
                  active complaints and their assigned tasks. The Inbox provides a centralized view of all pending work items.
                </AlertDescription>
              </Alert>
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
              <CardTitle className="flex items-center gap-2 text-xl">
                <Phone className="w-6 h-6 text-orcaa-blue" />
                Support & Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-orcaa-blue/10 to-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-orcaa-blue">Getting Help</h3>
                <p className="text-gray-700 leading-relaxed">
                  Our support team is here to ensure you can effectively use the ORCAA Complaint Management System 
                  to serve our community's air quality protection needs. Whether you need technical assistance, 
                  training, or have questions about workflows, we're ready to help.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      Technical Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-2">System Issues & Errors</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• Login problems or authentication failures</li>
                        <li>• System crashes or unexpected errors</li>
                        <li>• Performance issues or slow loading</li>
                        <li>• Database connectivity problems</li>
                        <li>• File upload or attachment issues</li>
                      </ul>
                      <p className="text-sm font-medium mt-3 text-red-800">Contact: IT Support Team</p>
                      <p className="text-xs text-red-600 mt-1">Response Time: Within 2 hours during business hours</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="w-5 h-5 text-green-500" />
                      Training & Usage Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Feature Training & Guidance</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Workflow process questions</li>
                        <li>• Feature usage and best practices</li>
                        <li>• Role permissions and access requests</li>
                        <li>• Report generation and data analysis</li>
                        <li>• New user onboarding and training</li>
                      </ul>
                      <p className="text-sm font-medium mt-3 text-green-800">Contact: System Administrator</p>
                      <p className="text-xs text-green-600 mt-1">Response Time: Same day during business hours</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-l-4 border-l-orcaa-blue">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="w-5 h-5 text-orcaa-blue" />
                    ORCAA Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-orcaa-blue/10 rounded-lg">
                        <h4 className="font-semibold text-orcaa-blue mb-3">Main Office</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Olympic Region Clean Air Agency</strong></p>
                          <p>2940 Limited Lane NW<br />Olympia, WA 98502</p>
                          <p><strong>Phone:</strong> (360) 539-7610</p>
                          <p><strong>Fax:</strong> (360) 491-6308</p>
                          <p><strong>Website:</strong> <a href="https://orcaa.org" className="text-orcaa-blue hover:underline" target="_blank" rel="noopener noreferrer">orcaa.org</a></p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-700 mb-3">Business Hours</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Monday - Friday:</strong> 8:00 AM - 4:30 PM</p>
                          <p><strong>Weekends:</strong> Closed</p>
                          <p><strong>Holidays:</strong> Closed</p>
                        </div>
                        <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                          <p className="text-xs text-yellow-800">
                            <strong>Emergency Response:</strong> For after-hours environmental emergencies, 
                            contact local emergency services (911) or Washington State Patrol (1-800-543-5678)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>For Public Complaints:</strong> Direct citizens to submit complaints through the 
                    public form on orcaa.org or by calling our main office during business hours.
                  </AlertDescription>
                </Alert>

                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>System Status:</strong> Check the Dashboard for real-time system health 
                    indicators and any scheduled maintenance notifications.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}