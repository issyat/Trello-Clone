import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Chip,
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
  Folder,
  Person,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components';
import { useProjects, useCreateProject } from '../hooks';
import type { Project } from '../types';
import { formatDistanceToNow } from 'date-fns';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState('');
  const [newProjectDescription, setNewProjectDescription] = React.useState('');
  
  const { mutate: createProject, isPending: isCreating } = useCreateProject();

  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };
  
  const handleCreateProject = () => {
    setCreateModalOpen(true);
  };
  
  const handleCreateProjectSubmit = () => {
    if (!newProjectName.trim()) return;
    
    createProject(
      {
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined
      },
      {
        onSuccess: () => {
          setCreateModalOpen(false);
          setNewProjectName('');
          setNewProjectDescription('');
        }
      }
    );
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, project: Project) => {
    event.stopPropagation();
    setSelectedProject(project);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleEditProject = () => {
    if (selectedProject) {
      // Navigate to edit project or open modal
      console.log('Edit project:', selectedProject.id);
    }
    handleMenuClose();
  };

  const handleDeleteProject = () => {
    if (selectedProject) {
      // Handle project deletion
      console.log('Delete project:', selectedProject.id);
    }
    handleMenuClose();
  };
  return (
    <Layout onCreateProject={handleCreateProject}>
      <Box sx={{ 
        p: { xs: 2, sm: 3 }, 
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: { xs: 2, sm: 3 },
          gap: { xs: 2, sm: 0 },
        }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold',
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
            }}
          >
            Your Projects
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateProject}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              fontSize: { xs: '0.875rem', sm: '1rem' },
            }}
          >
            Create Project
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Typography>Loading projects...</Typography>
          </Box>
        ) : projects?.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Folder sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No projects yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first project to start organizing your tasks
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateProject}
            >
              Create Your First Project
            </Button>          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: { xs: 2, sm: 3 },
              width: '100%',
            }}
          >
            {projects?.map((project) => (
              <Box key={project.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => handleProjectClick(project.id)}
                    sx={{ flexGrow: 1 }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                          {project.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, project)}
                          sx={{ p: 0.5 }}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Box>

                      {project.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2, minHeight: 40 }}
                        >
                          {project.description.length > 100
                            ? `${project.description.substring(0, 100)}...`
                            : project.description
                          }
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip
                          icon={<Person />}
                          label={`${project.members_details?.length || 0} members`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      {project.members_details && project.members_details.length > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
                            {project.members_details.map((member) => (
                              <Avatar key={member.id}>
                                {member.name.charAt(0)}
                              </Avatar>
                            ))}
                          </AvatarGroup>
                          
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </CardActionArea>                </Card>
              </Box>
            ))}
          </Box>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEditProject}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit Project
          </MenuItem>
          <MenuItem onClick={handleDeleteProject} sx={{ color: 'error.main' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete Project
          </MenuItem>
        </Menu>

        <Dialog
          open={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Project</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Project Name"
              type="text"
              fullWidth
              variant="outlined"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
            <TextField
              margin="dense"
              label="Description"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={4}
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateModalOpen(false)} color="primary">
              Cancel
            </Button>
            <Button
              onClick={handleCreateProjectSubmit}
              color="primary"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default DashboardPage;
