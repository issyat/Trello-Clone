import { apiClient } from './apiClient';
import type { Project, ProjectCreate, ApiResponse } from '../types';

export const projectService = {
  // Get all projects for the current user
  async getProjects(): Promise<Project[]> {
    const response = await apiClient.get<ApiResponse<Project>>('/api/projects/');
    return response.results;
  },

  // Get a specific project by ID
  async getProject(id: string): Promise<Project> {
    return apiClient.get<Project>(`/api/projects/${id}/`);
  },

  // Create a new project
  async createProject(project: ProjectCreate): Promise<Project> {
    return apiClient.post<Project>('/api/projects/', project);
  },

  // Update a project
  async updateProject(id: string, project: Partial<ProjectCreate>): Promise<Project> {
    return apiClient.patch<Project>(`/api/projects/${id}/`, project);
  },

  // Delete a project
  async deleteProject(id: string): Promise<void> {
    return apiClient.delete(`/api/projects/${id}/`);
  },
  // Add member to project
  async addMember(projectId: string, memberEmail: string, role: string = 'editor'): Promise<void> {
    return apiClient.post(`/api/projects/${projectId}/add_member/`, {
      email: memberEmail,
      role: role,
    });
  },
  // Remove member from project
  async removeMember(projectId: string, memberId: string): Promise<void> {
    return apiClient.delete(`/api/projects/${projectId}/members/${memberId}/`);
  },

  // Leave project (for non-owners)
  async leaveProject(projectId: string): Promise<void> {
    return apiClient.post(`/api/projects/${projectId}/leave/`);
  },
};
