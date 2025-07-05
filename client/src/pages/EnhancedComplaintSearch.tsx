import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Filter, 
  Download, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  AlertCircle,
  FileText,
  Clock,
  Users,
  Target
} from 'lucide-react';
import { format } from 'date-fns';

interface Complaint {
  id: number;
  complaintId: string;
  complaintType: string;
  status: string;
  priority: string;
  problemTypes: string[] | null;
  complainantFirstName: string | null;
  complainantLastName: string | null;
  complainantPhone: string | null;
  complainantEmail: string | null;
  sourceAddress: string | null;
  sourceCity: string | null;
  complainantAddress: string | null;
  complainantCity: string | null;
  complainantState: string | null;
  complainantZipCode: string | null;
  workSiteAddress: string | null;
  workSiteCity: string | null;
  workSiteZip: string | null;
  workSiteCounty: string | null;
  otherDescription: string | null;
  assignedTo: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface SearchFilters {
  textSearch: string;
  complaintType: string;
  status: string;
  priority: string;
  problemType: string;
  city: string;
  county: string;
  assignedTo: string;
  dateFrom: string;
  dateTo: string;
}

interface AnalyticsData {
  totalComplaints: number;
  statusBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  monthlyTrends: Array<{ month: string; count: number; }>;
  problemTypeBreakdown: Record<string, number>;
  cityBreakdown: Record<string, number>;
  averageResolutionTime: number;
  responseTimeMetrics: {
    averageHours: number;
    withinSLA: number;
    totalResponses: number;
  };
}

export default function EnhancedComplaintSearch() {
  const [filters, setFilters] = useState<SearchFilters>({
    textSearch: '',
    complaintType: '',
    status: '',
    priority: '',
    problemType: '',
    city: '',
    county: '',
    assignedTo: '',
    dateFrom: '',
    dateTo: ''
  });

  const [activeTab, setActiveTab] = useState('search');

  // Fetch all complaints with filters
  const { data: complaints = [], isLoading: complaintsLoading, refetch } = useQuery({
    queryKey: ['/api/complaints/search', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/complaints/search?${params}`);
      if (!response.ok) throw new Error('Failed to fetch complaints');
      return response.json();
    }
  });

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/complaints/analytics', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/complaints/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  // Fetch unique values for filter dropdowns
  const { data: filterOptions = {} } = useQuery({
    queryKey: ['/api/complaints/filter-options'],
    queryFn: async () => {
      const response = await fetch('/api/complaints/filter-options');
      if (!response.ok) throw new Error('Failed to fetch filter options');
      return response.json();
    }
  });

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      textSearch: '',
      complaintType: '',
      status: '',
      priority: '',
      problemType: '',
      city: '',
      county: '',
      assignedTo: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const exportResults = () => {
    const csvData = complaints.map(complaint => ({
      'Complaint ID': complaint.complaintId,
      'Type': complaint.complaintType,
      'Status': complaint.status,
      'Priority': complaint.priority,
      'Problem Types': complaint.problemTypes?.join(', ') || '',
      'Complainant': `${complaint.complainantFirstName || ''} ${complaint.complainantLastName || ''}`.trim(),
      'Email': complaint.complainantEmail,
      'Phone': complaint.complainantPhone,
      'Address': complaint.sourceAddress || complaint.complainantAddress || complaint.workSiteAddress || '',
      'City': complaint.sourceCity || complaint.complainantCity || complaint.workSiteCity || '',
      'County': complaint.workSiteCounty || '',
      'Assigned To': complaint.assignedTo,
      'Created': complaint.createdAt ? format(new Date(complaint.createdAt), 'yyyy-MM-dd HH:mm') : '',
      'Updated': complaint.updatedAt ? format(new Date(complaint.updatedAt), 'yyyy-MM-dd HH:mm') : ''
    }));

    const csvHeaders = Object.keys(csvData[0] || {});
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => csvHeaders.map(header => `"${(row as any)[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complaints-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'initiated': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'inspection': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'work_in_progress': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'work_completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'approved': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      'closed': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'normal': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'urgent': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Complaints Analytics & Search
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive search and analytics dashboard for internal complaint management
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Advanced Search
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics Dashboard
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports & Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          {/* Advanced Search Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Search Filters
              </CardTitle>
              <CardDescription>
                Use multiple filters to find specific complaints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Text Search */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Search Text (Address, Comments, Description)
                  </label>
                  <Input
                    placeholder="Search in all text fields..."
                    value={filters.textSearch}
                    onChange={(e) => handleFilterChange('textSearch', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Complaint Type</label>
                  <Select value={filters.complaintType} onValueChange={(value) => handleFilterChange('complaintType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="AIR_QUALITY">Air Quality</SelectItem>
                      <SelectItem value="DEMOLITION_NOTICE">Demolition Notice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      {filterOptions.statuses?.map((status: string) => (
                        <SelectItem key={status} value={status}>
                          {status.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All priorities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Problem Type</label>
                  <Select value={filters.problemType} onValueChange={(value) => handleFilterChange('problemType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All problem types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All problem types</SelectItem>
                      {filterOptions.problemTypes?.map((type: string) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <Select value={filters.city} onValueChange={(value) => handleFilterChange('city', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All cities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All cities</SelectItem>
                      {filterOptions.cities?.map((city: string) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date From</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date To</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => refetch()}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button variant="outline" onClick={exportResults} disabled={!complaints.length}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Search Results ({complaints.length} complaints)</span>
                {complaintsLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {complaints.length === 0 && !complaintsLoading ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No complaints found matching your search criteria.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Complaint ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Problem Types</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Complainant</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Assigned</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complaints.map((complaint: Complaint) => (
                        <TableRow key={complaint.id}>
                          <TableCell className="font-medium">
                            {complaint.complaintId}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {complaint.complaintType.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(complaint.status)}>
                              {complaint.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(complaint.priority)}>
                              {complaint.priority?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {complaint.problemTypes?.slice(0, 2).map((type, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                              {(complaint.problemTypes?.length || 0) > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{(complaint.problemTypes?.length || 0) - 2} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">
                                {complaint.sourceCity || complaint.complainantCity || complaint.workSiteCity || 'N/A'}
                              </div>
                              <div className="text-gray-500 truncate max-w-[200px]">
                                {complaint.sourceAddress || complaint.complainantAddress || complaint.workSiteAddress || 'No address'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">
                                {complaint.complainantFirstName && complaint.complainantLastName
                                  ? `${complaint.complainantFirstName} ${complaint.complainantLastName}`
                                  : 'Anonymous'
                                }
                              </div>
                              <div className="text-gray-500">
                                {complaint.complainantEmail}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {complaint.createdAt 
                              ? format(new Date(complaint.createdAt), 'MMM dd, yyyy')
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            {complaint.assignedTo || 'Unassigned'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {analyticsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : analytics ? (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Total Complaints
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {analytics.totalComplaints}
                        </p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Avg Resolution Time
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {analytics.averageResolutionTime || 0}d
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Response Rate
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {analytics.responseTimeMetrics ? 
                            Math.round((analytics.responseTimeMetrics.withinSLA / analytics.responseTimeMetrics.totalResponses) * 100) 
                            : 0}%
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Active Cases
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {(analytics.statusBreakdown?.['initiated'] || 0) + 
                           (analytics.statusBreakdown?.['inspection'] || 0) + 
                           (analytics.statusBreakdown?.['work_in_progress'] || 0)}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analytics.statusBreakdown || {}).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(status)}>
                              {status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Priority Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Priority Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analytics.priorityBreakdown || {}).map(([priority, count]) => (
                        <div key={priority} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(priority)}>
                              {priority.toUpperCase()}
                            </Badge>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Problem Types */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Top Problem Types
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analytics.problemTypeBreakdown || {})
                        .sort(([,a], [,b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="capitalize">{type}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Geographic Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Top Cities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analytics.cityBreakdown || {})
                        .sort(([,a], [,b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([city, count]) => (
                        <div key={city} className="flex items-center justify-between">
                          <span>{city}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Monthly Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.monthlyTrends?.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <span className="font-medium">{trend.month}</span>
                        <Badge variant="outline">{trend.count} complaints</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export & Reports</CardTitle>
              <CardDescription>
                Generate and download various reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={exportResults} disabled={!complaints.length}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Current Search Results
                </Button>
                
                <Button variant="outline" disabled>
                  <Calendar className="h-4 w-4 mr-2" />
                  Monthly Report (Coming Soon)
                </Button>
                
                <Button variant="outline" disabled>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics Report (Coming Soon)
                </Button>
                
                <Button variant="outline" disabled>
                  <Users className="h-4 w-4 mr-2" />
                  Performance Report (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}