import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Shield, Database, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-orcaa-blue hover:bg-orcaa-blue-light text-white mb-8"
          >
            Sign In to Continue
          </Button>
        </div>
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <img 
              src="/orcaa-logo.png" 
              alt="ORCAA Logo" 
              className="h-20 w-20 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Air Quality Complaint
            <span className="text-orcaa-blue"> Management System</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            ORCAA provides environmental services including air quality complaint management and demolition notifications. 
            Our jurisdiction includes Clallam, Grays Harbor, Jefferson, Mason, Pacific, and Thurston Counties.
          </p>
          <div className="mt-5 max-w-2xl mx-auto sm:flex sm:justify-center md:mt-8 gap-4">
            <div className="rounded-md shadow">
              <Link href="/services">
                <Button className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orcaa-blue hover:bg-orcaa-blue-light md:py-4 md:text-lg md:px-10">
                  Submit Request
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="rounded-md shadow">
              <Link href="/search">
                <Button 
                  variant="outline"
                  className="w-full flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-orcaa-blue bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                >
                  Search Complaints
                </Button>
              </Link>
            </div>
            <div className="rounded-md shadow">
              <Button 
                onClick={() => window.location.href = '/api/login'}
                variant="outline"
                className="w-full flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-orcaa-blue bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Staff Login
              </Button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-orcaa-blue" />
                </div>
                <CardTitle className="text-lg">File Complaints</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Submit air quality complaints with detailed information and supporting documentation.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-orcaa-green" />
                </div>
                <CardTitle className="text-lg">Workflow Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Configurable workflow routing with role-based assignments and status tracking.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-orcaa-amber" />
                </div>
                <CardTitle className="text-lg">Role-Based Access</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Secure access control with five staff roles from field staff to administrators.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Database className="h-6 w-6 text-orcaa-red" />
                </div>
                <CardTitle className="text-lg">Audit Trail</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Complete audit logging of all complaint changes and workflow transitions.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Important Notice */}
        <div className="mt-16 bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Shield className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Important Notice</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Complaints filed using this system may not be read until the next business day. 
                  For life-threatening emergencies, please call 9-1-1.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
