import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  MoreVert,
  Schedule,
  Flag,
  Comment,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onClick: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onClick }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    onEdit(task);
    handleMenuClose();
  };
  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    onDelete(task.id);
    handleMenuClose();
  };

  const handleCardClick = () => {
    onClick(task);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };
  const getPriorityIcon = () => {
    return <Flag fontSize="small" />;
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        mb: 1,
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 2,
        },
        ...(isDragging && {
          boxShadow: 4,
        }),
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, flexGrow: 1, mr: 1 }}>
            {task.title}
          </Typography>
          <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{ p: 0.5 }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>

        {task.description && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {task.description.length > 100 
              ? `${task.description.substring(0, 100)}...` 
              : task.description
            }
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>          {task.priority && (
            <Chip
              icon={getPriorityIcon()}
              label={task.priority}
              size="small"
              color={getPriorityColor(task.priority) as any}
              variant="outlined"
            />
          )}
          
          {task.due_date && (
            <Chip
              icon={<Schedule />}
              label={formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
              size="small"
              color={new Date(task.due_date) < new Date() ? 'error' : 'default'}
              variant="outlined"
            />
          )}          {task.comments && task.comments.length > 0 && (
            <Chip
              icon={<Comment />}
              label={task.comments.length}
              size="small"
              variant="outlined"
            />
          )}
        </Box>        {task.assignees_details && task.assignees_details.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip title={task.assignees_details[0].name}>
              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                {task.assignees_details[0].name.charAt(0)}
              </Avatar>
            </Tooltip>
          </Box>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={handleEdit}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
