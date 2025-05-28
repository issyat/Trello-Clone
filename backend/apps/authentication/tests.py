from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class UserModelTest(TestCase):
    """Test cases for the custom User model"""

    def setUp(self):
        self.user_data = {
            "email": "test@example.com",
            "password": "testpass123",
            "first_name": "Test",
            "last_name": "User",
        }

    def test_create_user(self):
        """Test creating a new user"""
        user = User.objects.create_user(**self.user_data)

        self.assertEqual(user.email, self.user_data["email"])
        self.assertEqual(user.first_name, self.user_data["first_name"])
        self.assertEqual(user.last_name, self.user_data["last_name"])
        self.assertTrue(user.check_password(self.user_data["password"]))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertIsNotNone(user.id)  # UUID should be generated

    def test_create_superuser(self):
        """Test creating a superuser"""
        admin_data = {"email": "admin@example.com", "password": "adminpass123"}
        user = User.objects.create_superuser(**admin_data)

        self.assertEqual(user.email, admin_data["email"])
        self.assertTrue(user.is_active)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_user_str_representation(self):
        """Test the string representation of user"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(str(user), self.user_data["email"])

    def test_email_normalization(self):
        """Test email normalization"""
        email = "TEST@EXAMPLE.COM"
        user = User.objects.create_user(email=email, password="testpass123")
        self.assertEqual(user.email, email.lower())

    def test_create_user_without_email_raises_error(self):
        """Test creating user without email raises ValueError"""
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password="testpass123")


class AuthenticationAPITest(APITestCase):
    """Test cases for authentication API endpoints"""

    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse("authentication:register")
        self.login_url = reverse("authentication:login")
        self.logout_url = reverse("authentication:logout")
        self.profile_url = reverse("authentication:profile")
        self.change_password_url = reverse("authentication:change-password")

        self.user_data = {
            "email": "test@example.com",
            "password": "testpass123",
            "password_confirm": "testpass123",
            "first_name": "Test",
            "last_name": "User",
        }

        self.existing_user = User.objects.create_user(
            email="existing@example.com",
            password="existingpass123",
            first_name="Existing",
            last_name="User",
        )

    def test_user_registration_success(self):
        """Test successful user registration"""
        response = self.client.post(self.register_url, self.user_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("message", response.data)
        self.assertIn("user", response.data)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])

        # Check user was created in database
        user = User.objects.get(email=self.user_data["email"])
        self.assertEqual(user.first_name, self.user_data["first_name"])
        self.assertEqual(user.last_name, self.user_data["last_name"])

    def test_user_registration_duplicate_email(self):
        """Test registration with duplicate email fails"""
        duplicate_data = self.user_data.copy()
        duplicate_data["email"] = self.existing_user.email

        response = self.client.post(self.register_url, duplicate_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_user_registration_password_mismatch(self):
        """Test registration with mismatched passwords fails"""
        invalid_data = self.user_data.copy()
        invalid_data["password_confirm"] = "differentpassword"

        response = self.client.post(self.register_url, invalid_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_registration_invalid_email(self):
        """Test registration with invalid email fails"""
        invalid_data = self.user_data.copy()
        invalid_data["email"] = "invalid-email"

        response = self.client.post(self.register_url, invalid_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_user_login_success(self):
        """Test successful user login"""
        login_data = {"email": self.existing_user.email, "password": "existingpass123"}

        response = self.client.post(self.login_url, login_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)
        self.assertIn("user", response.data)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])

        # Check user data in response
        self.assertEqual(response.data["user"]["email"], self.existing_user.email)

    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials fails"""
        invalid_data = {"email": self.existing_user.email, "password": "wrongpassword"}

        response = self.client.post(self.login_url, invalid_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login_nonexistent_user(self):
        """Test login with non-existent user fails"""
        invalid_data = {"email": "nonexistent@example.com", "password": "somepassword"}

        response = self.client.post(self.login_url, invalid_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_logout_success(self):
        """Test successful user logout"""
        refresh = RefreshToken.for_user(self.existing_user)
        self.client.force_authenticate(user=self.existing_user)

        logout_data = {"refresh_token": str(refresh)}
        response = self.client.post(self.logout_url, logout_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

    def test_user_logout_unauthenticated(self):
        """Test logout without authentication fails"""
        response = self.client.post(self.logout_url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_user_profile_success(self):
        """Test getting user profile when authenticated"""
        self.client.force_authenticate(user=self.existing_user)

        response = self.client.get(self.profile_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], self.existing_user.email)
        self.assertEqual(response.data["first_name"], self.existing_user.first_name)
        self.assertEqual(response.data["last_name"], self.existing_user.last_name)

    def test_get_user_profile_unauthenticated(self):
        """Test getting user profile without authentication fails"""
        response = self.client.get(self.profile_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_user_profile_success(self):
        """Test updating user profile when authenticated"""
        self.client.force_authenticate(user=self.existing_user)

        update_data = {
            "first_name": "Updated",
            "last_name": "Name",
            "bio": "Updated bio",
        }

        response = self.client.patch(self.profile_url, update_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], update_data["first_name"])
        self.assertEqual(response.data["last_name"], update_data["last_name"])
        self.assertEqual(response.data["bio"], update_data["bio"])

        # Verify changes in database
        self.existing_user.refresh_from_db()
        self.assertEqual(self.existing_user.first_name, update_data["first_name"])
        self.assertEqual(self.existing_user.last_name, update_data["last_name"])
        self.assertEqual(self.existing_user.bio, update_data["bio"])

    def test_change_password_success(self):
        """Test successful password change"""
        self.client.force_authenticate(user=self.existing_user)

        password_data = {
            "old_password": "existingpass123",
            "new_password": "newpassword123",
            "new_password_confirm": "newpassword123",
        }

        response = self.client.post(
            self.change_password_url, password_data, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

        # Verify password was changed
        self.existing_user.refresh_from_db()
        self.assertTrue(
            self.existing_user.check_password(password_data["new_password"])
        )

    def test_change_password_wrong_old_password(self):
        """Test password change with wrong old password fails"""
        self.client.force_authenticate(user=self.existing_user)

        password_data = {
            "old_password": "wrongpassword",
            "new_password": "newpassword123",
            "new_password_confirm": "newpassword123",
        }

        response = self.client.post(
            self.change_password_url, password_data, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_mismatch(self):
        """Test password change with mismatched new passwords fails"""
        self.client.force_authenticate(user=self.existing_user)

        password_data = {
            "old_password": "existingpass123",
            "new_password": "newpassword123",
            "new_password_confirm": "differentpassword",
        }

        response = self.client.post(
            self.change_password_url, password_data, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_unauthenticated(self):
        """Test password change without authentication fails"""
        password_data = {
            "old_password": "existingpass123",
            "new_password": "newpassword123",
            "new_password_confirm": "newpassword123",
        }

        response = self.client.post(
            self.change_password_url, password_data, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class JWTTokenTest(APITestCase):
    """Test cases for JWT token functionality"""

    def setUp(self):
        self.user = User.objects.create_user(
            email="jwt@example.com", password="jwtpass123"
        )
        self.client = APIClient()

    def test_jwt_token_generation(self):
        """Test JWT token generation for user"""
        refresh = RefreshToken.for_user(self.user)
        access_token = refresh.access_token

        self.assertIsNotNone(str(refresh))
        self.assertIsNotNone(str(access_token))

    def test_authenticated_request_with_jwt(self):
        """Test making authenticated request with JWT token"""
        refresh = RefreshToken.for_user(self.user)
        access_token = refresh.access_token

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        profile_url = reverse("authentication:profile")
        response = self.client.get(profile_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], self.user.email)
