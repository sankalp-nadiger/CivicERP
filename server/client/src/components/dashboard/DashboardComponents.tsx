/**
 * Shared Dashboard Components
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Calendar, AlertCircle, CheckCircle, Clock, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Complaint, User } from "@/types/governance";
import { calculateSLAStatus, formatTimeRemaining } from "@/lib/governanceUtils";

export const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
}> = ({ title, value, icon, trend }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon && <div className="text-gray-400">{icon}</div>}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend && (
        <p className={`text-xs ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
          {trend.isPositive ? "↑" : "↓"} {trend.value}% from last month
        </p>
      )}
    </CardContent>
  </Card>
);

export const ComplaintCard: React.FC<{
  complaint: Complaint;
  onAction?: (action: string) => void;
}> = ({ complaint, onAction }) => {
  const slaStatus = calculateSLAStatus(complaint);
  const hoursRemaining = slaStatus.hoursRemaining;

  const getSLAColor = () => {
    if (slaStatus.status === "BREACHED") return "bg-red-100 text-red-800 border-red-200";
    if (slaStatus.status === "NEAR_BREACH") return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getStatusIcon = () => {
    if (slaStatus.status === "BREACHED")
      return <AlertCircle className="w-4 h-4" />;
    if (slaStatus.status === "NEAR_BREACH")
      return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{complaint.title}</CardTitle>
            <CardDescription className="mt-1">
              ID: {complaint.id}
            </CardDescription>
          </div>
          {complaint.isHighPriority && (
            <Badge variant="destructive" className="ml-2">
              HIGH PRIORITY
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">{complaint.description}</p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-semibold text-gray-700">Status:</span>
            <Badge variant="outline" className="ml-1 text-xs">
              {complaint.status}
            </Badge>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Category:</span>
            <span className="text-gray-600 ml-1">{complaint.category}</span>
          </div>
        </div>

        <div className={`p-2 rounded border ${getSLAColor()} flex items-center gap-2`}>
          {getStatusIcon()}
          <div className="flex-1">
            <p className="text-xs font-semibold">{slaStatus.status}</p>
            <p className="text-xs">
              {hoursRemaining > 0
                ? `${formatTimeRemaining(hoursRemaining)} remaining`
                : "Deadline passed"}
            </p>
          </div>
          <span className="text-xs font-bold">{slaStatus.percentageUsed}%</span>
        </div>

        <div className="border-t pt-3 flex gap-2 flex-wrap">
          {complaint.status !== "CLOSED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction?.("update")}
            >
              Update Status
            </Button>
          )}
          {complaint.escalationCount < 3 && complaint.status !== "CLOSED" && (
            <Button
              size="sm"
              variant="outline"
              className="text-orange-600 hover:text-orange-700"
              onClick={() => onAction?.("escalate")}
            >
              Escalate
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction?.("view")}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const CreateDepartmentDialog: React.FC<{
  onSubmit: (data: { name: string; description: string; contactPerson: string; email: string; phone?: string }) => void;
  trigger?: React.ReactNode;
}> = ({ onSubmit, trigger }) => {
  const { t } = useTranslation();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [contactPerson, setContactPerson] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const handleSubmit = () => {
    if (name.trim() && contactPerson.trim() && email.trim()) {
      onSubmit({ name, description, contactPerson, email, phone: phone || undefined });
      setName("");
      setDescription("");
      setContactPerson("");
      setEmail("");
      setPhone("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>{t("dashboardComponents.createDepartmentDialog.trigger", "Create Department")}</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("dashboardComponents.createDepartmentDialog.title", "Create New Department")}</DialogTitle>
          <DialogDescription>
            {t(
              "dashboardComponents.createDepartmentDialog.description",
              "Add a new department and assign an authorized contact person. Login credentials will be automatically generated and sent to the provided email."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="dept-name">{t("dashboardComponents.fields.departmentName", "Department Name")} *</Label>
            <Input
              id="dept-name"
              placeholder={t("dashboardComponents.placeholders.departmentName", "e.g., Water Supply & Sanitation")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="dept-desc">{t("dashboardComponents.fields.description", "Description")}</Label>
            <Input
              id="dept-desc"
              placeholder={t(
                "dashboardComponents.placeholders.departmentDescription",
                "Brief description of department responsibilities"
              )}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              {t("dashboardComponents.fields.authorizedContactPerson", "Authorized Contact Person")}
            </p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="contact-person">{t("dashboardComponents.fields.fullName", "Full Name")} *</Label>
                <Input
                  id="contact-person"
                  placeholder={t("dashboardComponents.placeholders.fullName", "e.g., Rajesh Kumar")}
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contact-email">{t("dashboardComponents.fields.emailAddress", "Email Address")} *</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder={t("dashboardComponents.placeholders.email", "e.g., rajesh.kumar@gov.in")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t(
                    "dashboardComponents.hints.credentialsSentToEmail",
                    "Login credentials will be sent to this email"
                  )}
                </p>
              </div>
              <div>
                <Label htmlFor="contact-phone">{t("dashboardComponents.fields.phoneNumber", "Phone Number")}</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  placeholder={t("dashboardComponents.placeholders.phone", "e.g., +91 9876543210")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={!name.trim() || !contactPerson.trim() || !email.trim()}
          >
            {t(
              "dashboardComponents.createDepartmentDialog.submit",
              "Create Department & Send Credentials"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const CreateAreaDialog: React.FC<{
  parentAreaType: string;
  childAreaType: string;
  parentAreas?: any[];
  onSubmit: (data: { name: string; type: string; parentId?: string; contactPerson: string; email: string; phone?: string }) => void;
  trigger?: React.ReactNode;
}> = ({ parentAreaType, childAreaType, parentAreas = [], onSubmit, trigger }) => {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState(parentAreaType);
  const [parentId, setParentId] = React.useState("");
  const [contactPerson, setContactPerson] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const handleSubmit = () => {
    if (name.trim() && contactPerson.trim() && email.trim()) {
      onSubmit({
        name,
        type,
        parentId: parentId || undefined,
        contactPerson,
        email,
        phone: phone || undefined
      });
      setName("");
      setType(parentAreaType);
      setParentId("");
      setContactPerson("");
      setEmail("");
      setPhone("");
      setOpen(false);
    }
  };

  const availableParents = parentAreas.filter(a => a.type === parentAreaType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Create Area</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Area</DialogTitle>
          <DialogDescription>
            Add a new {parentAreaType} or {childAreaType} and assign an authorized officer. Login credentials will be sent to the provided email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Area Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={parentAreaType}>{parentAreaType}</SelectItem>
                <SelectItem value={childAreaType}>{childAreaType}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === childAreaType && availableParents.length > 0 && (
            <div>
              <Label>Parent {parentAreaType}</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={`Select a ${parentAreaType}`} />
                </SelectTrigger>
                <SelectContent>
                  {availableParents.map(area => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="area-name">Area Name *</Label>
            <Input
              id="area-name"
              placeholder={`e.g., ${type === parentAreaType ? "North Zone" : "Ward 1"}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Authorized Officer for this Area</p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="area-contact-person">Full Name *</Label>
                <Input
                  id="area-contact-person"
                  placeholder="e.g., Priya Singh"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="area-contact-email">Email Address *</Label>
                <Input
                  id="area-contact-email"
                  type="email"
                  placeholder="e.g., priya.singh@gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Login credentials will be sent here</p>
              </div>
              <div>
                <Label htmlFor="area-contact-phone">Phone Number</Label>
                <Input
                  id="area-contact-phone"
                  type="tel"
                  placeholder="e.g., +91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={!name.trim() || !contactPerson.trim() || !email.trim()}
          >
            Create Area & Send Credentials
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const UserListCard: React.FC<{
  users: User[];
  title: string;
  onDelete?: (userId: string, userName: string) => void;
}> = ({ users, title, onDelete }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {t("dashboardComponents.userList.count", "{{count}} users", { count: users.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {users.length === 0 ? (
            <p className="text-sm text-gray-500">
              {t("dashboardComponents.userList.empty", "No users yet")}
            </p>
          ) : (
            users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="ml-2">
                    {user.status}
                  </Badge>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(user.id, user.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      aria-label={t("dashboardComponents.userList.delete", "Delete")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const AddOfficerDialog: React.FC<{
  roleTitle: string;
  departments?: any[];
  areas?: any[];
  onSubmit: (data: { name: string; email: string; phone?: string; departmentId?: string; areaId?: string }) => void;
  trigger?: React.ReactNode;
}> = ({ roleTitle, departments = [], areas = [], onSubmit, trigger }) => {
  const { t } = useTranslation();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");
  const [areaId, setAreaId] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const handleSubmit = () => {
    if (name.trim() && email.trim()) {
      onSubmit({
        name,
        email,
        phone: phone || undefined,
        departmentId: departmentId || undefined,
        areaId: areaId || undefined
      });
      setName("");
      setEmail("");
      setPhone("");
      setDepartmentId("");
      setAreaId("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            {t("dashboardComponents.addOfficerDialog.trigger", "Add {{roleTitle}}", { roleTitle })}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("dashboardComponents.addOfficerDialog.title", "Add New {{roleTitle}}", { roleTitle })}
          </DialogTitle>
          <DialogDescription>
            {t(
              "dashboardComponents.addOfficerDialog.description",
              "Create a new {{roleTitle}} account. Login credentials will be automatically generated and sent to the provided email.",
              { roleTitle }
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="officer-name">{t("dashboardComponents.fields.fullName", "Full Name")} *</Label>
            <Input
              id="officer-name"
              placeholder={t("dashboardComponents.placeholders.fullName", "e.g., Amit Sharma")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="officer-email">{t("dashboardComponents.fields.emailAddress", "Email Address")} *</Label>
            <Input
              id="officer-email"
              type="email"
              placeholder={t("dashboardComponents.placeholders.email", "e.g., amit.sharma@gov.in")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t(
                "dashboardComponents.hints.credentialsSentToEmail",
                "Login credentials will be sent to this email"
              )}
            </p>
          </div>
          <div>
            <Label htmlFor="officer-phone">{t("dashboardComponents.fields.phoneNumber", "Phone Number")}</Label>
            <Input
              id="officer-phone"
              type="tel"
              placeholder={t("dashboardComponents.placeholders.phone", "e.g., +91 9876543210")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1"
            />
          </div>

          {departments.length > 0 && (
            <div>
              <Label>{t("dashboardComponents.fields.department", "Department")}</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t("dashboardComponents.addOfficerDialog.selectDepartment", "Select department")} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {areas.length > 0 && (
            <div>
              <Label>{t("dashboardComponents.fields.area", "Area")}</Label>
              <Select value={areaId} onValueChange={setAreaId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t("dashboardComponents.addOfficerDialog.selectArea", "Select area")} />
                </SelectTrigger>
                <SelectContent>
                  {areas.map(area => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={!name.trim() || !email.trim()}
          >
            {t(
              "dashboardComponents.addOfficerDialog.submit",
              "Add {{roleTitle}} & Send Credentials",
              { roleTitle }
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
