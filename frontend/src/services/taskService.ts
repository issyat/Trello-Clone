import { apiClient } from './apiClient';
import type {
  TaskList,
  Task,
  TaskCreate,
  TaskMove,
  TaskBulkUpdate,
  TaskComment,
  ApiResponse,
  TaskListCreate,
  TaskCommentCreate,
} from '../types';

export const taskService = {  // Task Lists
  async getTaskLists(projectId?: string): Promise<TaskList[]> {
    console.log('Getting task lists for project:', projectId);
    try {
      const params = projectId ? { project: projectId } : {};
      console.log('Using params:', params);
      const response = await apiClient.get<ApiResponse<TaskList>>('/api/tasks/task-lists/', {
        params,
      });
      console.log('Task lists response:', response);
      return response.results || [];
    } catch (error) {
      console.error('Error fetching task lists:', error);
      throw error;
    }
  },

  async getTaskList(id: string): Promise<TaskList> {
    return apiClient.get<TaskList>(`/api/tasks/task-lists/${id}/`);
  },

  async createTaskList(taskList: TaskListCreate): Promise<TaskList> {
    console.log('Creating task list with data:', taskList);
    try {
      const result = await apiClient.post<TaskList>('/api/tasks/task-lists/', taskList);
      console.log('Task list creation successful:', result);
      return result;
    } catch (error) {
      console.error('Task list creation failed:', error);
      throw error;
    }
  },

  async updateTaskList(id: string, taskList: Partial<TaskListCreate>): Promise<TaskList> {
    return apiClient.patch<TaskList>(`/api/tasks/task-lists/${id}/`, taskList);
  },

  async deleteTaskList(id: string): Promise<void> {
    return apiClient.delete(`/api/tasks/task-lists/${id}/`);
  },

  async reorderTaskList(id: string, newPosition: number): Promise<TaskList> {
    return apiClient.post<TaskList>(`/api/tasks/task-lists/${id}/reorder/`, {
      new_position: newPosition,
    });
  },

  async archiveTaskList(id: string): Promise<TaskList> {
    return apiClient.post<TaskList>(`/api/tasks/task-lists/${id}/archive/`);
  },

  // Tasks
  async getTasks(filters?: Record<string, any>): Promise<Task[]> {
    const response = await apiClient.get<ApiResponse<Task>>('/api/tasks/tasks/', {
      params: filters,
    });
    return response.results;
  },

  async getTask(id: string): Promise<Task> {
    return apiClient.get<Task>(`/api/tasks/tasks/${id}/`);
  },

  async createTask(task: TaskCreate): Promise<Task> {
    return apiClient.post<Task>('/api/tasks/tasks/', task);
  },

  async updateTask(id: string, task: Partial<TaskCreate>): Promise<Task> {
    return apiClient.patch<Task>(`/api/tasks/tasks/${id}/`, task);
  },

  async deleteTask(id: string): Promise<void> {
    return apiClient.delete(`/api/tasks/tasks/${id}/`);
  },

  async moveTask(id: string, moveData: TaskMove): Promise<Task> {
    return apiClient.post<Task>(`/api/tasks/tasks/${id}/move/`, moveData);
  },

  async toggleTaskComplete(id: string): Promise<Task> {
    return apiClient.post<Task>(`/api/tasks/tasks/${id}/toggle_complete/`);
  },

  async archiveTask(id: string): Promise<Task> {
    return apiClient.post<Task>(`/api/tasks/tasks/${id}/archive/`);
  },

  async bulkUpdateTasks(bulkUpdate: TaskBulkUpdate): Promise<{ message: string; updated_count: number }> {
    return apiClient.post('/api/tasks/tasks/bulk_update/', bulkUpdate);
  },

  // Task Comments
  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    const response = await apiClient.get<ApiResponse<TaskComment>>('/api/tasks/task-comments/', {
      params: { task: taskId },
    });
    return response.results;
  },

  async createTaskComment(comment: TaskCommentCreate): Promise<TaskComment> {
    return apiClient.post<TaskComment>('/api/tasks/task-comments/', comment);
  },

  async updateTaskComment(id: string, content: string): Promise<TaskComment> {
    return apiClient.patch<TaskComment>(`/api/tasks/task-comments/${id}/`, {
      content,
    });
  },

  async deleteTaskComment(id: string): Promise<void> {
    return apiClient.delete(`/api/tasks/task-comments/${id}/`);
  },
};
