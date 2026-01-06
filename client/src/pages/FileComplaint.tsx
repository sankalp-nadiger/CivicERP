
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import LocationInput from "@/components/LocationInput";
import FileUpload from "@/components/FileUpload";
import { submitComplaint } from "@/services/complaintService";
import { Image, Video } from "lucide-react";

const FileComplaint = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    category: '',
    location: '',
    description: '',
    priority: 'Medium',
    email: user?.email || '',
    phone: user?.phone || '',
    department: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLocationChange = (location: string) => {
    setFormData({ ...formData, location });
  };

  const handleCategoryChange = (category: string) => {
    setFormData({ ...formData, category });
    
    // Auto-select department based on category
    const departmentMap: { [key: string]: string } = {
      'road-issues': 'municipal',
      'water-supply': 'water',
      'street-lighting': 'electricity',
      'garbage-collection': 'sanitation',
      'drainage': 'municipal'
    };
    const dept = departmentMap[category] || 'municipal';
    setFormData(prev => ({ ...prev, department: dept }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit complaint clicked, form data:', formData);
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to file a complaint",
        variant: "destructive"
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Category Required",
        description: "Please select what type of problem you want to report",
        variant: "destructive"
      });
      return;
    }

    if (!formData.location.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter the location of the problem",
        variant: "destructive"
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe the problem you're reporting",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Default coordinates for Delhi area
      const coordinates = { lat: 28.6139, lng: 77.2090 };
      
      const complaint = await submitComplaint({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        category: formData.category,
        location: formData.location,
        coordinates: coordinates,
        description: formData.description,
        priority: formData.priority,
        department: formData.department,
        images,
        videos,
        userId: user.id
      });

      console.log('Complaint submitted successfully:', complaint);

      toast({
        title: "Complaint Submitted Successfully! ✅",
        description: `Your complaint ID is: ${complaint.id}. We'll update you on the progress.`,
      });

      // Reset form completely
      setFormData({
        fullName: user?.name || '',
        category: '',
        location: '',
        description: '',
        priority: 'Medium',
        email: user?.email || '',
        phone: user?.phone || '',
        department: '',
      });
      setImages([]);
      setVideos([]);

      // Navigate to profile after successful submission
      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your complaint. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">File a Complaint</CardTitle>
              <CardDescription>
                Help improve your community by reporting problems like broken roads, water issues, or poor street lighting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Your Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+91 XXXXX XXXXX"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">What's the Problem?</Label>
                  <Select value={formData.category} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the type of issue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="road-issues">🛣️ Broken/Damaged Roads</SelectItem>
                      <SelectItem value="water-supply">💧 Water Supply Problems</SelectItem>
                      <SelectItem value="street-lighting">💡 Street Light Issues</SelectItem>
                      <SelectItem value="garbage-collection">🗑️ Garbage Collection</SelectItem>
                      <SelectItem value="drainage">🌊 Drainage/Sewage Problems</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <LocationInput 
                  value={formData.location}
                  onChange={handleLocationChange}
                />

                <div>
                  <Label htmlFor="description">Describe the Problem</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Please describe the issue in detail. For example: 'Large pothole causing traffic problems' or 'Street light has been broken for 3 days'"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="priority">How Urgent is This?</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">🟢 Low - Can wait a few weeks</SelectItem>
                      <SelectItem value="Medium">🟡 Medium - Should be fixed soon</SelectItem>
                      <SelectItem value="High">🔴 High - Urgent/Safety issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUpload
                    onFilesChange={setImages}
                    acceptedTypes="image/*"
                    maxFiles={3}
                    label="Add Photos (Optional)"
                    icon={<Image className="h-8 w-8 text-blue-500" />}
                  />
                  <FileUpload
                    onFilesChange={setVideos}
                    acceptedTypes="video/*"
                    maxFiles={1}
                    label="Add Video (Optional)"
                    icon={<Video className="h-8 w-8 text-green-500" />}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => navigate('/')}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !formData.category || !formData.location.trim() || !formData.description.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? 'Submitting Complaint...' : 'Submit Complaint'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FileComplaint;
