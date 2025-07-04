export const PROBLEM_TYPES = [
  { value: "smoke", label: "Smoke" },
  { value: "industrial", label: "Industrial" },
  { value: "odor", label: "Odor" },
  { value: "outdoor_burning", label: "Outdoor Burning" },
  { value: "dust", label: "Dust" },
  { value: "wood_stove", label: "Wood Stove" },
  { value: "asbestos_demo", label: "Asbestos/Demo" },
  { value: "marijuana", label: "Marijuana" },
  { value: "other", label: "Other" },
];

export const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

export const WORKFLOW_STAGES = [
  { value: "initiated", label: "Initiated" },
  { value: "inspection", label: "Inspection" },
  { value: "work_in_progress", label: "Work In Progress" },
  { value: "work_completed", label: "Work Completed" },
  { value: "reviewed", label: "Reviewed" },
  { value: "approved", label: "Approved" },
  { value: "closed", label: "Closed" },
];

export const USER_ROLES = [
  { value: "field_staff", label: "Field Staff" },
  { value: "contract_staff", label: "Contract Staff" },
  { value: "supervisor", label: "Supervisor" },
  { value: "approver", label: "Approver" },
  { value: "admin", label: "Admin" },
];

export const PRIORITY_LEVELS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];
