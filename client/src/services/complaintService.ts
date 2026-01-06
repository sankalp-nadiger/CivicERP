
export interface Complaint {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  category: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  description: string;
  priority: string;
  department: string;
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';
  images: File[];
  videos: File[];
  dateSubmitted: string;
  userId: string;
}

export const generateComplaintId = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `CMP-${timestamp.substr(-6)}-${random}`;
};

export const submitComplaint = async (complaintData: Omit<Complaint, 'id' | 'status' | 'dateSubmitted'>): Promise<Complaint> => {
  const complaint: Complaint = {
    ...complaintData,
    id: generateComplaintId(),
    status: 'Pending',
    dateSubmitted: new Date().toISOString().split('T')[0]
  };

  // Store in localStorage (in a real app, this would be sent to a server)
  const existingComplaints = JSON.parse(localStorage.getItem('complaints') || '[]');
  existingComplaints.push(complaint);
  localStorage.setItem('complaints', JSON.stringify(existingComplaints));

  // Store in user's complaint history
  const userComplaints = JSON.parse(localStorage.getItem(`user_complaints_${complaint.userId}`) || '[]');
  userComplaints.push({
    id: complaint.id,
    title: `${complaint.category} - ${complaint.location}`,
    status: complaint.status,
    date: complaint.dateSubmitted,
    description: complaint.description
  });
  localStorage.setItem(`user_complaints_${complaint.userId}`, JSON.stringify(userComplaints));

  return complaint;
};

export const getUserComplaints = (userId: string) => {
  return JSON.parse(localStorage.getItem(`user_complaints_${userId}`) || '[]');
};
