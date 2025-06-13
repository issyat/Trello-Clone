import React from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  MoreVert,
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { TaskList as TaskListType, Task } from '../types';
import TaskCard from './TaskCard';

interface TaskListProps {
  taskList: TaskListType;
  tasks: Task[];
  onEditList: (taskList: TaskListType, newName: string) => void;
  onDeleteList: (listId: string) => void;
  onAddTask: (listId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onTaskClick: (task: Task) => void;
  onEditTask: (task: Task) => void;
  isDraggingOver?: boolean;
  isDraggingTask?: boolean;
  activeTaskId?: string | null;
}

const TaskListComponent: React.FC<TaskListProps> = ({
  taskList,
  tasks,
  onEditList,
  onDeleteList,
  onAddTask,
  onDeleteTask,
  onTaskClick,
  onEditTask,
  isDraggingOver = false,
  isDraggingTask = false,
}) => {const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editName, setEditName] = React.useState(taskList.name);
  const { setNodeRef, isOver } = useDroppable({
    id: taskList.id,
    data: {
      type: 'taskList',
      taskList,
      accepts: ['task'],
    },
  });

  // Sort tasks by position and memoize the sorted array
  const sortedTasks = React.useMemo(() => 
    [...tasks].sort((a, b) => a.position - b.position)
  , [tasks]);

  // Create a stable list of task IDs for the sortable context
  const taskIds = React.useMemo(() => 
    sortedTasks.map(task => task.id)
  , [sortedTasks]);
  
  // Determine if the list should show a drop indicator
  const showDropIndicator = isDraggingTask && (isOver || isDraggingOver);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleEditList = React.useCallback(() => {
    console.log('Edit list clicked, opening modal');
    setIsEditModalOpen(true);
    setEditName(taskList.name);
    handleMenuClose();
  }, [taskList.name]);

  const handleSaveEdit = React.useCallback(() => {
    console.log('Saving edit with name:', editName);
    if (editName.trim() && editName.trim() !== taskList.name) {
      onEditList(taskList, editName.trim());
    }
    setIsEditModalOpen(false);
  }, [editName, taskList, onEditList]);
  const handleCancelEdit = React.useCallback(() => {
    console.log('Cancelling edit');
    setEditName(taskList.name);
    setIsEditModalOpen(false);
  }, [taskList.name]);// Update editName when taskList.name changes, but only if modal is not open
  React.useEffect(() => {
    if (!isEditModalOpen) {
      setEditName(taskList.name);
    }
  }, [taskList.name, isEditModalOpen]);

  // Debug logging for modal state
  React.useEffect(() => {
    console.log('TaskList modal state changed to:', isEditModalOpen, 'for list:', taskList.name);
  }, [isEditModalOpen, taskList.name]);
  const handleDeleteList = () => {
    onDeleteList(taskList.id);
    handleMenuClose();
  };

  const handleAddTask = () => {
    onAddTask(taskList.id);
  };  return (
    <Paper
      sx={{
        width: { xs: 250, sm: 300 },
        maxHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f4f5f7',
        mx: { xs: 0.5, sm: 1 },
        flexShrink: 0,
        transition: 'box-shadow 0.3s ease, transform 0.2s ease, background-color 0.3s ease',
        position: 'relative',
        ...(showDropIndicator && {
          boxShadow: '0 0 0 2px #2196f3, 0 4px 12px rgba(33, 150, 243, 0.2)',
          transform: 'translateY(-2px)',
          backgroundColor: 'rgba(33, 150, 243, 0.03)',
        }),
        ...(isDraggingOver && {
          boxShadow: '0 0 0 1px #2196f3, 0 2px 8px rgba(33, 150, 243, 0.3)',
        }),
      }}
    >{/* Header */}
      <Box
        sx={{
          p: { xs: 1, sm: 1.5 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}      >        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 600, 
            flexGrow: 1,
            fontSize: { xs: '0.875rem', sm: '1rem' },
            wordBreak: 'break-word',
            pr: 1,
          }}
        >
          {taskList.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              mr: 1,
              fontSize: { xs: '0.625rem', sm: '0.75rem' },
            }}
          >
            {tasks.length}
          </Typography>
          <IconButton 
            size="small" 
            onClick={handleMenuClick}
            sx={{ 
              width: { xs: 24, sm: 32 },
              height: { xs: 24, sm: 32 },
            }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
      </Box>      {/* Tasks */}
      <Box
        ref={setNodeRef}
        sx={{
          p: 1,
          flexGrow: 1,
          overflowY: 'auto',
          minHeight: 100,
          position: 'relative',
          ...(showDropIndicator && {
            backgroundColor: 'rgba(33, 150, 243, 0.04)',
          }),
          ...(tasks.length === 0 && {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }),
        }}
      >
        <SortableContext 
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <Box 
              sx={{
                height: '80%',
                width: '90%',
                border: '2px dashed',
                borderColor: isDraggingTask ? '#2196f3' : 'divider',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: isDraggingTask ? 'rgba(33, 150, 243, 0.08)' : 'rgba(0, 0, 0, 0.02)',
                transition: 'all 0.3s ease',
                opacity: isDraggingTask ? 0.9 : 0.5,
                transform: isDraggingTask ? 'scale(1.02)' : 'scale(1)',
                padding: 2,
              }}
            >
              {isDraggingTask ? (
                <Typography color="primary" variant="body2" align="center" sx={{ fontWeight: 500 }}>
                  Drop task here
                </Typography>
              ) : (
                <Typography color="textSecondary" variant="body2" align="center">
                  No tasks yet
                </Typography>
              )}
            </Box>
          ) : (
            sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onClick={onTaskClick}
              />
            ))
          )}
        </SortableContext>
      </Box>      {/* Add Task Button */}
      <Box sx={{ p: { xs: 0.5, sm: 1 } }}>
        <Button
          fullWidth
          variant="text"
          startIcon={<Add />}
          onClick={handleAddTask}
          sx={{
            justifyContent: 'flex-start',
            color: 'text.secondary',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            py: { xs: 1, sm: 1.5 },
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.04)',
            },
          }}
        >
          Add a task
        </Button>
      </Box>      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditList}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit List
        </MenuItem>
        <MenuItem onClick={handleDeleteList} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete List
        </MenuItem>
      </Menu>

      {/* Edit List Modal */}
      <Dialog 
        open={isEditModalOpen} 
        onClose={handleCancelEdit}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit List Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="List Name"
            type="text"
            fullWidth
            variant="outlined"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveEdit();
              } else if (e.key === 'Escape') {
                handleCancelEdit();
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>Cancel</Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained"
            disabled={!editName.trim() || editName.trim() === taskList.name}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TaskListComponent;
