import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PersonAdd,
  Delete,
  Email,
  Close,
  AccountCircle,
} from '@mui/icons-material';
import { useAddMember, useRemoveMember, useProject } from '../hooks';

interface InviteMembersModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer', description: 'Can view and comment on cards' },
  { value: 'editor', label: 'Editor', description: 'Can create and edit cards' },
  { value: 'admin', label: 'Admin', description: 'Can manage project settings and members' },
];

const InviteMembersModal: React.FC<InviteMembersModalProps> = ({
  open,
  onClose,
  projectId,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor' | 'admin'>('editor');
  const [error, setError] = useState('');

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { mutate: addMember, isPending: isAdding } = useAddMember();
  const { mutate: removeMember, isPending: isRemoving } = useRemoveMember();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }    addMember(
      { projectId, email: email.trim(), role },
      {
        onSuccess: () => {
          setEmail('');
          setRole('editor');
          setError('');
        },
        onError: (error: any) => {
          const errorMessage = error.response?.data?.message || 
                             error.response?.data?.detail || 
                             error.response?.data?.email?.[0] ||
                             'Failed to add member';
          setError(errorMessage);
        },
      }
    );
  };

  const handleRemoveMember = (memberId: string, memberEmail: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberEmail} from this project?`)) {
      removeMember(
        { projectId, memberId },
        {
          onError: (error: any) => {
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.detail || 
                               'Failed to remove member';
            setError(errorMessage);
          },
        }
      );
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('editor');
    setError('');
    onClose();
  };
  const members = project?.members || [];
  const currentUserCanManage = project && (
    project.user_role === 'owner' || 
    project.user_role === 'admin'
  );

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 2,
          maxHeight: '80vh',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAdd color="primary" />
          <Typography variant="h6" component="span">
            Manage Project Members
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Add Member Form */}
        {currentUserCanManage && (
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Invite New Member
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter member's email"
                variant="outlined"
                size="small"
                sx={{ flex: 1, minWidth: 200 }}
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                disabled={isAdding}
              />

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={role}
                  label="Role"
                  onChange={(e) => setRole(e.target.value as 'viewer' | 'editor' | 'admin')}
                  disabled={isAdding}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                disabled={isAdding || !email.trim()}
                sx={{ minWidth: 100 }}
              >
                {isAdding ? <CircularProgress size={20} /> : 'Invite'}
              </Button>
            </Box>

            {/* Role descriptions */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Role Info:</strong> {ROLE_OPTIONS.find(r => r.value === role)?.description}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Current Members List */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Current Members ({members.length + 1})
          </Typography>

          {projectLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {/* Project Owner */}
              {project && (
                <ListItem sx={{ bgcolor: 'primary.light', borderRadius: 1, mb: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <AccountCircle />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {project.owner_email}
                        </Typography>
                        <Chip 
                          label="Owner" 
                          size="small" 
                          color="primary" 
                          variant="filled"
                        />
                      </Box>
                    }
                    secondary="Project creator and owner"
                  />
                </ListItem>
              )}              {/* Project Members */}
              {members.map((member) => (
                <ListItem key={member.id} sx={{ mb: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      {member.first_name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {member.first_name && member.last_name 
                            ? `${member.first_name} ${member.last_name}` 
                            : member.email
                          }
                        </Typography>
                        <Chip 
                          label={member.role.charAt(0).toUpperCase() + member.role.slice(1)} 
                          size="small" 
                          variant="outlined"
                          color={
                            member.role === 'admin' ? 'error' : 
                            member.role === 'editor' ? 'primary' : 'default'
                          }
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {member.email}
                        </Typography>
                        {member.invited_by_email && (
                          <Typography variant="caption" color="text.secondary">
                            Invited by {member.invited_by_email}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  
                  {currentUserCanManage && member.role !== 'admin' && (
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveMember(member.user_id, member.email)}
                        disabled={isRemoving}
                        sx={{ color: 'error.main' }}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}

              {members.length === 0 && !projectLoading && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No additional members yet. Invite someone to get started!
                  </Typography>
                </Box>
              )}
            </List>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleClose} 
          startIcon={<Close />}
          variant="outlined"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteMembersModal;
