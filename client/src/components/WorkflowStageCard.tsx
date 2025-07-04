import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { WorkflowStage, User } from "@shared/schema";

interface WorkflowStageCardProps {
  stage: WorkflowStage;
  onUpdate: (id: number, data: Partial<WorkflowStage>) => void;
  users: User[];
}

export default function WorkflowStageCard({ stage, onUpdate, users }: WorkflowStageCardProps) {
  const roleOptions = [
    { value: "field_staff", label: "Field Staff" },
    { value: "contract_staff", label: "Contract Staff" },
    { value: "supervisor", label: "Supervisor" },
    { value: "approver", label: "Approver" },
    { value: "admin", label: "Admin" },
  ];

  const statusOptions = [
    { value: "initiated", label: "Initiated" },
    { value: "inspection", label: "Inspection" },
    { value: "work_in_progress", label: "Work In Progress" },
    { value: "work_completed", label: "Work Completed" },
    { value: "reviewed", label: "Reviewed" },
    { value: "approved", label: "Approved" },
    { value: "closed", label: "Closed" },
  ];

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-md font-medium text-gray-900">
            Stage: {stage.displayName}
          </h4>
          <span className="text-sm text-gray-500">Order: {stage.order}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`role-${stage.id}`} className="text-sm font-medium text-gray-700 mb-1">
              Assigned Role
            </Label>
            <Select
              value={stage.assignedRole}
              onValueChange={(value) => onUpdate(stage.id, { assignedRole: value })}
            >
              <SelectTrigger id={`role-${stage.id}`}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={`next-${stage.id}`} className="text-sm font-medium text-gray-700 mb-1">
              Next Stage
            </Label>
            <Select
              value={stage.nextStage || ""}
              onValueChange={(value) => onUpdate(stage.id, { nextStage: value || null })}
            >
              <SelectTrigger id={`next-${stage.id}`}>
                <SelectValue placeholder="Select next stage" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions
                  .filter(option => option.value !== stage.name)
                  .map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 flex items-center space-x-2">
          <Checkbox
            id={`sms-${stage.id}`}
            checked={stage.smsNotification}
            onCheckedChange={(checked) => onUpdate(stage.id, { smsNotification: !!checked })}
          />
          <Label htmlFor={`sms-${stage.id}`} className="text-sm text-gray-900">
            Send SMS notification
          </Label>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          <p>
            <strong>Assigned users:</strong>{" "}
            {users
              .filter(user => user.role === stage.assignedRole)
              .map(user => `${user.firstName} ${user.lastName}`)
              .join(", ") || "None"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
