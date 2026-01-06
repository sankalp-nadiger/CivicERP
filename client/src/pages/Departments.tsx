
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";

const Departments = () => {
  const departments = [
    {
      name: "Municipal Corporation",
      email: "municipal@city.gov",
      phone: "1800-123-4567",
      address: "City Hall, Main Street",
      timings: "9:00 AM - 5:00 PM",
      status: "Active",
      description: "General municipal services and administration"
    },
    {
      name: "Water Supply Department",
      email: "water@city.gov",
      phone: "1916",
      address: "Water Board Office, Sector 12",
      timings: "24/7 Emergency",
      status: "Active",
      description: "Water supply, quality, and related issues"
    },
    {
      name: "Electricity Board",
      email: "electricity@city.gov",
      phone: "1912",
      address: "Power House, Industrial Area",
      timings: "8:00 AM - 8:00 PM",
      status: "Active",
      description: "Power supply, street lighting, and electrical issues"
    },
    {
      name: "Sanitation Department",
      email: "sanitation@city.gov",
      phone: "1800-567-8901",
      address: "Sanitation Office, Sector 8",
      timings: "6:00 AM - 6:00 PM",
      status: "Active",
      description: "Waste management, garbage collection, and cleanliness"
    },
    {
      name: "Roads & Drainage",
      email: "roads@city.gov",
      phone: "1800-234-5678",
      address: "PWD Office, Civil Lines",
      timings: "9:00 AM - 5:00 PM",
      status: "Active",
      description: "Road maintenance, construction, and drainage systems"
    },
    {
      name: "Health Department",
      email: "health@city.gov",
      phone: "108",
      address: "Health Center, Medical District",
      timings: "24/7",
      status: "Active",
      description: "Public health, sanitation, and medical emergencies"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Government Departments
            </h1>
            <p className="text-lg text-gray-600">
              Contact information for all municipal departments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                    <Badge variant={dept.status === 'Active' ? 'default' : 'secondary'}>
                      {dept.status}
                    </Badge>
                  </div>
                  <CardDescription>{dept.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{dept.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{dept.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-red-600" />
                      <span className="text-sm">{dept.address}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">{dept.timings}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button size="sm" className="flex-1">
                      Contact
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      File Complaint
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Departments;
