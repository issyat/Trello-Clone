import os
import django
from django.test import TestCase
from django.contrib.auth import get_user_model

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trello_backend.settings')
django.setup()

User = get_user_model()

def test_user_creation():
    """Simple test to check if user creation works"""
    user = User.objects.create_user(
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )
    
    assert user.email == 'test@example.com'
    assert user.first_name == 'Test'
    assert user.last_name == 'User'
    assert user.check_password('testpass123')
    print("✅ User creation test passed!")

if __name__ == '__main__':
    test_user_creation()
