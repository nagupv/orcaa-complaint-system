import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Complaint } from "@shared/schema";

interface ComplaintTableProps {
  complaints: Complaint[];
  isLoading: boolean;
}

export default function ComplaintTable({ complaints, isLoading }: ComplaintTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "initiated":
        return <Badge className="bg-blue-100 text-blue-800">Initiated</Badge>;
      case "inspection":
        return <Badge className="bg-yellow-100 text-yellow-800">Inspection</Badge>;
      case "work_in_progress":
        return <Badge className="bg-orange-100 text-orange-800">Work In Progress</Badge>;
      case "work_completed":
        return <Badge className="bg-green-100 text-green-800">Work Completed</Badge>;
      case "reviewed":
        return <Badge className="bg-purple-100 text-purple-800">Reviewed</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getProblemTypes = (problemTypes: any) => {
    if (!problemTypes || !Array.isArray(problemTypes)) return "N/A";
    return problemTypes.join(", ");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No complaints found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Complaint ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {complaints.map((complaint) => (
            <TableRow key={complaint.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">
                <a 
                  href={`#complaint-${complaint.id}`}
                  className="text-orcaa-blue hover:text-orcaa-blue-light hover:underline"
                >
                  {complaint.complaintId}
                </a>
              </TableCell>
              <TableCell>{formatDate(complaint.createdAt)}</TableCell>
              <TableCell>{getProblemTypes(complaint.problemTypes)}</TableCell>
              <TableCell>{getStatusBadge(complaint.status)}</TableCell>
              <TableCell className="text-sm text-gray-500">
                {complaint.sourceCity || complaint.complainantCity || "N/A"}
              </TableCell>
              <TableCell>
                <Badge 
                  className={
                    complaint.priority === "urgent" 
                      ? "bg-red-100 text-red-800"
                      : complaint.priority === "high"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-gray-100 text-gray-800"
                  }
                >
                  {complaint.priority || "Normal"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-orcaa-blue hover:text-orcaa-blue-light"
                  >
                    View
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
