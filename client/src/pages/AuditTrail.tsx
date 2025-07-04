import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AuditEntry } from "@shared/schema";
import AuditLogEntry from "@/components/AuditLogEntry";

export default function AuditTrail() {
  const [filters, setFilters] = useState({
    complaintId: "",
    actionType: "",
    dateFrom: "",
    dateTo: "",
  });

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

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading audit entries...</div>
          ) : auditEntries && auditEntries.length > 0 ? (
            <div className="space-y-4">
              {auditEntries.map((entry) => (
                <AuditLogEntry key={entry.id} entry={entry} />
              ))}
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
