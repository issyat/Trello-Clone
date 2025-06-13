import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Breadcrumbs,
  Link,
  Avatar,
  AvatarGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Add,
  MoreVert,
  ArrowBack,
  Settings,
  PersonAdd,
  Edit,
} from '@mui/icons-material';
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Layout, TaskList, TaskDetailModal, InviteMembersModal, TaskCard } from '../components';
import { useProjects, useTaskLists, useCreateTaskList, useUpdateTaskList, useDeleteTaskList, useCreateTask, useMoveTask, useDeleteTask, useUpdateProject } from '../hooks';
import type { Task, TaskList as TaskListType } from '../types/api';

const ProjectBoardPage: React.FC = () => {
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const projectId = projectIdParam || '';
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { data: projects } = useProjects();  // Improved query with better error typing
  const { 
    data: taskLists, 
    isLoading: tasksLoading, 
    error 
  } = useTaskLists(projectId);
  
  // Convert error to string for display
  const tasksError = error ? String(error) : null;
  
  // Debug logging
  console.log('Project ID:', projectId);
  console.log('Task lists data:', taskLists);
  console.log('Task loading error:', tasksError);

  console.log('Task lists:', taskLists);
  console.log('Tasks loading:', tasksLoading);
  console.log('Tasks error:', tasksError);
  
  const project = projects?.find((p) => p.id === projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };  const [isAddListModalOpen, setAddListModalOpen] = React.useState(false);
  const [newListName, setNewListName] = React.useState('');
  const { mutate: createTaskList, isPending: isCreatingList } = useCreateTaskList();

  // Task creation state
  const [isAddTaskModalOpen, setAddTaskModalOpen] = React.useState(false);
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [newTaskDescription, setNewTaskDescription] = React.useState('');  const [selectedTaskListId, setSelectedTaskListId] = React.useState<string>('');  const { mutate: createTask, isPending: isCreatingTask } = useCreateTask();
  const { mutate: moveTask } = useMoveTask();
  const { mutate: deleteTask } = useDeleteTask();
  const { mutate: updateTaskList } = useUpdateTaskList();
  const { mutate: deleteTaskList } = useDeleteTaskList();  // Task detail modal state
  const [isTaskDetailModalOpen, setTaskDetailModalOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  // Invite members modal state
  const [isInviteMembersModalOpen, setInviteMembersModalOpen] = React.useState(false);
  // Drag and drop state for visual feedback
  const [draggedTask, setDraggedTask] = React.useState<Task | null>(null);

  const handleAddList = () => {
    setAddListModalOpen(true);
  };
    const handleAddListSubmit = () => {
    if (!newListName.trim() || !projectId) return;
    
    // Calculate the next position based on existing lists
    const nextPosition = taskLists && Array.isArray(taskLists) ? taskLists.length : 0;
    
    console.log('Creating task list with position:', nextPosition, 'for project:', projectId);
    
    createTaskList(
      {
        name: newListName.trim(),
        project: projectId,
        position: nextPosition,
      },
      {
        onSuccess: () => {
          setAddListModalOpen(false);
          setNewListName('');
        },
        onError: (error) => {
          console.error('Task list creation error details:', error);
        }
      }
    );
  };
  // Edit Project state
  const [isEditProjectModalOpen, setEditProjectModalOpen] = React.useState(false);
  const [editProjectName, setEditProjectName] = React.useState('');
  const [editProjectDescription, setEditProjectDescription] = React.useState('');
  const { mutate: updateProject, isPending: isUpdatingProject } = useUpdateProject();
  
  const handleEditProject = () => {
    if (project) {
      setEditProjectName(project.name);
      setEditProjectDescription(project.description || '');
      setEditProjectModalOpen(true);
    }
    handleMenuClose();
  };
  
  const handleEditProjectSubmit = () => {
    if (!editProjectName.trim() || !projectId) return;
    
    updateProject(
      {
        id: projectId,
        data: {
          name: editProjectName.trim(),
          description: editProjectDescription.trim() || undefined
        }
      },
      {
        onSuccess: () => {
          setEditProjectModalOpen(false);
        },
        onError: (error) => {
          console.error('Project update error:', error);
        }
      }
    );
  };

  const handleProjectSettings = () => {
    console.log('Project settings');
    handleMenuClose();
  };
  const handleInviteMembers = () => {
    setInviteMembersModalOpen(true);
    handleMenuClose();
  };
  const handleEditList = (taskList: TaskListType, newName: string) => {
    if (newName.trim() && newName !== taskList.name) {
      updateTaskList(
        { 
          id: taskList.id, 
          data: { name: newName.trim() } 
        },
        {
          onSuccess: () => {
            console.log('Task list updated successfully');
          },
          onError: (error) => {
            console.error('Failed to update task list:', error);
          }
        }
      );
    }
  };

  const handleDeleteList = (listId: string | number) => {
    if (window.confirm('Are you sure you want to delete this list? All tasks in this list will also be deleted.')) {
      deleteTaskList(String(listId), {
        onSuccess: () => {
          console.log('Task list deleted successfully');
        },
        onError: (error) => {
          console.error('Failed to delete task list:', error);
        }
      });
    }
  };
  const handleAddTask = (listId: string | number) => {
    console.log('Add task to list:', listId);
    setSelectedTaskListId(String(listId));
    setAddTaskModalOpen(true);
  };

  const handleAddTaskSubmit = () => {
    if (!newTaskTitle.trim() || !selectedTaskListId) return;
    
    createTask(
      {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        task_list: selectedTaskListId,
        priority: 'medium',
      },
      {
        onSuccess: () => {
          setAddTaskModalOpen(false);
          setNewTaskTitle('');
          setNewTaskDescription('');
          setSelectedTaskListId('');
        }
      }
    );
  };  const handleDeleteTask = (taskId: string | number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(String(taskId), {
        onSuccess: () => {
          console.log('Task deleted successfully');
        },
        onError: (error) => {
          console.error('Failed to delete task:', error);
        }
      });
    }
  };  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailModalOpen(true);
  };

  const handleCloseTaskDetailModal = () => {
    setTaskDetailModalOpen(false);
    setSelectedTask(null);
  };  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string;
    console.log('Drag start:', activeId);
    
    // Find the dragged task and store it for visual feedback
    if (taskLists) {
      for (const taskList of taskLists) {
        const task = taskList.tasks?.find(t => t.id === activeId);
        if (task) {
          setDraggedTask(task);
          break;
        }
      }
    }
  };  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTask(null);
    
    if (!over || !taskLists) return;
    
    const activeId = String(active.id);
    const overId = String(over.id);
    
    if (activeId === overId) return;

    let activeTask: Task | null = null;
    let sourceListId: string | null = null;

    // Find the active task and its list
    for (const list of taskLists) {
      const task = list.tasks?.find(t => t.id === activeId);
      if (task) {
        activeTask = task;
        sourceListId = list.id;
        break;
      }
    }

    if (!activeTask || !sourceListId) return;

    // Case 1: Dropping on a task
    let targetListId: string | null = null;
    let targetTask: Task | null = null;

    for (const list of taskLists) {
      const task = list.tasks?.find(t => t.id === overId);
      if (task) {
        targetListId = list.id;
        targetTask = task;
        break;
      }
    }

    if (targetTask && targetListId) {
      // Same list reordering
      if (targetListId === sourceListId) {
        console.log('Same list reorder:', {
          taskId: activeTask.id,
          targetList: targetListId,
          newPosition: targetTask.position
        });
        
        moveTask({
          id: activeTask.id,
          moveData: {
            target_list: targetListId,
            new_position: targetTask.position
          }
        });
      } else {
        // Moving to different list
        moveTask({
          id: activeTask.id,
          moveData: {
            target_list: targetListId,
            new_position: targetTask.position
          }
        });
      }
    } else {
      // Case 2: Dropping on a list
      const targetList = taskLists.find(list => list.id === overId);
      if (!targetList) return;

      const newPosition = targetList.tasks?.length || 0;
      moveTask({
        id: activeTask.id,
        moveData: {
          target_list: targetList.id,
          new_position: newPosition
        }
      });
    }
  };
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    console.log('Drag over:', { active: active.id, over: over.id });
    
    // Add visual feedback for drop targets
    // This is where we would implement logic to highlight drop zones
    // or adjust task positions during dragging
    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId !== overId) {
      // We could enhance this to show preview of where task will be inserted
      // or highlight the target list by manipulating state
    }
  };
  // Enhanced error handling
  if (tasksLoading) {
    return (
      <Layout>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">Loading project data...</Typography>
        </Box>
      </Layout>
    );
  }
  if (tasksError) {
    return (
      <Layout>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error">Error loading task data</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {tasksError}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')}
            sx={{ mt: 2 }}
          >
            Go Back to Dashboard
          </Button>
        </Box>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">Project not found</Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')}
            sx={{ mt: 2 }}
          >
            Go Back to Dashboard
          </Button>
        </Box>
      </Layout>
    );
  }
  return (
    <Layout>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        width: '100%',
        overflowX: 'hidden',
      }}>
        {/* Header */}
        <Box sx={{ 
          p: { xs: 2, sm: 3 }, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          width: '100%',
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2,
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            gap: { xs: 1, sm: 0 },
          }}>
            <IconButton 
              onClick={() => navigate('/dashboard')} 
              sx={{ 
                mr: 1,
                minWidth: 'auto',
              }}
            >
              <ArrowBack />
            </IconButton>
            <Breadcrumbs sx={{ flexGrow: 1, minWidth: 0 }}>
              <Link component={RouterLink} to="/dashboard" color="inherit">
                Projects
              </Link>
              <Typography 
                color="text.primary" 
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {project.name}
              </Typography>
            </Breadcrumbs>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 2, sm: 0 },
          }}>
            <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <Typography 
                variant="h5" 
                component="h1" 
                sx={{ 
                  fontWeight: 'bold', 
                  mb: 1,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  wordBreak: 'break-word',
                }}
              >
                {project.name}
              </Typography>              {project.description && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    wordBreak: 'break-word',
                    maxWidth: { xs: '100%', sm: '400px' },
                  }}
                >
                  {project.description}
                </Typography>
              )}
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'space-between', sm: 'flex-end' },
              flexWrap: 'wrap',
            }}>
              {project.members_details && project.members_details.length > 0 && (
                <AvatarGroup max={5} sx={{ flexShrink: 0 }}>
                  {project.members_details.map((member) => (
                    <Avatar 
                      key={member.id} 
                      sx={{ 
                        width: { xs: 28, sm: 32 }, 
                        height: { xs: 28, sm: 32 },
                        fontSize: { xs: '0.75rem', sm: '1rem' },
                      }}
                    >
                      {member.name?.charAt(0) || 'U'}
                    </Avatar>
                  ))}
                </AvatarGroup>
              )}

              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAddList}
              >
                Add List
              </Button>

              <IconButton onClick={handleMenuClick}>
                <MoreVert />
              </IconButton>
            </Box>
          </Box>
        </Box>        {/* Board */}
        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: { xs: 1, sm: 2 },
          width: '100%',
          minHeight: 0,
        }}>
          {tasksLoading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              minHeight: '200px',
            }}>
              <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Loading task lists...
              </Typography>
            </Box>
          ) : tasksError ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              minHeight: '200px',
              p: 2,
            }}>
              <Typography 
                color="error" 
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  textAlign: 'center',
                  wordBreak: 'break-word',
                }}
              >
                Error loading tasks: {tasksError}
              </Typography>
            </Box>
          ) : !taskLists || taskLists.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: 'calc(100vh - 200px)',
              textAlign: 'center',
              p: { xs: 2, sm: 3 },
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2,
                  fontSize: { xs: '1.125rem', sm: '1.25rem' },
                }}
              >
                This project doesn't have any lists yet
              </Typography>
              <Typography 
                color="text.secondary" 
                sx={{ 
                  mb: 3,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  maxWidth: '400px',
                }}
              >
                Create your first list to start organizing tasks
              </Typography>              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddList}
                size="large"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  px: { xs: 2, sm: 3 },
                }}
              >
                Create Your First List
              </Button>
            </Box>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              autoScroll={{
                threshold: {
                  x: 0,
                  y: 0.2
                },
                acceleration: 20
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 1, sm: 2 }, 
                minHeight: '100%',
                overflowX: 'auto',
                pb: 2,
                width: '100%',
              }}>
                {(Array.isArray(taskLists) ? taskLists : []).map((taskList) => {
                  // Sort tasks by position
                  const sortedTasks = [...(taskList.tasks || [])].sort((a, b) => a.position - b.position);
                  
                  return (
                    <Box key={taskList.id}>
                      <SortableContext
                        items={sortedTasks}
                        strategy={verticalListSortingStrategy}
                      >
                        <TaskList
                          taskList={taskList}
                          tasks={sortedTasks}
                          onEditList={handleEditList}
                          onDeleteList={handleDeleteList}
                          onAddTask={handleAddTask}
                          onDeleteTask={handleDeleteTask}
                          onTaskClick={handleTaskClick}
                          onEditTask={handleEditTask}
                          isDraggingTask={Boolean(draggedTask)}
                        />
                      </SortableContext>
                    </Box>
                  );
                })}

                {/* Add List Button */}
                <Box sx={{ 
                  minWidth: { xs: 250, sm: 300 }, 
                  mx: 1,
                  flexShrink: 0,
                }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddList}
                    sx={{
                      height: { xs: 50, sm: 60 },
                      borderStyle: 'dashed',
                      color: 'text.secondary',
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      borderColor: 'text.secondary',
                      '&:hover': {
                        borderStyle: 'solid',
                        backgroundColor: 'rgba(0,0,0,0.04)',
                      },
                    }}
                  >
                    Add Another List
                  </Button>
                </Box>              </Box>
                {/* Drag Overlay for visual feedback */}
              <DragOverlay dropAnimation={{
                duration: 200,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
              }}>
                {draggedTask ? (
                  <Box sx={{ 
                    transform: 'rotate(3deg)', 
                    boxShadow: '0 5px 15px rgba(0,0,0,0.25)',
                    width: { xs: 250, sm: 300 }, 
                    opacity: 0.9,
                  }}>                    <TaskCard
                      task={draggedTask}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onClick={() => {}}
                    />
                  </Box>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </Box>{/* Project Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEditProject}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit Project
          </MenuItem>
          <MenuItem onClick={handleInviteMembers}>
            <PersonAdd fontSize="small" sx={{ mr: 1 }} />
            Invite Members
          </MenuItem>
          <MenuItem onClick={handleProjectSettings}>
            <Settings fontSize="small" sx={{ mr: 1 }} />
            Project Settings
          </MenuItem>
        </Menu>

        {/* Add List Dialog */}
        <Dialog
          open={isAddListModalOpen}
          onClose={() => setAddListModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New List</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="List Name"
              type="text"
              fullWidth
              variant="outlined"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Enter list name..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddListModalOpen(false)} color="primary">
              Cancel
            </Button>
            <Button
              onClick={handleAddListSubmit}
              color="primary"
              disabled={isCreatingList || !newListName.trim()}
            >
              {isCreatingList ? 'Creating...' : 'Create List'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Task Dialog */}
        <Dialog
          open={isAddTaskModalOpen}
          onClose={() => setAddTaskModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Task</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Task Title"
              type="text"
              fullWidth
              variant="outlined"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Enter task title..."
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Description (Optional)"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Enter task description..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddTaskModalOpen(false)} color="primary">
              Cancel
            </Button>
            <Button
              onClick={handleAddTaskSubmit}
              color="primary"
              disabled={isCreatingTask || !newTaskTitle.trim()}
            >
              {isCreatingTask ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogActions>        </Dialog>        {/* Task Detail Modal */}        <TaskDetailModal
          open={isTaskDetailModalOpen}
          task={selectedTask}
          onClose={handleCloseTaskDetailModal}
        />        {/* Invite Members Modal */}
        <InviteMembersModal
          open={isInviteMembersModalOpen}
          onClose={() => setInviteMembersModalOpen(false)}
          projectId={projectId}
        />

        {/* Edit Project Modal */}
        <Dialog
          open={isEditProjectModalOpen}
          onClose={() => setEditProjectModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Project</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Project Name"
              type="text"
              fullWidth
              variant="outlined"
              value={editProjectName}
              onChange={(e) => setEditProjectName(e.target.value)}
              placeholder="Enter project name..."
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Description (Optional)"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={editProjectDescription}
              onChange={(e) => setEditProjectDescription(e.target.value)}
              placeholder="Enter project description..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditProjectModalOpen(false)} color="primary">
              Cancel
            </Button>
            <Button
              onClick={handleEditProjectSubmit}
              color="primary"
              disabled={isUpdatingProject || !editProjectName.trim()}
            >
              {isUpdatingProject ? 'Updating...' : 'Update Project'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default ProjectBoardPage;
