from django.contrib import admin

from .models import Project, ProjectMembership


class ProjectMembershipInline(admin.TabularInline):
    """Inline admin for project memberships"""

    model = ProjectMembership
    extra = 0
    readonly_fields = ("id", "joined_at")
    autocomplete_fields = ["user", "invited_by"]


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Admin configuration for Project model"""

    list_display = [
        "name",
        "owner",
        "is_private",
        "is_archived",
        "get_members_count",
        "created_at",
    ]
    list_filter = ["is_private", "is_archived", "background_color", "created_at"]
    search_fields = ["name", "description", "owner__email"]
    readonly_fields = ["id", "created_at", "updated_at", "get_members_count"]
    autocomplete_fields = ["owner"]
    inlines = [ProjectMembershipInline]

    fieldsets = (
        ("Basic Information", {"fields": ("id", "name", "description", "owner")}),
        (
            "Settings",
            {
                "fields": (
                    "background_color",
                    "background_image",
                    "is_private",
                    "is_archived",
                )
            },
        ),
        (
            "Metadata",
            {
                "fields": ("get_members_count", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    def get_members_count(self, obj):
        """Display members count in admin"""
        return obj.get_members_count()

    get_members_count.short_description = "Members Count"


@admin.register(ProjectMembership)
class ProjectMembershipAdmin(admin.ModelAdmin):
    """Admin configuration for ProjectMembership model"""

    list_display = ["user", "project", "role", "invited_by", "joined_at"]
    list_filter = ["role", "joined_at"]
    search_fields = ["user__email", "project__name", "invited_by__email"]
    readonly_fields = ["id", "joined_at"]
    autocomplete_fields = ["project", "user", "invited_by"]

    fieldsets = (
        ("Membership Details", {"fields": ("id", "project", "user", "role")}),
        ("Invitation Info", {"fields": ("invited_by", "joined_at")}),
    )
