import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Project, ProjectMembership

User = get_user_model()


class ProjectModelTest(TestCase):
    """Test cases for Project model"""
    
    def setUp(self):
        self.user1 = User.objects.create_user(
            email='owner@example.com',
            username='owner',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            email='member@example.com',
            username='member',
            password='testpass123'
        )
        self.user3 = User.objects.create_user(
            email='viewer@example.com',
            username='viewer',
            password='testpass123'
        )
        
        self.project = Project.objects.create(
            name='Test Project',
            description='Test Description',
            owner=self.user1,
            background_color='#0079bf',
            is_private=True
        )
    
    def test_project_creation(self):
        """Test project creation with valid data"""
        self.assertEqual(self.project.name, 'Test Project')
        self.assertEqual(self.project.owner, self.user1)
        self.assertTrue(self.project.is_private)
        self.assertFalse(self.project.is_archived)
        self.assertIsInstance(self.project.id, uuid.UUID)
    
    def test_project_str_method(self):
        """Test project string representation"""
        expected = f"Test Project (by {self.user1.email})"
        self.assertEqual(str(self.project), expected)
    
    def test_get_members_count(self):
        """Test members count calculation"""
        # Initially just owner
        self.assertEqual(self.project.get_members_count(), 1)
        
        # Add a member
        ProjectMembership.objects.create(
            project=self.project,
            user=self.user2,
            role=ProjectMembership.EDITOR,
            invited_by=self.user1
        )
        self.assertEqual(self.project.get_members_count(), 2)
    
    def test_is_member_method(self):
        """Test is_member method"""
        # Owner is always a member
        self.assertTrue(self.project.is_member(self.user1))
        
        # Non-member user
        self.assertFalse(self.project.is_member(self.user2))
        
        # Add user2 as member
        ProjectMembership.objects.create(
            project=self.project,
            user=self.user2,
            role=ProjectMembership.EDITOR,
            invited_by=self.user1
        )
        self.assertTrue(self.project.is_member(self.user2))
    
    def test_can_edit_method(self):
        """Test can_edit permission method"""
        # Owner can always edit
        self.assertTrue(self.project.can_edit(self.user1))
        
        # Non-member cannot edit
        self.assertFalse(self.project.can_edit(self.user2))
        
        # Editor can edit
        ProjectMembership.objects.create(
            project=self.project,
            user=self.user2,
            role=ProjectMembership.EDITOR,
            invited_by=self.user1
        )
        self.assertTrue(self.project.can_edit(self.user2))
        
        # Admin can edit
        ProjectMembership.objects.create(
            project=self.project,
            user=self.user3,
            role=ProjectMembership.ADMIN,
            invited_by=self.user1
        )
        self.assertTrue(self.project.can_edit(self.user3))
        
        # Change user2 to viewer - cannot edit
        membership = ProjectMembership.objects.get(project=self.project, user=self.user2)
        membership.role = ProjectMembership.VIEWER
        membership.save()
        self.assertFalse(self.project.can_edit(self.user2))
    
    def test_can_view_method(self):
        """Test can_view permission method"""
        # Owner can always view
        self.assertTrue(self.project.can_view(self.user1))
        
        # Private project - non-member cannot view
        self.assertFalse(self.project.can_view(self.user2))
        
        # Add user2 as member - can view
        ProjectMembership.objects.create(
            project=self.project,
            user=self.user2,
            role=ProjectMembership.VIEWER,
            invited_by=self.user1
        )
        self.assertTrue(self.project.can_view(self.user2))
        
        # Public project - anyone can view
        self.project.is_private = False
        self.project.save()
        self.assertTrue(self.project.can_view(self.user3))


