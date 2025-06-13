from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'task-lists', views.TaskListViewSet, basename='tasklist')
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'task-comments', views.TaskCommentViewSet, basename='taskcomment')

urlpatterns = [
    path('', include(router.urls)),
]
