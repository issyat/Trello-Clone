# Trello Clone Project

A collaborative project and task management application built with React, Django, and PostgreSQL.

## Project Structure

```
TrelloClone/
├── backend/                 # Django REST API
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .dockerignore
├── frontend/                # React application
│   ├── Dockerfile
│   ├── package.json
│   └── .dockerignore
├── database/               # Database initialization
│   └── init.sql
├── docker-compose.yml      # Docker orchestration
└── README.md
```

## Quick Start

### Prerequisites
- Docker
- Docker Compose

### Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd TrelloClone
```

2. Build and start all services:
```bash
docker-compose up --build
```

3. Access the applications:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Database: localhost:5432

### Development Commands

Start services:
```bash
docker-compose up
```

Stop services:
```bash
docker-compose down
```

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
