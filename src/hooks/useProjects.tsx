
import { useState, useEffect } from 'react';
import { Project } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

type ConnectionStatus = 'checking' | 'connected' | 'error';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchTimedOut, setFetchTimedOut] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const { user } = useAuth();

  useEffect(() => {
    console.log('useProjects hook initializing, user status:', user ? 'logged in' : 'not logged in');
    
    const checkConnection = async () => {
      await checkSupabaseConnection();
      
      if (connectionStatus === 'connected' || connectionStatus === 'checking') {
        fetchProjects();
      }
    };
    
    // Set a timeout to show "no projects" message if fetch takes too long
    const timeoutId = setTimeout(() => {
      if (loading && projects.length === 0) {
        console.log('Fetch timed out after 5 seconds');
        setFetchTimedOut(true);
        setLoading(false);
      }
    }, 5000);
    
    checkConnection();
    
    return () => clearTimeout(timeoutId);
  }, [user]);

  const checkSupabaseConnection = async () => {
    console.log('Testing Supabase connection...');
    setConnectionStatus('checking');
    
    try {
      // Simple query to check connection
      const { data, error } = await supabase
        .from('projects')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('Connection test failed:', error);
        setConnectionStatus('error');
        setFetchError(`Connection error: ${error.message}`);
        toast.error(`Database connection error: ${error.message}`);
        return false;
      } else {
        console.log('Connection test successful');
        setConnectionStatus('connected');
        return true;
      }
    } catch (error: any) {
      console.error('Unexpected error in connection test:', error);
      setConnectionStatus('error');
      setFetchError(`Unexpected error: ${error.message}`);
      toast.error(`Connection error: ${error.message}`);
      return false;
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setFetchTimedOut(false);
      setFetchError(null);
      console.log('Fetching projects...');
      
      // Directly query the projects table
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      console.log('Projects fetched successfully:', data);
      
      if (data && data.length > 0) {
        // Transform the data to match our Project type
        const transformedProjects: Project[] = data.map(project => ({
          id: project.id,
          name: project.name,
          client: project.client,
          developer: project.developer,
          manager: project.manager || null,
          startDate: new Date(project.start_date),
          endDate: new Date(project.end_date),
          status: project.status,
          description: project.description,
          tasks: [],
          completedStages: project.completed_stages || [],
          user_id: project.user_id
        }));

        console.log('Setting projects state with', transformedProjects.length, 'projects');
        setProjects(transformedProjects);
      } else {
        console.log('No projects found');
        setProjects([]);
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      setFetchError(`Error: ${error.message}`);
      toast.error(`Error fetching projects: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addProject = async (newProject: Project) => {
    try {
      if (!user) {
        toast.error('You must be logged in to create a project');
        return;
      }

      console.log("Submitting project to database:", newProject);
      console.log("User ID being used:", user.id);

      // Transform Project to database format
      const projectData = {
        name: newProject.name,
        client: newProject.client,
        developer: newProject.developer,
        manager: newProject.manager || null,
        description: newProject.description || `Project for ${newProject.client}`,
        start_date: newProject.startDate.toISOString(),
        end_date: newProject.endDate.toISOString(),
        status: newProject.status,
        user_id: user.id,
        completed_stages: []
      };
      
      console.log("Data being sent to Supabase:", projectData);
      
      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select();
      
      if (error) {
        console.error("Database insertion error:", error);
        toast.error(`Error creating project: ${error.message}`);
        throw error;
      }
      
      console.log("Project created successfully - result:", data);
      toast.success('Project created successfully');
      
      // Refresh projects from database
      await fetchProjects();
    } catch (error: any) {
      toast.error(`Error creating project: ${error.message}`);
      console.error('Error creating project:', error);
    }
  };

  return {
    projects,
    loading,
    fetchTimedOut,
    fetchError,
    connectionStatus,
    addProject,
    refreshProjects: fetchProjects,
    checkConnection: checkSupabaseConnection
  };
};
