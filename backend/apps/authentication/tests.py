from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class AuthenticationTest(TestCase):
    """Simple authentication tests"""
    
    def test_create_user(self):
        """Test creating a user"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('testpass123'))
    
    def test_user_count(self):
        """Test user count"""
        self.assertEqual(User.objects.count(), 0)
        User.objects.create_user(
            email='count@example.com',
            password='pass123'
        )
        self.assertEqual(User.objects.count(), 1)