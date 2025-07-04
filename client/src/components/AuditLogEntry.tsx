import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, FileText, Settings, AlertCircle } from "lucide-react";
import { AuditEntry } from "@shared/schema";

interface AuditLogEntryProps {
  entry: AuditEntry;
}

export default function AuditLogEntry({ entry }: AuditLogEntryProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "status_changed":
        return <Settings className="h-4 w-4 text-orange-500" />;
      case "assigned":
        return <User className="h-4 w-4 text-green-500" />;
      case "updated":
        return <Settings className="h-4 w-4 text-purple-500" />;
      case "work_description_added":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "closed":
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "created":
        return <Badge className="bg-blue-100 text-blue-800">Created</Badge>;
      case "status_changed":
        return <Badge className="bg-orange-100 text-orange-800">Status Changed</Badge>;
      case "assigned":
        return <Badge className="bg-green-100 text-green-800">Assigned</Badge>;
      case "updated":
        return <Badge className="bg-purple-100 text-purple-800">Updated</Badge>;
      case "work_description_added":
        return <Badge className="bg-blue-100 text-blue-800">Work Description Added</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{action}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionDescription = (entry: AuditEntry) => {
    switch (entry.action) {
      case "created":
        return "Complaint was created";
      case "status_changed":
        return `Status changed from "${entry.previousValue}" to "${entry.newValue}"`;
      case "assigned":
        return `Complaint assigned to user ${entry.newValue}`;
      case "updated":
        return "Complaint information was updated";
      case "work_description_added":
        return "Work description was added";
      case "closed":
        return "Complaint was closed";
      default:
        return `Action: ${entry.action}`;
    }
  };

  return (
    <Card className="hover:bg-gray-50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center">
              {getActionIcon(entry.action)}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getActionBadge(entry.action)}
                <span className="text-sm text-gray-500">
                  Complaint ID: {entry.complaintId}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {formatTimestamp(entry.timestamp)}
              </span>
            </div>
            
            <div className="mt-1">
              <p className="text-sm font-medium text-gray-900">
                {getActionDescription(entry)}
              </p>
              
              {entry.reason && (
                <p className="text-sm text-gray-600 mt-1">
                  Reason: {entry.reason}
                </p>
              )}
              
              {entry.userId && (
                <p className="text-sm text-gray-600 mt-1">
                  Changed by: {entry.userId}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
