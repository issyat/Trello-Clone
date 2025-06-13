from django.contrib import admin
from .models import TaskList, Task, TaskComment


@admin.register(TaskList)
class TaskListAdmin(admin.ModelAdmin):
    list_display = ['name', 'project', 'position', 'is_archived', 'created_at']
    list_filter = ['is_archived', 'project', 'created_at']
    search_fields = ['name', 'project__name']
    ordering = ['project', 'position']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'task_list', 'priority', 'is_completed', 'creator', 'due_date', 'created_at']
    list_filter = ['priority', 'is_completed', 'is_archived', 'task_list__project', 'created_at', 'due_date']
    search_fields = ['title', 'description', 'task_list__name']
    filter_horizontal = ['assignees']
    ordering = ['task_list', 'position']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'task_list', 'creator')
        }),
        ('Assignment & Priority', {
            'fields': ('assignees', 'priority', 'labels')
        }),
        ('Status & Dates', {
            'fields': ('is_completed', 'completed_at', 'due_date', 'is_archived')
        }),
        ('Position', {
            'fields': ('position',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'author', 'content_preview', 'created_at']
    list_filter = ['created_at', 'task__task_list__project']
    search_fields = ['content', 'task__title', 'author__email']
    readonly_fields = ['created_at', 'updated_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'
