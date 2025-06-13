import React from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Container,
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  first_name: Yup.string().required('First name is required'),
  last_name: Yup.string().required('Last name is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  password_confirm: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

interface RegisterFormValues {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string>('');
  const handleSubmit = async (values: RegisterFormValues) => {
    try {
      setError('');
      await register(values);
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 
        err.response?.data?.email?.[0] ||
        'Registration failed. Please try again.';
      setError(errorMessage);
    }
  };
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Container 
        maxWidth="sm" 
        sx={{ 
          width: '100%',
          maxWidth: { xs: '100%', sm: '600px' },
        }}
      >
        <Card 
          sx={{ 
            width: '100%',
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: '#0079bf',
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
                }}
              >
                TrelloClone
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  mt: 1,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                }}
              >
                Create your account
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}            <Formik
              initialValues={{
                email: '',
                first_name: '',
                last_name: '',
                password: '',
                password_confirm: '',
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Field
                      as={TextField}
                      name="first_name"
                      label="First Name"
                      fullWidth
                      margin="normal"
                      error={touched.first_name && errors.first_name}
                      helperText={touched.first_name && errors.first_name}
                      disabled={isSubmitting}
                    />
                    
                    <Field
                      as={TextField}
                      name="last_name"
                      label="Last Name"
                      fullWidth
                      margin="normal"
                      error={touched.last_name && errors.last_name}
                      helperText={touched.last_name && errors.last_name}
                      disabled={isSubmitting}
                    />
                  </Box>
                  
                  <Field
                    as={TextField}
                    name="email"
                    label="Email"
                    type="email"
                    fullWidth
                    margin="normal"
                    error={touched.email && errors.email}
                    helperText={touched.email && errors.email}
                    disabled={isSubmitting}
                  />
                  
                  <Field
                    as={TextField}
                    name="password"
                    label="Password"
                    type="password"
                    fullWidth
                    margin="normal"
                    error={touched.password && errors.password}
                    helperText={touched.password && errors.password}
                    disabled={isSubmitting}
                  />
                  
                  <Field
                    as={TextField}
                    name="password_confirm"
                    label="Confirm Password"
                    type="password"
                    fullWidth
                    margin="normal"
                    error={touched.password_confirm && errors.password_confirm}
                    helperText={touched.password_confirm && errors.password_confirm}
                    disabled={isSubmitting}
                  />                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ 
                      mt: 3, 
                      mb: 2, 
                      py: 1.5,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                  </Button>
                </Form>
              )}
            </Formik>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Already have an account?{' '}
                <Link component={RouterLink} to="/login" sx={{ fontWeight: 'bold' }}>
                  Sign in
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default RegisterPage;
