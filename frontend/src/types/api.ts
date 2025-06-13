// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  owner: string;
  owner_email: string;
  members: Array<{
    id: string;
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'viewer' | 'editor' | 'admin';
    invited_by_email: string;
    joined_at: string;
  }>;
  members_details?: Array<{
    id: string;
    email: string;
    name: string;
  }>;
  members_count: number;
  user_role?: 'owner' | 'admin' | 'editor' | 'viewer';
  background_color?: string;
  background_image?: string;
  is_private: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  is_public?: boolean;
}

// Task List types
export interface TaskList {
  id: string;
  name: string;
  project: string;
  project_name: string;
  position: number;
  is_archived: boolean;
  tasks_count: number;
  created_at: string;
  updated_at: string;
  tasks?: Task[];
}

export interface TaskListCreate {
  name: string;
  project: string;
  position?: number;
}

// Task types
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  task_list: string;
  task_list_name: string;
  project_name: string;
  position: number;
  priority: TaskPriority;
  label_color?: string;
  assignees: string[];
  assignees_count: number;
  assignees_details?: Array<{
    id: string;
    email: string;
    name: string;
  }>;
  creator: string;
  creator_email: string;
  due_date?: string;
  is_completed: boolean;
  is_archived: boolean;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  comments?: TaskComment[];
}

export interface TaskCreate {
  title: string;
  description?: string;
  task_list: string;
  position?: number;
  priority?: TaskPriority;
  label_color?: string;
  assignees?: string[];
  due_date?: string;
}

export interface TaskMove {
  target_list: string;
  new_position: number;
}

export interface TaskBulkUpdate {
  task_ids: string[];
  action: 'complete' | 'incomplete' | 'archive' | 'unarchive';
}

// Task Comment types
export interface TaskComment {
  id: string;
  task: string;
  author: string;
  author_email: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
}

export interface TaskCommentCreate {
  task: string;
  content: string;
}
