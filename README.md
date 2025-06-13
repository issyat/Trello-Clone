# TrelloClone - Modern Project Management Application

A full-featured Trello Clone built with React, Django, and PostgreSQL. This application provides a modern, responsive interface for project and task management with real-time updates and drag-and-drop functionality.

## Features

- 🔐 **User Authentication**
  - JWT-based authentication
  - Register, Login, and Password Reset
  - Social authentication support

- 📋 **Project Management**
  - Create and manage multiple projects
  - Invite team members to projects
  - Customizable project settings
  - Project activity timeline

- 📝 **Task Management**
  - Drag-and-drop task reordering
  - Create, edit, and delete tasks
  - Task descriptions with rich text support
  - Task priorities and due dates
  - Task assignments
  - Comments and attachments
  - Real-time updates using WebSockets

- 👥 **Team Collaboration**
  - Member management
  - Role-based permissions
  - Real-time notifications
  - Activity logging

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite for fast development and building
- Material-UI v7 for UI components
- @dnd-kit for drag-and-drop functionality
- React Query for state management
- Socket.io for real-time updates
- React Router for navigation
- Formik & Yup for form handling
- Date-fns for date management

### Backend
- Django 4.2 with Python
- Django REST Framework
- PostgreSQL database
- Redis for caching and WebSocket
- Celery for background tasks
- JWT authentication
- Channels for WebSocket support

### DevOps
- Docker and Docker Compose
- Nginx for production deployment
- Gunicorn as WSGI server
- WhiteNoise for static files
# Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Quick Start with Docker

1. Clone the repository:
```bash
git clone https://github.com/yourusername/trelloclone.git
cd trelloclone
```

2. Start the application:
```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Database: localhost:5432

### Local Development Setup

#### Backend
1. Create a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Start the development server:
```bash
python manage.py runserver
```

#### Frontend
1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Type Checking
```bash
cd frontend
npm run type-check
```

## Project Structure

```
trelloclone/
├── backend/
│   ├── apps/
│   │   ├── authentication/
│   │   ├── projects/
│   │   └── tasks/
│   ├── config/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── package.json
└── docker-compose.yml
```

## API Documentation

The API documentation is available at `/api/docs/` when running the backend server. It provides detailed information about all available endpoints, request/response formats, and authentication requirements.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Material-UI](https://mui.com/) for the UI components
- [DND Kit](https://dndkit.com/) for drag-and-drop functionality
- [Django REST Framework](https://www.django-rest-framework.org/) for API development

Rebuild services:
```bash
docker-compose up --build
```

View logs:
```bash
docker-compose logs -f [service-name]
```

Access container shell:
```bash
docker-compose exec [service-name] bash
```

## Services

- **Frontend**: React application on port 3000
- **Backend**: Django REST API on port 8000
- **Database**: PostgreSQL on port 5432
- **Redis**: For caching and real-time features on port 6379

## Features to Implement

### Core Features
- [x] User authentication (registration, login)
- [x] Project management (create, edit, delete)
- [x] Task management (create, edit, assign, delete)
- [x] Status management (todo, in progress, done)
- [x] Responsive interface
- [x] PostgreSQL data persistence

### Advanced Features
- [ ] Task search
- [ ] Advanced filtering (user, date, status)
- [ ] Real-time notifications
- [ ] Drag & drop functionality
- [ ] Dynamic updates (AJAX/WebSocket)
- [ ] Smooth animations

## Technology Stack

- **Frontend**: React 18, Material-UI, React Beautiful DnD
- **Backend**: Django 4.2, Django REST Framework
- **Database**: PostgreSQL 15
- **Cache**: Redis
- **Containerization**: Docker & Docker Compose
