import uuid

from django.contrib.auth import get_user_model
from django.core.validators import MinLengthValidator
from django.db import models

from apps.projects.models import Project

User = get_user_model()


class TaskList(models.Model):
    """
    TaskList model representing a column/list in a Trello board
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(
        max_length=100,
        validators=[MinLengthValidator(1)],
        help_text="List name (max 100 characters)"
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="task_lists",
        help_text="Project this list belongs to"
    )
    position = models.PositiveIntegerField(
        default=0,
        help_text="Position of the list in the project"
    )
    is_archived = models.BooleanField(
        default=False,
        help_text="Whether the list is archived"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position", "created_at"]
        verbose_name = "Task List"
        verbose_name_plural = "Task Lists"
        unique_together = ["project", "position"]
        indexes = [
            models.Index(fields=["project", "position"]),
            models.Index(fields=["project", "is_archived"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.project.name})"

    def get_tasks_count(self):
        """Get total number of tasks in this list"""
        return self.tasks.filter(is_archived=False).count()


class Task(models.Model):
    """
    Task model representing a card in a Trello list
    """
    
    PRIORITY_LOW = "low"
    PRIORITY_MEDIUM = "medium"
    PRIORITY_HIGH = "high"
    PRIORITY_URGENT = "urgent"
    
    PRIORITY_CHOICES = [
        (PRIORITY_LOW, "Low"),
        (PRIORITY_MEDIUM, "Medium"),
        (PRIORITY_HIGH, "High"),
        (PRIORITY_URGENT, "Urgent"),
    ]
    
    LABEL_COLORS = [
        ("#61bd4f", "Green"),
        ("#f2d600", "Yellow"),
        ("#ff9f1a", "Orange"),
        ("#eb5a46", "Red"),
        ("#c377e0", "Purple"),
        ("#0079bf", "Blue"),
        ("#00c2e0", "Sky"),
        ("#51e898", "Lime"),
        ("#ff78cb", "Pink"),
        ("#344563", "Black"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(1)],
        help_text="Task title (max 200 characters)"
    )
    description = models.TextField(
        blank=True,
        max_length=2000,
        help_text="Optional task description (max 2000 characters)"
    )
    task_list = models.ForeignKey(
        TaskList,
        on_delete=models.CASCADE,
        related_name="tasks",
        help_text="List this task belongs to"
    )
    position = models.PositiveIntegerField(
        default=0,
        help_text="Position of the task in the list"
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default=PRIORITY_MEDIUM,
        help_text="Task priority level"
    )
    label_color = models.CharField(
        max_length=7,
        choices=LABEL_COLORS,
        blank=True,
        null=True,
        help_text="Optional label color for the task"
    )
    assignees = models.ManyToManyField(
        User,
        related_name="assigned_tasks",
        blank=True,
        help_text="Users assigned to this task"
    )
    creator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_tasks",
        help_text="User who created this task"
    )
    due_date = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Optional due date for the task"
    )
    is_completed = models.BooleanField(
        default=False,
        help_text="Whether the task is completed"
    )
    is_archived = models.BooleanField(
        default=False,
        help_text="Whether the task is archived"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(
        blank=True,        null=True,
        help_text="When the task was completed"
    )

    class Meta:
        ordering = ["position", "created_at"]
        verbose_name = "Task"
        verbose_name_plural = "Tasks"
        # unique_together = ["task_list", "position"]  # Temporarily disabled to prevent race conditions
        indexes = [
            models.Index(fields=["task_list", "position"]),
            models.Index(fields=["task_list", "is_archived"]),
            models.Index(fields=["creator"]),
            models.Index(fields=["priority"]),
            models.Index(fields=["due_date"]),
            models.Index(fields=["is_completed"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.task_list.name})"

    
    def save(self, *args, **kwargs):
        """Override save to handle completion timestamp"""
        if self.is_completed and not self.completed_at:
            from django.utils import timezone
            self.completed_at = timezone.now()
        elif not self.is_completed:
            self.completed_at = None
        super().save(*args, **kwargs)

    def get_assignees_count(self):
        """Get total number of assignees"""
        return self.assignees.count()

    @property
    def is_overdue(self):
        """Check if task is overdue"""
        if not self.due_date or self.is_completed:
            return False
        from django.utils import timezone
        return timezone.now() > self.due_date

    def can_edit(self, user):
        """Check if user can edit this task"""
        # User can edit if they can edit the project
        return self.task_list.project.can_edit(user)

    def can_view(self, user):
        """Check if user can view this task"""
        # User can view if they can view the project
        return self.task_list.project.can_view(user)


class TaskComment(models.Model):
    """
    Comment model for tasks
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="comments",
        help_text="Task this comment belongs to"
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="task_comments",
        help_text="User who wrote this comment"
    )
    content = models.TextField(
        max_length=1000,
        help_text="Comment content (max 1000 characters)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_edited = models.BooleanField(
        default=False,
        help_text="Whether the comment has been edited"
    )

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Task Comment"
        verbose_name_plural = "Task Comments"
        indexes = [
            models.Index(fields=["task", "created_at"]),
            models.Index(fields=["author"]),
        ]

    def __str__(self):
        return f"Comment by {self.author.email} on {self.task.title}"

    def save(self, *args, **kwargs):
        """Override save to handle edit timestamp"""
        if self.pk:  # If updating existing comment
            self.is_edited = True
        super().save(*args, **kwargs)
