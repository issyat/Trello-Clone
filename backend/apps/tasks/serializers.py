from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import TaskList, Task, TaskComment
from apps.projects.models import Project

User = get_user_model()


class TaskListSerializer(serializers.ModelSerializer):
    """Serializer for TaskList model"""
    
    tasks_count = serializers.ReadOnlyField(source='get_tasks_count')
    project_name = serializers.ReadOnlyField(source='project.name')
    
    class Meta:
        model = TaskList
        fields = [
            'id', 'name', 'project', 'project_name', 'position', 
            'is_archived', 'tasks_count', 'created_at', 'updated_at'        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_project(self, value):
        """Validate that user can edit the project"""
        user = self.context['request'].user
        print(f"DEBUG: Validating project {value.id} for user {user}")
        print(f"DEBUG: User can edit: {value.can_edit(user)}")
        print(f"DEBUG: User is owner: {value.owner == user}")
        print(f"DEBUG: User memberships: {value.projectmembership_set.filter(user=user).values('role')}")
        
        if not value.can_edit(user):
            print(f"DEBUG: Permission validation failed!")
            raise serializers.ValidationError(
                "You don't have permission to create lists in this project."
            )
        print(f"DEBUG: Permission validation passed!")
        return value


class TaskListCreateSerializer(TaskListSerializer):
    """Serializer for creating TaskList"""
    
    class Meta(TaskListSerializer.Meta):
        fields = ['name', 'project', 'position']


class TaskListDetailSerializer(TaskListSerializer):
    """Detailed serializer for TaskList with tasks"""
    
    tasks = serializers.SerializerMethodField()
    
    class Meta(TaskListSerializer.Meta):
        fields = TaskListSerializer.Meta.fields + ['tasks']
    
    def get_tasks(self, obj):
        """Get tasks in this list"""
        tasks = obj.tasks.filter(is_archived=False).order_by('position', 'created_at')
        return TaskSerializer(tasks, many=True, context=self.context).data


class TaskCommentSerializer(serializers.ModelSerializer):
    """Serializer for TaskComment model"""
    
    author_email = serializers.ReadOnlyField(source='author.email')
    author_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskComment
        fields = [
            'id', 'task', 'author', 'author_email', 'author_name',
            'content', 'created_at', 'updated_at', 'is_edited'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at', 'is_edited']
    
    def get_author_name(self, obj):
        """Get author's display name"""
        return getattr(obj.author, 'first_name', '') or obj.author.email
    
    def validate_task(self, value):
        """Validate that user can comment on this task"""
        user = self.context['request'].user
        if not value.can_view(user):
            raise serializers.ValidationError(
                "You don't have permission to comment on this task."
            )
        return value


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model"""
    
    assignees_count = serializers.ReadOnlyField(source='get_assignees_count')
    creator_email = serializers.ReadOnlyField(source='creator.email')
    task_list_name = serializers.ReadOnlyField(source='task_list.name')
    project_name = serializers.ReadOnlyField(source='task_list.project.name')
    is_overdue = serializers.ReadOnlyField()
    assignees = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=User.objects.all(),
        required=False
    )
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'task_list', 'task_list_name',
            'project_name', 'position', 'priority', 'label_color',
            'assignees', 'assignees_count', 'creator', 'creator_email',
            'due_date', 'is_completed', 'is_archived', 'is_overdue',
            'created_at', 'updated_at', 'completed_at'        ]
        read_only_fields = [
            'id', 'creator', 'created_at', 'updated_at', 'completed_at'
        ]

    def validate_task_list(self, value):
        """Validate that user can create tasks in this list"""
        user = self.context['request'].user
        print(f"DEBUG: Task creation - validating task_list {value.id} for user {user}")
        print(f"DEBUG: Task creation - project can_edit: {value.project.can_edit(user)}")
        if not value.project.can_edit(user):
            print(f"DEBUG: Task creation validation failed - permission denied")
            raise serializers.ValidationError(
                "You don't have permission to create tasks in this list."
            )
        print(f"DEBUG: Task creation validation passed")
        return value

    def validate_assignees(self, value):
        """Validate that assignees are members of the project"""
        if not value:
            return value
        
        task_list = self.initial_data.get('task_list')
        if not task_list:
            # If updating, get task_list from instance
            if self.instance:
                task_list = self.instance.task_list
            else:
                return value
        
        project = task_list.project if hasattr(task_list, 'project') else None
        if project:
            for user in value:
                if not project.is_member(user):
                    raise serializers.ValidationError(
                        f"User {user.email} is not a member of this project."
                    )
        return value


class TaskCreateSerializer(TaskSerializer):
    """Serializer for creating Task"""
    
    class Meta(TaskSerializer.Meta):
        fields = [
            'title', 'description', 'task_list', 'position', 
            'priority', 'label_color', 'assignees', 'due_date'
        ]

    def create(self, validated_data):
        """Custom create method with debugging"""
        print(f"DEBUG: TaskCreateSerializer.create called with validated_data: {validated_data}")
        try:
            # Extract assignees if present
            assignees = validated_data.pop('assignees', [])
            print(f"DEBUG: TaskCreateSerializer.create - assignees: {assignees}")
            
            # Create the task
            task = Task.objects.create(**validated_data)
            print(f"DEBUG: TaskCreateSerializer.create - task created: {task.id}")
            
            # Set assignees if any
            if assignees:
                task.assignees.set(assignees)
                print(f"DEBUG: TaskCreateSerializer.create - assignees set")
            
            return task
        except Exception as e:
            print(f"DEBUG: TaskCreateSerializer.create - ERROR: {e}")
            print(f"DEBUG: TaskCreateSerializer.create - ERROR type: {type(e)}")
            raise


class TaskDetailSerializer(TaskSerializer):
    """Detailed serializer for Task with comments"""
    
    comments = TaskCommentSerializer(many=True, read_only=True)
    assignees_details = serializers.SerializerMethodField()
    
    class Meta(TaskSerializer.Meta):
        fields = TaskSerializer.Meta.fields + ['comments', 'assignees_details']
    
    def get_assignees_details(self, obj):
        """Get detailed assignee information"""
        return [
            {
                'id': user.id,
                'email': user.email,
                'name': getattr(user, 'first_name', '') or user.email
            }
            for user in obj.assignees.all()
        ]


class TaskMoveSerializer(serializers.Serializer):
    """Serializer for moving tasks between lists"""
    
    target_list = serializers.PrimaryKeyRelatedField(queryset=TaskList.objects.all())
    new_position = serializers.IntegerField(min_value=0)
    
    def validate_target_list(self, value):
        """Validate that user can move tasks to target list"""
        user = self.context['request'].user
        if not value.project.can_edit(user):
            raise serializers.ValidationError(
                "You don't have permission to move tasks to this list."
            )
        return value


class TaskBulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk updating tasks"""
    
    task_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1
    )
    action = serializers.ChoiceField(choices=[
        ('complete', 'Mark as Complete'),
        ('incomplete', 'Mark as Incomplete'),
        ('archive', 'Archive'),
        ('unarchive', 'Unarchive'),
    ])
    
    def validate_task_ids(self, value):
        """Validate that all tasks exist and user can edit them"""
        user = self.context['request'].user
        tasks = Task.objects.filter(id__in=value)
        
        if len(tasks) != len(value):
            raise serializers.ValidationError("Some tasks were not found.")
        
        for task in tasks:
            if not task.can_edit(user):
                raise serializers.ValidationError(
                    f"You don't have permission to edit task: {task.title}"
                )
        
        return value
