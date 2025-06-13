from django.shortcuts import get_object_or_404
from django.db import transaction, IntegrityError
from django.db.models import Q, F, Max
from django.utils import timezone
import time
import random
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import TaskList, Task, TaskComment
from .serializers import (
    TaskListSerializer, TaskListCreateSerializer, TaskListDetailSerializer,
    TaskSerializer, TaskCreateSerializer, TaskDetailSerializer,
    TaskCommentSerializer, TaskMoveSerializer, TaskBulkUpdateSerializer
)
from apps.projects.models import Project


class TaskListViewSet(viewsets.ModelViewSet):
    """ViewSet for TaskList CRUD operations"""
    
    queryset = TaskList.objects.select_related('project').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['project', 'is_archived']
    search_fields = ['name']
    ordering_fields = ['position', 'created_at', 'updated_at']
    ordering = ['position', 'created_at']

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return TaskListCreateSerializer
        elif self.action in ['retrieve', 'list']:
            return TaskListDetailSerializer
        return TaskListSerializer

    def get_queryset(self):
        """Filter queryset based on user permissions"""
        user = self.request.user
        return TaskList.objects.select_related('project').filter(
            project__in=Project.objects.filter(
                Q(owner=user) | 
                Q(members=user)
            ).distinct()
        )

    def perform_create(self, serializer):
        """Handle TaskList creation with position management"""
        project = serializer.validated_data['project']
        position = serializer.validated_data.get('position')
        
        if position is None:
            # Auto-assign position at the end
            last_list = TaskList.objects.filter(project=project).order_by('-position').first()
            position = (last_list.position + 1) if last_list else 0
        
        serializer.save(position=position)

    @action(detail=True, methods=['post'])
    def reorder(self, request, pk=None):
        """Reorder task lists within a project"""
        task_list = self.get_object()
        project = task_list.project
        
        # Check permissions
        if not project.can_edit(request.user):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_position = request.data.get('new_position')
        if new_position is None:
            return Response(
                {'error': 'new_position is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            new_position = int(new_position)
        except (TypeError, ValueError):
            return Response(
                {'error': 'new_position must be a number'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all task lists in the project ordered by position
        task_lists = TaskList.objects.filter(project=project).order_by('position')
        
        # If moving to the end, just update this task list
        if new_position >= task_lists.count():
            task_list.position = task_lists.count() - 1
            task_list.save()
            return Response({'status': 'Task list position updated'})
        
        # Create a transaction to ensure atomicity
        with transaction.atomic():
            if new_position < task_list.position:
                # Moving up - shift affected lists down
                TaskList.objects.filter(
                    project=project,
                    position__gte=new_position,
                    position__lt=task_list.position
                ).update(position=F('position') + 1)
            else:
                # Moving down - shift affected lists up
                TaskList.objects.filter(
                    project=project,
                    position__gt=task_list.position,
                    position__lte=new_position
                ).update(position=F('position') - 1)
            
            # Update the task list's position
            task_list.position = new_position
            task_list.save()
        
        return Response({'status': 'Task list position updated'})


class TaskViewSet(viewsets.ModelViewSet):
    """ViewSet for Task CRUD operations"""
    
    queryset = Task.objects.select_related('task_list__project', 'creator').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['task_list', 'is_archived', 'creator', 'priority', 'is_completed']
    search_fields = ['title', 'description']    
    ordering_fields = ['position', 'due_date', 'created_at', 'updated_at']
    ordering = ['position', 'created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return TaskCreateSerializer
        elif self.action in ['retrieve', 'move', 'bulk_update']:
            return TaskDetailSerializer
        return TaskSerializer
        
    def get_queryset(self):
        """Filter queryset based on user permissions"""
        user = self.request.user
        return Task.objects.select_related('task_list__project', 'creator').filter(
            task_list__project__in=Project.objects.filter(
                Q(owner=user) | 
                Q(members=user)
            ).distinct()
        )

    def perform_create(self, serializer):
        """Handle Task creation with simple position management"""
        task_list = serializer.validated_data['task_list']
        position = serializer.validated_data.get('position')
        
        if position is None:
            # Use a much smaller timestamp approach to avoid integer overflow
            # Get current timestamp and use only the last 6 digits (seconds since epoch modulo 1M)
            import time
            timestamp_base = int(time.time()) % 1000000  # Keep only last 6 digits
            
            # Add task count to ensure ordering and uniqueness
            task_count = Task.objects.filter(task_list=task_list).count()
            position = timestamp_base + task_count
            
            # If still too large or collision, use a simple incremental approach
            max_position = Task.objects.filter(task_list=task_list).aggregate(
                max_pos=Max('position')
            )['max_pos']
            
            if max_position is not None and position <= max_position:
                position = max_position + 1
        
        # Save the task with the calculated position
        serializer.save(creator=self.request.user, position=position)

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        """Move task to a different list or position"""
        task = self.get_object()
        project = task.task_list.project
        
        # Check permissions
        if not project.can_edit(request.user):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = TaskMoveSerializer(
            data=request.data, context={'request': request, 'task': task}
        )
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        target_list = serializer.validated_data.get('target_list')
        new_position = serializer.validated_data.get('new_position')
        
        # If target list is different, update the task's list
        if target_list and target_list.id != task.task_list_id:
            # Get the new position in the target list
            if new_position is None:
                # Default to the end of the target list using timestamp approach
                import time
                base_timestamp = int(time.time()) % 1000000  # Keep only last 6 digits
                existing_count = Task.objects.filter(task_list=target_list).count()
                new_position = base_timestamp + existing_count
            
            # Update tasks in the old list
            with transaction.atomic():
                # No need to shift positions since we're using timestamp-based positioning
                # Just update the task
                task.task_list = target_list
                task.position = new_position
                task.save()
        
        # If only the position changed within the same list
        elif new_position is not None and new_position != task.position:
            with transaction.atomic():
                # For explicit position changes, we still need to handle ordering
                if new_position < task.position:
                    # Moving up - shift affected tasks down
                    Task.objects.filter(
                        task_list=task.task_list,
                        position__gte=new_position,
                        position__lt=task.position
                    ).update(position=F('position') + 1)
                else:
                    # Moving down - shift affected tasks up
                    Task.objects.filter(
                        task_list=task.task_list,
                        position__gt=task.position,
                        position__lte=new_position
                    ).update(position=F('position') - 1)
                
                # Update the task's position
                task.position = new_position
                task.save()
        
        return Response(TaskDetailSerializer(task).data)

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Update multiple tasks at once"""
        user = request.user
        
        serializer = TaskBulkUpdateSerializer(
            data=request.data, context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        tasks = serializer.validated_data['tasks']
        update_data = serializer.validated_data['update_data']
        
        # Check that all tasks belong to projects the user can edit
        task_objects = Task.objects.select_related('task_list__project').filter(id__in=tasks)
        
        for task in task_objects:
            if not task.task_list.project.can_edit(user):
                return Response(
                    {'error': f'Permission denied for task {task.id}'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Update tasks
        task_objects.update(**update_data, updated_at=timezone.now())
        
        return Response({
            'message': f'Successfully updated {task_objects.count()} tasks',
            'tasks': TaskSerializer(task_objects, many=True).data
        })


class TaskCommentViewSet(viewsets.ModelViewSet):
    """ViewSet for TaskComment CRUD operations"""
    
    queryset = TaskComment.objects.select_related(
        'task', 'task__task_list', 'task__task_list__project', 'author'
    ).all()
    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['task']
    ordering_fields = ['created_at']
    ordering = ['created_at']

    def get_queryset(self):
        """Filter queryset based on user permissions with optimized queries"""
        user = self.request.user
        return TaskComment.objects.select_related(
            'task', 'task__task_list', 'task__task_list__project', 'author'
        ).filter(
            task__task_list__project__in=Project.objects.filter(
                Q(owner=user) | 
                Q(members=user)
            ).distinct()
        )

    def perform_create(self, serializer):
        """Handle comment creation"""
        serializer.save(author=self.request.user)

    def update(self, request, *args, **kwargs):
        """Only allow comment author to update"""
        comment = self.get_object()
        if comment.author != request.user:
            return Response(
                {'error': 'You can only edit your own comments'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Only allow comment author or project admin to delete"""
        comment = self.get_object()
        if (comment.author != request.user and 
            not comment.task.task_list.project.can_edit(request.user)):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