class ProjectMembershipModelTest(TestCase):
    """Test cases for ProjectMembership model"""
    
    def setUp(self):
        self.owner = User.objects.create_user(
            email='owner@example.com',
            username='owner',
            password='testpass123'
        )
        self.member = User.objects.create_user(
            email='member@example.com',
            username='member',
            password='testpass123'
        )
        
        self.project = Project.objects.create(
            name='Test Project',
            owner=self.owner
        )
    
    def test_membership_creation(self):
        """Test membership creation"""
        membership = ProjectMembership.objects.create(
            project=self.project,
            user=self.member,
            role=ProjectMembership.EDITOR,
            invited_by=self.owner
        )
        
        self.assertEqual(membership.project, self.project)
        self.assertEqual(membership.user, self.member)
        self.assertEqual(membership.role, ProjectMembership.EDITOR)
        self.assertEqual(membership.invited_by, self.owner)
        self.assertIsInstance(membership.id, uuid.UUID)
    
    def test_membership_str_method(self):
        """Test membership string representation"""
        membership = ProjectMembership.objects.create(
            project=self.project,
            user=self.member,
            role=ProjectMembership.ADMIN,
            invited_by=self.owner
        )
        
        expected = f"{self.member.email} - {self.project.name} (admin)"
        self.assertEqual(str(membership), expected)
    
    def test_unique_together_constraint(self):
        """Test that user can only have one membership per project"""
        ProjectMembership.objects.create(
            project=self.project,
            user=self.member,
            role=ProjectMembership.EDITOR,
            invited_by=self.owner
        )
        
        # Trying to create another membership should raise an error
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            ProjectMembership.objects.create(
                project=self.project,
                user=self.member,
                role=ProjectMembership.ADMIN,
                invited_by=self.owner
            )


