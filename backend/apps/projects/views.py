from django.contrib.auth import get_user_model
from django.db.models import Q

from rest_framework import exceptions, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Project, ProjectMembership
from .serializers import (
    AddMemberSerializer,
    ProjectCreateSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
    ProjectMemberSerializer,
    ProjectUpdateSerializer,
    UpdateMemberRoleSerializer,
)

User = get_user_model()


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing projects with full CRUD operations and member management
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == "list":
            return ProjectListSerializer
        elif self.action == "create":
            return ProjectCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return ProjectUpdateSerializer
        elif self.action == "add_member":
            return AddMemberSerializer
        elif self.action == "update_member_role":
            return UpdateMemberRoleSerializer
        return ProjectDetailSerializer

    def get_queryset(self):
        """Return projects that the user can view"""
        user = self.request.user
        return Project.objects.filter(
            Q(owner=user) | Q(projectmembership__user=user)
        ).distinct()

    def permission_denied(self, request, message=None, code=None):
        """Override to ensure 403 Forbidden is returned instead of 404 Not Found"""
        raise exceptions.PermissionDenied(detail=message)

    def perform_create(self, serializer):
        """Set the owner to current user when creating a project"""
        serializer.save(owner=self.request.user)

    def get_object(self):
        """Get project and check permissions"""
        obj = super().get_object()

        # Check if user can view this project
        if not obj.can_view(self.request.user):
            self.permission_denied(
                self.request,
                message="You don't have permission to access this project.",
            )

        return obj

    def update(self, request, *args, **kwargs):
        """Update project with permission check"""
        project = self.get_object()

        # Only owner and editors can update project
        if not project.can_edit(request.user):
            return Response(
                {"detail": "You don't have permission to edit this project."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Delete project - only owner can delete"""
        project = self.get_object()

        if project.owner != request.user:
            return Response(
                {"detail": "Only project owner can delete the project."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=["get"])
    def my_projects(self, request):
        """Get projects owned by the current user"""
        projects = Project.objects.filter(owner=request.user).select_related("owner")
        serializer = ProjectListSerializer(
            projects, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def shared_with_me(self, request):
        """Get projects where user is a member (not owner)"""
        projects = (
            Project.objects.filter(members=request.user)
            .exclude(owner=request.user)
            .select_related("owner")
        )
        serializer = ProjectListSerializer(
            projects, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_member(self, request, pk=None):
        """Add a member to the project"""
        project = self.get_object()

        # Only owner and admins can add members
        if not (
            project.owner == request.user
            or project.projectmembership_set.filter(
                user=request.user, role=ProjectMembership.ADMIN
            ).exists()
        ):
            return Response(
                {"detail": "You don't have permission to add members."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AddMemberSerializer(
            data=request.data, context={"request": request, "project": project}
        )

        if serializer.is_valid():
            email = serializer.validated_data["email"]
            role = serializer.validated_data["role"]

            user = User.objects.get(email=email)
            membership = ProjectMembership.objects.create(
                project=project, user=user, role=role, invited_by=request.user
            )

            member_serializer = ProjectMemberSerializer(membership)
            return Response(member_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["delete"], url_path="members/(?P<user_id>[^/.]+)")
    def remove_member(self, request, pk=None, user_id=None):
        """Remove a member from the project"""
        project = self.get_object()

        # Only owner and admins can remove members
        if not (
            project.owner == request.user
            or project.projectmembership_set.filter(
                user=request.user, role=ProjectMembership.ADMIN
            ).exists()
        ):
            return Response(
                {"detail": "You don't have permission to remove members."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            user_to_remove = User.objects.get(id=user_id)
            membership = ProjectMembership.objects.get(
                project=project, user=user_to_remove
            )
            membership.delete()

            return Response(
                {"detail": "Member removed successfully."},
                status=status.HTTP_204_NO_CONTENT,
            )
        except (User.DoesNotExist, ProjectMembership.DoesNotExist):
            return Response(
                {"detail": "Member not found."}, status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=["patch"], url_path="members/(?P<user_id>[^/.]+)/role")
    def update_member_role(self, request, pk=None, user_id=None):
        """Update a member's role in the project (owner/admin only)"""
        project = self.get_object()
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        membership = project.projectmembership_set.filter(user=target_user).first()
        if not membership:
            return Response({"detail": "Membership not found."}, status=404)

        serializer = UpdateMemberRoleSerializer(
            data=request.data,
            context={
                "request": request,
                "project": project,
                "target_user": target_user,
            },
        )
        serializer.is_valid(raise_exception=True)
        membership.role = serializer.validated_data["role"]
        membership.save()
        return Response({"detail": "Role updated successfully."}, status=200)

    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        """Get all members of the project"""
        project = self.get_object()
        memberships = project.projectmembership_set.select_related(
            "user", "invited_by"
        ).all()
        serializer = ProjectMemberSerializer(memberships, many=True)
        return Response(serializer.data)
