from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Project

User = get_user_model()


class ProjectTest(TestCase):
    """Simple project tests"""
    
    def test_create_project(self):
        """Test creating a project"""
        user = User.objects.create_user(
            email='owner@example.com',
            password='testpass123'
        )
        project = Project.objects.create(
            name='Test Project',
            description='A test project',
            owner=user
        )
        self.assertEqual(project.name, 'Test Project')
        self.assertEqual(project.owner, user)
    
    def test_project_count(self):
        """Test project count"""
        user = User.objects.create_user(
            email='owner2@example.com',
            password='testpass123'
        )
        self.assertEqual(Project.objects.count(), 0)
        Project.objects.create(
            name='Count Project',
            description='Test',
            owner=user
        )
        self.assertEqual(Project.objects.count(), 1)