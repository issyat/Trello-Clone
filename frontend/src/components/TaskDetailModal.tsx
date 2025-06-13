import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import {
  Close,
  Schedule,
  Flag,
  Edit,
  Save,
  Cancel,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { Task, TaskPriority } from '../types';
import { useUpdateTask } from '../hooks';

interface TaskDetailModalProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  open,
  task,
  onClose,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    due_date: null as Date | null,
  });

  const { mutate: updateTask, isPending } = useUpdateTask();

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        due_date: task.due_date ? new Date(task.due_date) : null,
      });
    }
  }, [task]);

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        due_date: task.due_date ? new Date(task.due_date) : null,
      });
    }
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!task) return;

    const updateData = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      due_date: formData.due_date ? formData.due_date.toISOString() : undefined,
    };

    updateTask(
      { id: task.id, data: updateData },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleInputChange = (field: string) => (event: any) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value;
    setFormData({
      ...formData,
      due_date: dateValue ? new Date(dateValue) : null,
    });
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };
  if (!task) return null;

  return (
    <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '500px' }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="div">
              Task Details
            </Typography>
            <Box>
              {!isEditing ? (
                <IconButton onClick={handleEdit} sx={{ mr: 1 }}>
                  <Edit />
                </IconButton>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    onClick={handleSave} 
                    color="primary"
                    disabled={isPending}
                  >
                    <Save />
                  </IconButton>
                  <IconButton onClick={handleCancel}>
                    <Cancel />
                  </IconButton>
                </Box>
              )}
              <IconButton onClick={handleClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {/* Task Title */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Title
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                value={formData.title}
                onChange={handleInputChange('title')}
                variant="outlined"
                size="small"
              />
            ) : (
              <Typography variant="h6">{task.title}</Typography>
            )}
          </Box>

          {/* Task Description */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Description
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange('description')}
                variant="outlined"
                placeholder="Add a description..."
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                {task.description || 'No description provided'}
              </Typography>
            )}
          </Box>

          {/* Task Properties */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Properties
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              {/* Priority */}
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Priority
                </Typography>
                {isEditing ? (
                  <FormControl size="small" fullWidth>
                    <Select
                      value={formData.priority}
                      onChange={handleInputChange('priority')}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <Chip
                    icon={<Flag fontSize="small" />}
                    label={task.priority}
                    size="small"
                    color={getPriorityColor(task.priority) as any}
                    variant="outlined"
                  />
                )}
              </Box>

              {/* Due Date */}
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Due Date
                </Typography>                {isEditing ? (
                  <TextField
                    type="datetime-local"
                    value={formData.due_date ? formData.due_date.toISOString().slice(0, 16) : ''}
                    onChange={handleDateChange}
                    size="small"
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                ) : task.due_date ? (
                  <Chip
                    icon={<Schedule fontSize="small" />}
                    label={format(new Date(task.due_date), 'MMM dd, yyyy HH:mm')}
                    size="small"
                    color={task.is_overdue ? 'error' : 'default'}
                    variant="outlined"
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No due date
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Assignees */}
            {task.assignees_details && task.assignees_details.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Assigned to
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {task.assignees_details.map((assignee) => (
                    <Box key={assignee.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                        {assignee.name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{assignee.name}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Status */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Status
              </Typography>
              <Chip
                label={task.is_completed ? 'Completed' : 'In Progress'}
                size="small"
                color={task.is_completed ? 'success' : 'primary'}
                variant="outlined"
              />
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Task Meta Information */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Information
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Created by
                </Typography>
                <Typography variant="body2">{task.creator_email}</Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  List
                </Typography>
                <Typography variant="body2">{task.task_list_name}</Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2">
                  {format(new Date(task.created_at), 'MMM dd, yyyy HH:mm')}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Updated
                </Typography>
                <Typography variant="body2">
                  {format(new Date(task.updated_at), 'MMM dd, yyyy HH:mm')}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Show overdue warning */}          {task.is_overdue && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This task is overdue!
            </Alert>
          )}
        </DialogContent>
      </Dialog>
  );
};

export default TaskDetailModal;
