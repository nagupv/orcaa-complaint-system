import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import StatisticsCards from "@/components/StatisticsCards";
import ComplaintTable from "@/components/ComplaintTable";
import { Complaint } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Search, Filter, X, Calendar, MapPin, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const [filters, setFilters] = useState({
    textSearch: "",
    complaintType: "",
    status: "",
    priority: "",
    problemType: "",
    city: "",
    county: "",
    assignedTo: "",
    dateFrom: "",
    dateTo: "",
  });

  const [filterOptions, setFilterOptions] = useState({
    statuses: [],
    cities: [],
    counties: [],
    problemTypes: [],
    assignedUsers: [],
  });

  // Load filter options
  const { data: filterOptionsData } = useQuery({
    queryKey: ["/api/complaints/filter-options"],
    queryFn: async () => {
      const response = await fetch("/api/complaints/filter-options", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch filter options");
      return response.json();
    },
  });

  useEffect(() => {
    if (filterOptionsData) {
      setFilterOptions(filterOptionsData);
    }
  }, [filterOptionsData]);

  const { data: complaints, isLoading, refetch } = useQuery({
    queryKey: ["/api/complaints/search", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "") params.append(key, value);
      });
      
      const response = await fetch(`/api/complaints/search?${params}`, {
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
      textSearch: "",
      complaintType: "",
      status: "",
      priority: "",
      problemType: "",
      city: "",
      county: "",
      assignedTo: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  // Quick filter presets
  const quickFilters = [
    { label: "High Priority", key: "priority", value: "high", icon: AlertTriangle },
    { label: "Today", key: "dateFrom", value: new Date().toISOString().split('T')[0], icon: Calendar },
    { label: "This Week", key: "dateFrom", value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], icon: Calendar },
    { label: "In Progress", key: "status", value: "work_in_progress", icon: Filter },
  ];

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

      {/* Enhanced Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {quickFilters.map((filter) => {
              const Icon = filter.icon;
              return (
                <Button
                  key={filter.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange(filter.key, filter.value)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {filter.label}
                </Button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <Label htmlFor="textSearch" className="text-sm font-medium">Search across all fields</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="textSearch"
                placeholder="Search complaints, addresses, comments, problem types..."
                value={filters.textSearch}
                onChange={(e) => handleFilterChange("textSearch", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="complaintType">Complaint Type</Label>
              <Select value={filters.complaintType} onValueChange={(value) => handleFilterChange("complaintType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="Air Quality">Air Quality</SelectItem>
                  <SelectItem value="Demolition Notice">Demolition Notice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  {filterOptions.statuses.map((status: string) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={filters.priority} onValueChange={(value) => handleFilterChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
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
                  <SelectItem value="">All Types</SelectItem>
                  {filterOptions.problemTypes.map((type: string) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Select value={filters.city} onValueChange={(value) => handleFilterChange("city", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Cities</SelectItem>
                  {filterOptions.cities.map((city: string) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="county">County</Label>
              <Select value={filters.county} onValueChange={(value) => handleFilterChange("county", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Counties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Counties</SelectItem>
                  {filterOptions.counties.map((county: string) => (
                    <SelectItem key={county} value={county}>
                      {county}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select value={filters.assignedTo} onValueChange={(value) => handleFilterChange("assignedTo", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Users</SelectItem>
                  {filterOptions.assignedUsers.map((user: string) => (
                    <SelectItem key={user} value={user}>
                      {user}
                    </SelectItem>
                  ))}
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

            <div>
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>
          </div>

          {/* Search Results Count */}
          {complaints && (
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                Found {complaints.length} complaints
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>
          )}
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
