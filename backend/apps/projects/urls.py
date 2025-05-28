from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import ProjectViewSet

app_name = "projects"

# Create router for ViewSet
router = DefaultRouter()
router.register(r"", ProjectViewSet, basename="project")

urlpatterns = [
    path("", include(router.urls)),
]

# This will create the following URL patterns:
# GET /api/projects/ - List all projects
# POST /api/projects/ - Create new project
# GET /api/projects/{id}/ - Get project details
# PUT /api/projects/{id}/ - Update project (full)
# PATCH /api/projects/{id}/ - Update project (partial)
# DELETE /api/projects/{id}/ - Delete project
# POST /api/projects/{id}/add_member/ - Add member to project
# DELETE /api/projects/{id}/members/{user_id}/ - Remove member from project
# PATCH /api/projects/{id}/members/{user_id}/ - Update member role
# GET /api/projects/{id}/members/ - Get all project members
# GET /api/projects/my_projects/ - Get projects owned by user
# GET /api/projects/shared_with_me/ - Get projects where user is member
