from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from .models import Project, ProjectMembership

User = get_user_model()


class ProjectMemberSerializer(serializers.ModelSerializer):
    """Serializer for project members with user details"""

    user_id = serializers.UUIDField(source="user.id", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    invited_by_email = serializers.EmailField(source="invited_by.email", read_only=True)

    class Meta:
        model = ProjectMembership
        fields = [
            "id",
            "user_id",
            "email",
            "first_name",
            "last_name",
            "role",
            "invited_by_email",
            "joined_at",
        ]
        validators = [
            UniqueTogetherValidator(
                queryset=ProjectMembership.objects.all(),
                fields=["project", "user"],
                message="User is already a member of this project.",
            )
        ]


class ProjectListSerializer(serializers.ModelSerializer):
    """Serializer for listing projects (minimal data)"""

    owner_email = serializers.EmailField(source="owner.email", read_only=True)
    members_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "owner_email",
            "members_count",
            "background_color",
            "is_private",
            "is_archived",
            "created_at",
            "updated_at",
        ]

    def get_members_count(self, obj):
        return obj.get_members_count()


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed project view"""

    owner_email = serializers.EmailField(source="owner.email", read_only=True)
    members = ProjectMemberSerializer(
        source="projectmembership_set", many=True, read_only=True
    )
    members_count = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "owner_email",
            "members",
            "members_count",
            "background_color",
            "background_image",
            "is_private",
            "is_archived",
            "created_at",
            "updated_at",
            "user_role",
        ]

    def get_members_count(self, obj):
        return obj.get_members_count()

    def get_user_role(self, obj):
        """Get current user's role in the project"""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None

        user = request.user
        if user == obj.owner:
            return "owner"

        membership = obj.projectmembership_set.filter(user=user).first()
        return membership.role if membership else None


class ProjectCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating projects"""

    owner_email = serializers.EmailField(source="owner.email", read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "background_color",
            "background_image",
            "is_private",
            "owner_email",
        ]

    def create(self, validated_data):
        # Automatically set the owner to the current user
        validated_data["owner"] = self.context["request"].user
        return super().create(validated_data)


class ProjectUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating projects"""

    class Meta:
        model = Project
        fields = [
            "name",
            "description",
            "background_color",
            "background_image",
            "is_private",
            "is_archived",
        ]


class AddMemberSerializer(serializers.Serializer):
    """Serializer for adding members to a project"""

    email = serializers.EmailField()
    role = serializers.ChoiceField(
        choices=ProjectMembership.ROLE_CHOICES, default=ProjectMembership.EDITOR
    )

    def validate_email(self, value):
        """Validate that the user exists"""
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
        return value

    def validate(self, attrs):
        """Validate that user is not already a member"""
        project = self.context["project"]
        email = attrs["email"]

        try:
            user = User.objects.get(email=email)
            if user == project.owner:
                raise serializers.ValidationError(
                    "Cannot add project owner as a member."
                )

            if project.projectmembership_set.filter(user=user).exists():
                raise serializers.ValidationError(
                    "User is already a member of this project."
                )
        except User.DoesNotExist:
            pass  # This will be caught by validate_email

        return attrs


class UpdateMemberRoleSerializer(serializers.Serializer):
    """Serializer for updating member role"""

    role = serializers.ChoiceField(choices=ProjectMembership.ROLE_CHOICES)

    def validate_role(self, value):
        """Validate role change permissions"""
        request = self.context["request"]
        project = self.context["project"]
        target_user = self.context["target_user"]

        # Only owner and admins can change roles
        if not project.can_edit(request.user):
            raise serializers.ValidationError(
                "You don't have permission to change member roles."
            )

        # Owner cannot have their role changed
        if target_user == project.owner:
            raise serializers.ValidationError("Cannot change role of project owner.")

        return value
