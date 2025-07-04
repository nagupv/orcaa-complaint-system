import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import FileUpload from "@/components/FileUpload";
import { PROBLEM_TYPES, US_STATES } from "@/lib/constants";

interface ComplaintFormFieldsProps {
  form: UseFormReturn<any>;
}

export default function ComplaintFormFields({ form }: ComplaintFormFieldsProps) {
  const { register, setValue, watch, formState: { errors } } = form;
  
  return (
    <div className="space-y-6">
      {/* Complainant Information */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Complainant Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Do you want to remain anonymous as protected by law? <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              onValueChange={(value) => setValue("isAnonymous", value === "true")}
              value={watch("isAnonymous") ? "true" : "false"}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="anonymous-yes" />
                <Label htmlFor="anonymous-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="anonymous-no" />
                <Label htmlFor="anonymous-no">No</Label>
              </div>
            </RadioGroup>
            {errors.isAnonymous && (
              <p className="text-sm text-red-500">{String(errors.isAnonymous.message)}</p>
            )}
          </div>

          {/* Conditional fields based on anonymous selection */}
          {!watch("isAnonymous") && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...register("complainantFirstName")}
                    placeholder="Enter your first name"
                  />
                  {errors.complainantFirstName && (
                    <p className="text-sm text-red-500">{String(errors.complainantFirstName.message)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...register("complainantLastName")}
                    placeholder="Enter your last name"
                  />
                  {errors.complainantLastName && (
                    <p className="text-sm text-red-500">{String(errors.complainantLastName.message)}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("complainantEmail")}
                  placeholder="Enter your email address"
                />
                {errors.complainantEmail && (
                  <p className="text-sm text-red-500">{String(errors.complainantEmail.message)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register("complainantPhone")}
                  placeholder="Enter your phone number"
                />
                {errors.complainantPhone && (
                  <p className="text-sm text-red-500">{String(errors.complainantPhone.message)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  {...register("complainantAddress")}
                  placeholder="Enter your street address"
                />
                {errors.complainantAddress && (
                  <p className="text-sm text-red-500">{String(errors.complainantAddress.message)}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    {...register("complainantCity")}
                    placeholder="Enter your city"
                  />
                  {errors.complainantCity && (
                    <p className="text-sm text-red-500">{String(errors.complainantCity.message)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select
                    onValueChange={(value) => setValue("complainantState", value)}
                    value={watch("complainantState")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.complainantState && (
                    <p className="text-sm text-red-500">{String(errors.complainantState.message)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    {...register("complainantZipCode")}
                    placeholder="Enter ZIP code"
                  />
                  {errors.complainantZipCode && (
                    <p className="text-sm text-red-500">{String(errors.complainantZipCode.message)}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Emission Source Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Emission Source Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sourceName">Source Name (if known)</Label>
            <Input
              id="sourceName"
              {...register("sourceName")}
              placeholder="Name of business, facility, or individual"
            />
            {errors.sourceName && (
              <p className="text-sm text-red-500">{String(errors.sourceName.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceAddress">Source Address</Label>
            <Input
              id="sourceAddress"
              {...register("sourceAddress")}
              placeholder="Address where the emission is occurring"
            />
            {errors.sourceAddress && (
              <p className="text-sm text-red-500">{String(errors.sourceAddress.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceCity">Source City</Label>
            <Input
              id="sourceCity"
              {...register("sourceCity")}
              placeholder="City where the emission is occurring"
            />
            {errors.sourceCity && (
              <p className="text-sm text-red-500">{String(errors.sourceCity.message)}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Problem Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Problem Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              What type of problem are you reporting? (Check all that apply) <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-4">
              {PROBLEM_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.value}
                    checked={watch("problemTypes")?.includes(type.value)}
                    onCheckedChange={(checked) => {
                      const currentTypes = watch("problemTypes") || [];
                      if (checked) {
                        setValue("problemTypes", [...currentTypes, type.value]);
                      } else {
                        setValue("problemTypes", currentTypes.filter((t: string) => t !== type.value));
                      }
                    }}
                  />
                  <Label htmlFor={type.value} className="text-sm">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
            {errors.problemTypes && (
              <p className="text-sm text-red-500">{String(errors.problemTypes.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="otherDescription">Problem Description</Label>
            <Textarea
              id="otherDescription"
              {...register("otherDescription")}
              placeholder="Please describe the air quality issue in detail..."
              rows={4}
            />
            {errors.otherDescription && (
              <p className="text-sm text-red-500">{String(errors.otherDescription.message)}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="previousContact"
              checked={watch("previousContact")}
              onCheckedChange={(checked) => setValue("previousContact", checked)}
            />
            <Label htmlFor="previousContact" className="text-sm">
              I have previously contacted ORCAA about this issue
            </Label>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Priority Level</Label>
            <RadioGroup
              onValueChange={(value) => setValue("priority", value)}
              value={watch("priority")}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="priority-low" />
                <Label htmlFor="priority-low">Low</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="priority-normal" />
                <Label htmlFor="priority-normal">Normal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="priority-high" />
                <Label htmlFor="priority-high">High</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="urgent" id="priority-urgent" />
                <Label htmlFor="priority-urgent">Urgent</Label>
              </div>
            </RadioGroup>
            {errors.priority && (
              <p className="text-sm text-red-500">{String(errors.priority.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">File Attachments (Optional)</Label>
            <FileUpload
              onFileSelect={(files) => setValue("attachments", files)}
              maxSize={14}
              acceptedTypes={[".jpg", ".jpeg", ".png", ".gif", ".mp4", ".mov", ".avi", ".pdf", ".doc", ".docx"]}
            />
            <p className="text-xs text-gray-500">
              Upload photos, videos, or documents related to your complaint. Maximum 14MB per file.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}