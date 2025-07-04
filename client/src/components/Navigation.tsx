import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

export default function Navigation() {
  const { user, isLoading } = useAuth();

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

  if (isLoading) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-orcaa-blue rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">ORCAA Complaint Management</span>
            </div>
            <div className="animate-pulse">
              <div className="h-8 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-orcaa-blue rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">ORCAA Complaint Management</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-sm text-gray-600">
                  {user.firstName} {user.lastName}
                </span>
                <div className="flex gap-1">
                  {(typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles).map((role: string) => (
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
        </div>
      </div>
    </nav>
  );
}