class ProjectAPITest(APITestCase):
    """Test cases for Project API endpoints"""
    
    def setUp(self):
        self.user1 = User.objects.create_user(
            email='user1@example.com',
            username='user1',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            email='user2@example.com',
            username='user2',
            password='testpass123'
        )
        
        # Get JWT tokens
        self.token1 = str(RefreshToken.for_user(self.user1).access_token)
        self.token2 = str(RefreshToken.for_user(self.user2).access_token)
        
        # Create test project
        self.project = Project.objects.create(
            name='Test Project',
            description='Test Description',
            owner=self.user1,
            is_private=True
        )
        
        self.client = APIClient()
    
    def test_create_project_authenticated(self):
        """Test creating project with authenticated user"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        
        data = {
            'name': 'New Project',
            'description': 'New Description',
            'background_color': '#d29034',
            'is_private': False
        }
        
        response = self.client.post('/api/projects/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Project')
        self.assertEqual(response.data['owner_email'], self.user1.email)
    
    def test_create_project_unauthenticated(self):
        """Test creating project without authentication"""
        data = {
            'name': 'New Project',
            'description': 'New Description'
        }
        
        response = self.client.post('/api/projects/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_projects(self):
        """Test listing projects for authenticated user"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Test Project')
    
    def test_get_project_detail_owner(self):
        """Test getting project details as owner"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        
        response = self.client.get(f'/api/projects/{self.project.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Project')
        self.assertEqual(response.data['user_role'], 'owner')
    
    def test_get_project_detail_unauthorized(self):
        """Test getting project details without permission"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        
        response = self.client.get(f'/api/projects/{self.project.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_project_owner(self):
        """Test updating project as owner"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        
        data = {
            'name': 'Updated Project Name',
            'description': 'Updated Description'
        }
        
        response = self.client.patch(f'/api/projects/{self.project.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Project Name')
    
    def test_update_project_unauthorized(self):
        """Test updating project without permission"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        
        data = {'name': 'Hacked Name'}
        
        response = self.client.patch(f'/api/projects/{self.project.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_delete_project_owner(self):
        """Test deleting project as owner"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        
        response = self.client.delete(f'/api/projects/{self.project.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Project.objects.filter(id=self.project.id).exists())
    
    def test_delete_project_unauthorized(self):
        """Test deleting project without permission"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        
        response = self.client.delete(f'/api/projects/{self.project.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_my_projects_endpoint(self):
        """Test my_projects endpoint"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        
        # Create another project for user2
        Project.objects.create(
            name='User2 Project',
            owner=self.user2
        )
        
        response = self.client.get('/api/projects/my_projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Test Project')
    
    def test_shared_with_me_endpoint(self):
        """Test shared_with_me endpoint"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        
        # Add user2 as member to user1's project
        ProjectMembership.objects.create(
            project=self.project,
            user=self.user2,
            role=ProjectMembership.EDITOR,
            invited_by=self.user1
        )
        
        response = self.client.get('/api/projects/shared_with_me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Test Project')


class ProjectMembershipAPITest(APITestCase):
    """Test cases for Project Membership API endpoints"""
    
    def setUp(self):
        self.owner = User.objects.create_user(
            email='owner@example.com',
            username='owner',
            password='testpass123'
        )
        self.member = User.objects.create_user(
            email='member@example.com',
            username='member',
            password='testpass123'
        )
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='admin',
            password='testpass123'
        )
        
        self.owner_token = str(RefreshToken.for_user(self.owner).access_token)
        self.member_token = str(RefreshToken.for_user(self.member).access_token)
        self.admin_token = str(RefreshToken.for_user(self.admin).access_token)
        
        self.project = Project.objects.create(
            name='Test Project',
            owner=self.owner
        )
        
        self.client = APIClient()
    
    def test_add_member_as_owner(self):
        """Test adding member as project owner"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.owner_token}')
        
        data = {
            'email': 'member@example.com',
            'role': 'editor'
        }
        
        response = self.client.post(f'/api/projects/{self.project.id}/add_member/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], 'member@example.com')
        self.assertEqual(response.data['role'], 'editor')
    
    def test_add_member_nonexistent_user(self):
        """Test adding nonexistent user as member"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.owner_token}')
        
        data = {
            'email': 'nonexistent@example.com',
            'role': 'editor'
        }
        
        response = self.client.post(f'/api/projects/{self.project.id}/add_member/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_add_member_already_member(self):
        """Test adding user who is already a member"""
        # First add the member
        ProjectMembership.objects.create(
            project=self.project,
            user=self.member,
            role=ProjectMembership.EDITOR,
            invited_by=self.owner
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.owner_token}')
        
        data = {
            'email': 'member@example.com',
            'role': 'admin'
        }
        
        response = self.client.post(f'/api/projects/{self.project.id}/add_member/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_remove_member_as_owner(self):
        """Test removing member as project owner"""
        # Add member first
        membership = ProjectMembership.objects.create(
            project=self.project,
            user=self.member,
            role=ProjectMembership.EDITOR,
            invited_by=self.owner
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.owner_token}')
        
        response = self.client.delete(f'/api/projects/{self.project.id}/members/{self.member.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ProjectMembership.objects.filter(id=membership.id).exists())
    
    def test_update_member_role_as_owner(self):
        """Test updating member role as project owner"""
        membership = ProjectMembership.objects.create(
            project=self.project,
            user=self.member,
            role=ProjectMembership.EDITOR,
            invited_by=self.owner
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.owner_token}')
        
        data = {'role': 'admin'}
        
        response = self.client.patch(f'/api/projects/{self.project.id}/members/{self.member.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'admin')
        
        membership.refresh_from_db()
        self.assertEqual(membership.role, 'admin')
    
    def test_get_project_members(self):
        """Test getting all project members"""
        # Add some members
        ProjectMembership.objects.create(
            project=self.project,
            user=self.member,
            role=ProjectMembership.EDITOR,
            invited_by=self.owner
        )
        ProjectMembership.objects.create(
            project=self.project,
            user=self.admin,
            role=ProjectMembership.ADMIN,
            invited_by=self.owner
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.owner_token}')
        
        response = self.client.get(f'/api/projects/{self.project.id}/members/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_member_management_unauthorized(self):
        """Test member management without proper permissions"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.member_token}')
        
        data = {
            'email': 'admin@example.com',
            'role': 'editor'
        }
        
        # Member cannot add other members
        response = self.client.post(f'/api/projects/{self.project.id}/add_member/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
