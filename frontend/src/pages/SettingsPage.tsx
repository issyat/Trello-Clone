import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Alert,
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Layout } from '../components';
import { useAuth } from '../contexts/AuthContext';

const profileValidationSchema = Yup.object({
  first_name: Yup.string().required('First name is required'),
  last_name: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
});

const passwordValidationSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your new password'),
});

interface ProfileFormValues {
  first_name: string;
  last_name: string;
  email: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [profileSuccess, setProfileSuccess] = React.useState('');
  const [profileError, setProfileError] = React.useState('');
  const [passwordSuccess, setPasswordSuccess] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');

  const handleProfileSubmit = async (values: ProfileFormValues) => {
    try {
      setProfileError('');
      setProfileSuccess('');

      // TODO: Implement profile update API call
      console.log('Update profile:', values);

      setProfileSuccess('Profile updated successfully!');
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    try {
      setPasswordError('');
      setPasswordSuccess('');

      // TODO: Implement password change API call
      console.log('Change password:', values);

      setPasswordSuccess('Password changed successfully!');
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || 'Failed to change password');
    }
  };

  if (!user) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Typography>Please log in to access settings.</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
          Account Settings
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Profile Settings */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    fontSize: '2rem',
                    mr: 3,
                    bgcolor: 'primary.main',
                  }}
                >
                  {user.first_name?.charAt(0) || user.username?.charAt(0) || ''}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {user.first_name} {user.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    @{user.username || ''}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Profile Information
              </Typography>

              {profileSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {profileSuccess}
                </Alert>
              )}

              {profileError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {profileError}
                </Alert>
              )}

              <Formik
                initialValues={{
                  first_name: user.first_name || '',
                  last_name: user.last_name || '',
                  email: user.email || '',
                }}
                validationSchema={profileValidationSchema}
                onSubmit={handleProfileSubmit}
              >
                {({ errors, touched, isSubmitting }) => (
                  <Form>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <Box>
                        <Field
                          as={TextField}
                          name="first_name"
                          label="First Name"
                          fullWidth
                          error={Boolean(touched.first_name && errors.first_name)}
                          helperText={touched.first_name && errors.first_name}
                          disabled={isSubmitting}
                        />
                      </Box>
                      <Box>
                        <Field
                          as={TextField}
                          name="last_name"
                          label="Last Name"
                          fullWidth
                          error={Boolean(touched.last_name && errors.last_name)}
                          helperText={touched.last_name && errors.last_name}
                          disabled={isSubmitting}
                        />
                      </Box>
                      <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2' } }}>
                        <Field
                          as={TextField}
                          name="email"
                          label="Email"
                          type="email"
                          fullWidth
                          error={Boolean(touched.email && errors.email)}
                          helperText={touched.email && errors.email}
                          disabled={isSubmitting}
                        />
                      </Box>
                      <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2' } }}>
                        <TextField
                          label="Username"
                          value={user.username || ''}
                          fullWidth
                          disabled
                          helperText="Username cannot be changed"
                        />
                      </Box>
                    </Box>

                    <Box sx={{ mt: 3 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Updating...' : 'Update Profile'}
                      </Button>
                    </Box>
                  </Form>
                )}
              </Formik>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Change Password
              </Typography>

              {passwordSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {passwordSuccess}
                </Alert>
              )}

              {passwordError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {passwordError}
                </Alert>
              )}

              <Formik
                initialValues={{
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                }}
                validationSchema={passwordValidationSchema}
                onSubmit={handlePasswordSubmit}
              >
                {({ errors, touched, isSubmitting, resetForm }) => (
                  <Form>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Field
                          as={TextField}
                          name="currentPassword"
                          label="Current Password"
                          type="password"
                          fullWidth
                          error={Boolean(touched.currentPassword && errors.currentPassword)}
                          helperText={touched.currentPassword && errors.currentPassword}
                          disabled={isSubmitting}
                        />
                      </Box>
                      <Box>
                        <Field
                          as={TextField}
                          name="newPassword"
                          label="New Password"
                          type="password"
                          fullWidth
                          error={Boolean(touched.newPassword && errors.newPassword)}
                          helperText={touched.newPassword && errors.newPassword}
                          disabled={isSubmitting}
                        />
                      </Box>
                      <Box>
                        <Field
                          as={TextField}
                          name="confirmPassword"
                          label="Confirm New Password"
                          type="password"
                          fullWidth
                          error={Boolean(touched.confirmPassword && errors.confirmPassword)}
                          helperText={touched.confirmPassword && errors.confirmPassword}
                          disabled={isSubmitting}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Changing...' : 'Change Password'}
                      </Button>
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={() => resetForm()}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Form>
                )}
              </Formik>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Layout>
  );
};

export default SettingsPage;
