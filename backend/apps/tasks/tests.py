from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.projects.models import Project
from .models import TaskList, Task, TaskComment

User = get_user_model()


class TaskListModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@example.com', password='testpass')
        self.project = Project.objects.create(name='Test Project', owner=self.user)

    def test_task_list_creation(self):
        """Test that TaskList can be created successfully"""
        task_list = TaskList.objects.create(
            name='Test List',
            project=self.project,
            position=0
        )
        self.assertEqual(task_list.name, 'Test List')
        self.assertEqual(task_list.project, self.project)
        self.assertEqual(task_list.position, 0)
        self.assertFalse(task_list.is_archived)

    def test_task_list_count(self):
        """Test TaskList count functionality"""
        initial_count = TaskList.objects.count()
        TaskList.objects.create(name='List 1', project=self.project, position=0)
        TaskList.objects.create(name='List 2', project=self.project, position=1)
        final_count = TaskList.objects.count()
        self.assertEqual(final_count, initial_count + 2)


class TaskModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@example.com', password='testpass')
        self.project = Project.objects.create(name='Test Project', owner=self.user)
        self.task_list = TaskList.objects.create(
            name='Test List', 
            project=self.project, 
            position=0
        )

    def test_task_creation(self):
        """Test that Task can be created successfully"""
        task = Task.objects.create(
            title='Test Task',
            task_list=self.task_list,
            creator=self.user,
            position=0
        )
        self.assertEqual(task.title, 'Test Task')
        self.assertEqual(task.task_list, self.task_list)
        self.assertEqual(task.creator, self.user)
        self.assertEqual(task.position, 0)
        self.assertFalse(task.is_completed)

    def test_task_count(self):
        """Test Task count functionality"""
        initial_count = Task.objects.count()
        Task.objects.create(title='Task 1', task_list=self.task_list, creator=self.user, position=0)
        Task.objects.create(title='Task 2', task_list=self.task_list, creator=self.user, position=1)
        final_count = Task.objects.count()
        self.assertEqual(final_count, initial_count + 2)
