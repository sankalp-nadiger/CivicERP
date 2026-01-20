import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export const useDepartmentManagement = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendInvitation = useCallback(async (email: string, departmentId: string) => {
    setIsLoading(true);
    try {
      // Simulate API call to send invitation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Invitation sent to ${email}`);
      return { success: true, email };
    } catch (error) {
      toast.error('Failed to send invitation');
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDepartment = useCallback(async (
    name: string,
    head: string,
    email: string
  ) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Department created successfully');
      return { success: true, id: Date.now().toString() };
    } catch (error) {
      toast.error('Failed to create department');
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { sendInvitation, createDepartment, isLoading };
};
