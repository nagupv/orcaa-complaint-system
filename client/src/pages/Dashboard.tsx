import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatisticsCards from "@/components/StatisticsCards";
import ComplaintTable from "@/components/ComplaintTable";
import { Complaint } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Dashboard() {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    problemType: "",
    dateFrom: "",
    dateTo: "",
  });

  const { data: complaints, isLoading, refetch } = useQuery({
    queryKey: ["/api/complaints", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") params.append(key, value);
      });
      
      const response = await fetch(`/api/complaints?${params}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch complaints");
      }
      
      return response.json() as Promise<Complaint[]>;
    },
  });

  const { data: monthlyStats, isLoading: monthlyLoading } = useQuery({
    queryKey: ["/api/complaints/monthly-stats"],
  });

  const { data: yearlyStats, isLoading: yearlyLoading } = useQuery({
    queryKey: ["/api/complaints/yearly-stats"],
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    refetch();
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      problemType: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Complaints Dashboard</h2>
      </div>

      {/* Statistics Cards */}
      <StatisticsCards />

      {/* Charts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Complaint Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="monthly" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly Statistics</TabsTrigger>
              <TabsTrigger value="yearly">Yearly Trends</TabsTrigger>
            </TabsList>
            
            <TabsContent value="monthly" className="space-y-4">
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Monthly Complaint Statistics</h3>
                {monthlyLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-gray-500">Loading chart data...</div>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyStats || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" fill="#3b82f6" name="Total Complaints" />
                        <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" />
                        <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="yearly" className="space-y-4">
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Yearly Complaint Trends (Last 12 Months)</h3>
                {yearlyLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-gray-500">Loading chart data...</div>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={yearlyStats || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total Complaints" strokeWidth={2} />
                        <Line type="monotone" dataKey="inProgress" stroke="#f59e0b" name="In Progress" strokeWidth={2} />
                        <Line type="monotone" dataKey="resolved" stroke="#10b981" name="Resolved" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search complaints..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="initiated">Initiated</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="work_in_progress">Work In Progress</SelectItem>
                  <SelectItem value="work_completed">Work Completed</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="problemType">Problem Type</Label>
              <Select value={filters.problemType} onValueChange={(value) => handleFilterChange("problemType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="smoke">Smoke</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="odor">Odor</SelectItem>
                  <SelectItem value="outdoor_burning">Outdoor Burning</SelectItem>
                  <SelectItem value="dust">Dust</SelectItem>
                  <SelectItem value="wood_stove">Wood Stove</SelectItem>
                  <SelectItem value="asbestos_demo">Asbestos/Demo</SelectItem>
                  <SelectItem value="marijuana">Marijuana</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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

      {/* Complaints Table */}
      <Card>
        <CardHeader>
          <CardTitle>Complaints</CardTitle>
        </CardHeader>
        <CardContent>
          <ComplaintTable complaints={complaints || []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
