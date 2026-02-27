
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

interface LocationInputProps {
  value: string;
  onChange: (location: string) => void;
  placeholder?: string;
}

const LocationInput: React.FC<LocationInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "e.g., Near Red Fort, Delhi or Sector 15, Noida" 
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="location" className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Location of the Issue
      </Label>
      <Input
        id="location"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
      />
      <p className="text-sm text-gray-600">
        Please enter the exact location where the problem is happening
      </p>
    </div>
  );
};

export default LocationInput;
