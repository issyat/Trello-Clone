export * from './auth';
export * from './api';

// Common UI types
export interface DialogState {
  open: boolean;
  data?: any;
}

export interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

// Drag and Drop types
export interface DragEndEvent {
  active: {
    id: string;
    data: {
      current: any;
    };
  };
  over: {
    id: string;
    data: {
      current: any;
    };
  } | null;
}

// Filter and Sort types
export interface ProjectFilters {
  search?: string;
  is_public?: boolean;
}

export interface TaskFilters {
  task_list?: string;
  priority?: string;
  is_completed?: boolean;
  is_archived?: boolean;
  assignees?: string;
  creator?: string;
  search?: string;
}

// Form validation types
export interface FormErrors {
  [key: string]: string | string[];
}
