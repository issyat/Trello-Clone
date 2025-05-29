import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class UserCreationTest(TestCase):
    """Simple test to check if user creation works"""

    def test_user_creation(self):
        """Test user creation functionality"""
        # Use a unique email to avoid conflicts
        unique_email = f'test_{uuid.uuid4().hex[:8]}@example.com'

        user = User.objects.create_user(
            email=unique_email,
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

        self.assertEqual(user.email, unique_email)
        self.assertEqual(user.first_name, 'Test')
        self.assertEqual(user.last_name, 'User')
        self.assertTrue(user.check_password('testpass123'))
        
        # Test that the user was saved to the database
        saved_user = User.objects.get(email=unique_email)
        self.assertEqual(saved_user.id, user.id)
