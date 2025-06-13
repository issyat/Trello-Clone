import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services';
import type { TaskListCreate, TaskCreate, TaskMove, TaskBulkUpdate } from '../types';
import { toast } from 'react-toastify';

// Query keys
export const taskKeys = {
  lists: (projectId?: string) => ['task-lists', projectId] as const,
  listDetail: (id: string) => ['task-lists', id] as const,
  tasks: (filters?: Record<string, any>) => ['tasks', filters] as const,
  taskDetail: (id: string) => ['tasks', id] as const,
  comments: (taskId: string) => ['task-comments', taskId] as const,
};

// Task Lists Hooks
export const useTaskLists = (projectId?: string) => {
  return useQuery({
    queryKey: taskKeys.lists(projectId),
    queryFn: () => taskService.getTaskLists(projectId),
  });
};

export const useTaskList = (id: string) => {
  return useQuery({
    queryKey: taskKeys.listDetail(id),
    queryFn: () => taskService.getTaskList(id),
    enabled: !!id,
  });
};

export const useCreateTaskList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskListCreate) => taskService.createTaskList(data),
    onSuccess: (newTaskList) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(newTaskList.project) });
      toast.success(`List "${newTaskList.name}" created successfully!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create task list');
    },
  });
};

export const useUpdateTaskList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskListCreate> }) =>
      taskService.updateTaskList(id, data),
    onSuccess: (updatedList) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(updatedList.project) });
      queryClient.invalidateQueries({ queryKey: taskKeys.listDetail(updatedList.id) });
      toast.success('List updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update task list');
    },
  });
};

export const useDeleteTaskList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskService.deleteTaskList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-lists'] });
      toast.success('List deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete task list');
    },
  });
};

export const useReorderTaskList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newPosition }: { id: string; newPosition: number }) =>
      taskService.reorderTaskList(id, newPosition),
    onSuccess: (updatedList) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(updatedList.project) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reorder task list');
    },
  });
};

// Tasks Hooks
export const useTasks = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: taskKeys.tasks(filters),
    queryFn: () => taskService.getTasks(filters),
  });
};

export const useTask = (id: string) => {
  return useQuery({
    queryKey: taskKeys.taskDetail(id),
    queryFn: () => taskService.getTask(id),
    enabled: !!id,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskCreate) => taskService.createTask(data),
    onSuccess: (newTask) => {
      // Invalidate all queries related to task lists and tasks
      queryClient.invalidateQueries({ queryKey: ['task-lists'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // For optimistic updates, we could also try to update the cache directly
      // but invalidation is safer and ensures data consistency
      
      toast.success(`Task "${newTask.title}" created successfully!`);
    },
    onError: (error: any) => {
      console.error('Task creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create task');
    },
  });
};

export const useUpdateTask = (projectId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskCreate> }) =>
      taskService.updateTask(id, data),
    onSuccess: (updatedTask) => {
      // Invalidate specific queries for better performance
      queryClient.invalidateQueries({ queryKey: taskKeys.taskDetail(updatedTask.id) });
      
      // If we have a projectId, invalidate that project's task lists specifically
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: taskKeys.lists(projectId) });
      } else {
        // Fallback to invalidating all task lists and tasks
        queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      }
      
      // Also invalidate general tasks queries
      queryClient.invalidateQueries({ queryKey: taskKeys.tasks() });
      
      toast.success('Task updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update task');
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success('Task deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    },
  });
};

export const useMoveTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, moveData }: { id: string; moveData: TaskMove }) =>
      taskService.moveTask(id, moveData),
    onSuccess: (updatedTask) => {
      // Invalidate all task-related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['task-lists'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // Also invalidate specific task detail if available
      if (updatedTask?.id) {
        queryClient.invalidateQueries({ queryKey: taskKeys.taskDetail(updatedTask.id) });
      }
      
      toast.success('Task moved successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to move task');
    },
  });
};

export const useToggleTaskComplete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskService.toggleTaskComplete(id),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: taskKeys.taskDetail(updatedTask.id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success(
        updatedTask.is_completed ? 'Task marked as complete!' : 'Task marked as incomplete!'
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to toggle task completion');
    },
  });
};

export const useBulkUpdateTasks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskBulkUpdate) => taskService.bulkUpdateTasks(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success(result.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to bulk update tasks');
    },
  });
};
