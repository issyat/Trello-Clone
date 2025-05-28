import os
import uuid
import django
from django.contrib.auth import get_user_model

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trello_backend.settings')
django.setup()

User = get_user_model()


def test_user_creation():
    """Simple test to check if user creation works"""
    # Use a unique email to avoid conflicts
    unique_email = f'test_{uuid.uuid4().hex[:8]}@example.com'

    user = User.objects.create_user(
        email=unique_email,
        password='testpass123',
        first_name='Test',
        last_name='User'
    )

    assert user.email == unique_email
    assert user.first_name == 'Test'
    assert user.last_name == 'User'
    assert user.check_password('testpass123')
    print(f"✅ User creation test passed! Created user: {user.email}")

    # Clean up the test user
    user.delete()
    print("✅ Test user cleaned up!")


if __name__ == '__main__':
    test_user_creation()
