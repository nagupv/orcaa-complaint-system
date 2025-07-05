import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AuditEntry } from "@shared/schema";
import { User, FileText, Settings, AlertCircle } from "lucide-react";

export default function AuditTrail() {
  const [filters, setFilters] = useState({
    complaintId: "",
    actionType: "",
    dateFrom: "",
    dateTo: "",
  });

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

  const { data: auditEntries, isLoading, refetch } = useQuery({
    queryKey: ["/api/audit-trail", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") params.append(key, value);
      });
      
      const response = await fetch(`/api/audit-trail?${params}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch audit trail");
      }
      
      return response.json() as Promise<AuditEntry[]>;
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    refetch();
  };

  const clearFilters = () => {
    setFilters({
      complaintId: "",
      actionType: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Audit Trail</h2>
      </div>

      {/* Audit Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Audit Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="complaintId">Complaint ID</Label>
              <Input
                id="complaintId"
                placeholder="AQ-2024-001"
                value={filters.complaintId}
                onChange={(e) => handleFilterChange("complaintId", e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="actionType">Action Type</Label>
              <Select value={filters.actionType || undefined} onValueChange={(value) => handleFilterChange("actionType", value || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="status_changed">Status Changed</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="work_description_added">Work Description Added</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button 
              onClick={applyFilters}
              className="bg-orcaa-blue hover:bg-orcaa-blue-light"
            >
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading audit entries...</div>
          ) : auditEntries && auditEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Action
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Complaint ID
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Description
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      User
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Timestamp
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getActionIcon(entry.action)}
                          {getActionBadge(entry.action)}
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                        {entry.complaintId || "N/A"}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                        {getActionDescription(entry)}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                        {entry.userId || "System"}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                        {formatTimestamp(entry.timestamp)}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                        {entry.reason && (
                          <div className="mb-1">
                            <span className="font-medium">Reason:</span> {entry.reason}
                          </div>
                        )}
                        {entry.previousValue && entry.newValue && (
                          <div>
                            <span className="font-medium">Change:</span> {entry.previousValue} → {entry.newValue}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No audit entries found for the selected filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
