import uuid

from django.contrib.auth import get_user_model
from django.core.validators import MinLengthValidator
from django.db import models

User = get_user_model()


class Project(models.Model):
    """
    Project model representing a Trello-like board/workspace
    """

    BACKGROUND_COLORS = [
        ("#0079bf", "Blue"),
        ("#d29034", "Orange"),
        ("#519839", "Green"),
        ("#b04632", "Red"),
        ("#89609e", "Purple"),
        ("#cd5a91", "Pink"),
        ("#4bbf6b", "Light Green"),
        ("#00aecc", "Light Blue"),
        ("#838c91", "Gray"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(
        max_length=100,
        validators=[MinLengthValidator(1)],
        help_text="Project name (max 100 characters)",
    )
    description = models.TextField(
        blank=True,
        max_length=500,
        help_text="Optional project description (max 500 characters)",
    )
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="owned_projects",
        help_text="Project owner who created it",
    )
    members = models.ManyToManyField(
        User,
        through="ProjectMembership",
        through_fields=("project", "user"),
        related_name="projects",
        blank=True,
        help_text="Users who have access to this project",
    )
    background_color = models.CharField(
        max_length=7,
        choices=BACKGROUND_COLORS,
        default="#0079bf",
        help_text="Background color for the project",
    )
    background_image = models.URLField(
        blank=True, null=True, help_text="Optional background image URL"
    )
    is_private = models.BooleanField(
        default=True, help_text="Whether the project is private or public"
    )
    is_archived = models.BooleanField(
        default=False, help_text="Whether the project is archived"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-created_at"]
        verbose_name = "Project"
        verbose_name_plural = "Projects"
        indexes = [
            models.Index(fields=["owner"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["is_private"]),
            models.Index(fields=["is_archived"]),
        ]

    def __str__(self):
        return f"{self.name} (by {self.owner.email})"

    def get_members_count(self):
        """Get total number of members including owner"""
        return self.members.count() + 1  # +1 for owner

    def is_member(self, user):
        """Check if user is a member or owner of this project"""
        if user == self.owner:
            return True
        return self.members.filter(id=user.id).exists()

    def can_edit(self, user):
        """Check if user can edit this project"""
        return (
            user == self.owner
            or self.projectmembership_set.filter(
                user=user, role__in=[ProjectMembership.ADMIN, ProjectMembership.EDITOR]
            ).exists()
        )

    def can_view(self, user):
        """Check if user can view this project"""
        if not self.is_private:
            return True
        return self.is_member(user)


class ProjectMembership(models.Model):
    """
    Through model for Project-User relationship with roles
    """

    VIEWER = "viewer"
    EDITOR = "editor"
    ADMIN = "admin"

    ROLE_CHOICES = [
        (VIEWER, "Viewer"),
        (EDITOR, "Editor"),
        (ADMIN, "Admin"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, help_text="The project"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, help_text="The user")
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default=EDITOR,
        help_text="User's role in the project",
    )
    invited_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invited_memberships",
        help_text="User who invited this member",
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["project", "user"]
        ordering = ["-joined_at"]
        verbose_name = "Project Membership"
        verbose_name_plural = "Project Memberships"
        indexes = [
            models.Index(fields=["project", "user"]),
            models.Index(fields=["role"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.project.name} ({self.role})"
