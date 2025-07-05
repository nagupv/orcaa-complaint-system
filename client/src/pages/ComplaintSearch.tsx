import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Search, MapPin, Phone, Mail, Calendar, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Complaint {
  id: number;
  complaintId: string;
  complaintType: string;
  status: string;
  priority: string;
  problemTypes: string[] | null;
  complaintDescription: string | null;
  complainantFirstName: string | null;
  complainantLastName: string | null;
  complainantPhone: string | null;
  complainantEmail: string | null;
  incidentAddress: string | null;
  incidentCity: string | null;
  incidentState: string | null;
  incidentZipCode: string | null;
  incidentDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export default function ComplaintSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState(false);

  const { data: complaint, isLoading, error, refetch } = useQuery<Complaint>({
    queryKey: ['/api/complaints/public-search', searchTerm],
    queryFn: async (): Promise<Complaint> => {
      if (!searchTerm.trim()) {
        throw new Error('Please enter a complaint ID');
      }
      
      const response = await fetch(`/api/complaints/public-search/${encodeURIComponent(searchTerm.trim().toUpperCase())}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Complaint not found');
        }
        throw new Error('Failed to search complaint');
      }
      
      return response.json() as Promise<Complaint>;
    },
    enabled: false, // Only search when explicitly triggered
    retry: false
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchSubmitted(true);
      refetch();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Search Your Complaint
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Enter your complaint ID to check the status and details of your submission
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Complaint Search
              </CardTitle>
              <CardDescription>
                Enter your complaint ID (e.g., AQ-2025-001 or DN-2025-001) to view details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Enter complaint ID (e.g., AQ-2025-001)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <Button type="submit" disabled={isLoading || !searchTerm.trim()}>
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {searchSubmitted && (
            <>
              {isLoading && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Searching for your complaint...</p>
                  </CardContent>
                </Card>
              )}

              {error && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    Complaint not found. Please check your complaint ID and try again.
                  </AlertDescription>
                </Alert>
              )}

              {complaint && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">
                          {complaint.complaintId}
                        </CardTitle>
                        <CardDescription className="text-lg">
                          {complaint.complaintType} Complaint
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(complaint.status)}>
                          {complaint.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getPriorityColor(complaint.priority)}>
                          {complaint.priority?.toUpperCase()} PRIORITY
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Complaint Details */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Complaint Details
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="font-medium text-gray-700 dark:text-gray-300">Problem Types:</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {complaint.problemTypes?.map((type, index) => (
                              <Badge key={index} variant="outline">
                                {type}
                              </Badge>
                            )) || <span className="text-gray-500">Not specified</span>}
                          </div>
                        </div>
                        <div>
                          <label className="font-medium text-gray-700 dark:text-gray-300">Description:</label>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {complaint.complaintDescription || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Contact Information */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Contact Information
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="font-medium text-gray-700 dark:text-gray-300">Name:</label>
                          <p className="text-gray-600 dark:text-gray-400">
                            {complaint.complainantFirstName || complaint.complainantLastName
                              ? `${complaint.complainantFirstName || ''} ${complaint.complainantLastName || ''}`.trim()
                              : 'Anonymous'}
                          </p>
                        </div>
                        <div>
                          <label className="font-medium text-gray-700 dark:text-gray-300">Phone:</label>
                          <p className="text-gray-600 dark:text-gray-400">
                            {complaint.complainantPhone || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="font-medium text-gray-700 dark:text-gray-300">Email:</label>
                          <p className="text-gray-600 dark:text-gray-400">
                            {complaint.complainantEmail || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Location Information */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Incident Location
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="font-medium text-gray-700 dark:text-gray-300">Address:</label>
                          <p className="text-gray-600 dark:text-gray-400">
                            {complaint.incidentAddress || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="font-medium text-gray-700 dark:text-gray-300">City, State ZIP:</label>
                          <p className="text-gray-600 dark:text-gray-400">
                            {[complaint.incidentCity, complaint.incidentState, complaint.incidentZipCode]
                              .filter(Boolean)
                              .join(', ') || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Timeline Information */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Timeline
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="font-medium text-gray-700 dark:text-gray-300">Incident Date:</label>
                          <p className="text-gray-600 dark:text-gray-400">
                            {complaint.incidentDate
                              ? format(new Date(complaint.incidentDate), 'PPP')
                              : 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <label className="font-medium text-gray-700 dark:text-gray-300">Submitted:</label>
                          <p className="text-gray-600 dark:text-gray-400">
                            {complaint.createdAt
                              ? format(new Date(complaint.createdAt), 'PPP p')
                              : 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <label className="font-medium text-gray-700 dark:text-gray-300">Last Updated:</label>
                          <p className="text-gray-600 dark:text-gray-400">
                            {complaint.updatedAt
                              ? format(new Date(complaint.updatedAt), 'PPP p')
                              : 'No updates'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Need to submit a new complaint?
            </p>
            <Button asChild variant="outline">
              <a href="/">Submit New Complaint</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}