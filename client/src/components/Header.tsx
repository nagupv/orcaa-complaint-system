import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, Phone, Mail, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "approver":
        return "bg-purple-100 text-purple-800";
      case "supervisor":
        return "bg-blue-100 text-blue-800";
      case "contract_staff":
        return "bg-green-100 text-green-800";
      case "field_staff":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatRoleName = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <header className="bg-white shadow-sm">
      {/* Top Bar */}
      <div className="bg-orcaa-blue text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Phone className="h-3 w-3" />
                <span>(360) 539-7610</span>
              </div>
              <div className="flex items-center space-x-1">
                <Mail className="h-3 w-3" />
                <span>info@orcaa.org</span>
              </div>
            </div>
            <div className="hidden md:block">
              <span>Olympic Region Clean Air Agency</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3">
              <img 
                src="/orcaa-logo.png" 
                alt="ORCAA Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">ORCAA</h1>
                <p className="text-sm text-gray-600">Olympic Region Clean Air Agency</p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation & User Info */}
          <div className="flex items-center space-x-6">
            <nav className="hidden lg:flex items-center space-x-6">
              {/* Time Management Dropdown - No Action on Main Link */}
              <div className="relative group">
                <span className="dropdown-trigger text-gray-700 hover:text-orcaa-blue font-medium flex items-center gap-1 cursor-pointer">
                  Time Management
                  <ChevronDown className="h-4 w-4" />
                </span>
                
                {/* Dropdown Menu with improved hover behavior */}
                <div className="dropdown-menu absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible z-50">
                  <div className="py-1">
                    <Link href="/time-entries" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orcaa-blue">
                      Time Entries
                    </Link>
                    <Link href="/leave-requests" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orcaa-blue">
                      Leave Requests
                    </Link>
                    <Link href="/overtime-requests" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orcaa-blue">
                      Overtime Requests
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Application Management Dropdown - No Action on Main Link */}
              <div className="relative group">
                <span className="dropdown-trigger text-gray-700 hover:text-orcaa-blue font-medium flex items-center gap-1 cursor-pointer">
                  Application Management
                  <ChevronDown className="h-4 w-4" />
                </span>
                
                {/* Dropdown Menu with improved hover behavior */}
                <div className="dropdown-menu absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible z-50">
                  <div className="py-1">
                    <Link href="/application-management#users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orcaa-blue">
                      User Management
                    </Link>
                    <Link href="/application-management#roles" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orcaa-blue">
                      Role Management
                    </Link>
                    <Link href="/application-management#list-values" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orcaa-blue">
                      List Values
                    </Link>
                    <Link href="/application-management#workflow" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orcaa-blue">
                      Workflow Designer
                    </Link>
                    <Link href="/application-management#templates" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orcaa-blue">
                      Workflow Templates
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <Link href="/application-management#user-role" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orcaa-blue">
                      User & Role Mapping
                    </Link>
                    <Link href="/application-management#role-action" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orcaa-blue">
                      Role-Action Mapping
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <Link href="/application-management#reports" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orcaa-blue">
                      User Role Report
                    </Link>
                  </div>
                </div>
              </div>
              <a href="https://orcaa.org" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-orcaa-blue font-medium">
                ORCAA Website
              </a>
            </nav>

            {/* User Authentication Section */}
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 w-24 bg-gray-200 rounded"></div>
              </div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                {user.firstName && (
                  <>
                    <span className="hidden md:block text-sm text-gray-600">
                      {user.firstName} {user.lastName}
                    </span>
                    <div className="hidden md:flex gap-1">
                      {user.roles && (typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles).map((role: string) => (
                        <Badge key={role} className={getRoleBadgeColor(role)}>
                          {formatRoleName(role)}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/api/logout'}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="bg-orcaa-blue hover:bg-orcaa-blue/90 text-white"
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="lg:hidden"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-3">
              <Link href="/dashboard" className="text-gray-700 hover:text-orcaa-blue font-medium py-2">
                Dashboard
              </Link>
              <Link href="/inbox" className="text-gray-700 hover:text-orcaa-blue font-medium py-2">
                Inbox
              </Link>
              
              {/* Time Management Mobile Section */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <Link href="/time-management" className="text-gray-700 hover:text-orcaa-blue font-medium py-2 flex items-center gap-2">
                  <span className="font-semibold">Time Management</span>
                </Link>
                <div className="ml-4 mt-2 space-y-2">
                  <Link href="/time-entries" className="block text-sm text-gray-600 hover:text-orcaa-blue py-1">
                    Time Entries
                  </Link>
                  <Link href="/leave-requests" className="block text-sm text-gray-600 hover:text-orcaa-blue py-1">
                    Leave Requests
                  </Link>
                  <Link href="/overtime-requests" className="block text-sm text-gray-600 hover:text-orcaa-blue py-1">
                    Overtime Requests
                  </Link>
                </div>
              </div>
              <Link href="/audit-trail" className="text-gray-700 hover:text-orcaa-blue font-medium py-2">
                Audit Trail
              </Link>
              
              {/* Application Management Mobile Section */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <Link href="/application-management" className="text-gray-700 hover:text-orcaa-blue font-medium py-2 flex items-center gap-2">
                  <span className="font-semibold">Application Management</span>
                </Link>
                <div className="ml-4 mt-2 space-y-2">
                  <Link href="/application-management#users" className="block text-sm text-gray-600 hover:text-orcaa-blue py-1">
                    User Management
                  </Link>
                  <Link href="/application-management#roles" className="block text-sm text-gray-600 hover:text-orcaa-blue py-1">
                    Role Management
                  </Link>
                  <Link href="/application-management#list-values" className="block text-sm text-gray-600 hover:text-orcaa-blue py-1">
                    List Values
                  </Link>
                  <Link href="/application-management#workflow" className="block text-sm text-gray-600 hover:text-orcaa-blue py-1">
                    Workflow Designer
                  </Link>
                  <Link href="/application-management#templates" className="block text-sm text-gray-600 hover:text-orcaa-blue py-1">
                    Workflow Templates
                  </Link>
                  <Link href="/application-management#user-role" className="block text-sm text-gray-600 hover:text-orcaa-blue py-1">
                    User & Role Mapping
                  </Link>
                  <Link href="/application-management#role-action" className="block text-sm text-gray-600 hover:text-orcaa-blue py-1">
                    Role-Action Mapping
                  </Link>
                  <Link href="/application-management#reports" className="block text-sm text-gray-600 hover:text-orcaa-blue py-1">
                    User Role Report
                  </Link>
                </div>
              </div>
              <a href="https://orcaa.org" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-orcaa-blue font-medium py-2">
                ORCAA Website
              </a>
            </nav>
          </div>
        )}
      </div>


    </header>
  );
}