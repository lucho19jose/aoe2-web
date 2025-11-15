# Development Guide

This guide will help you set up and run the AoE2 Web Edition project locally.

## Prerequisites

Make sure you have the following installed:

- **Node.js** 18+ and npm
- **Python** 3.10+
- **PostgreSQL** 15+
- **Redis** 7+
- **Docker** (optional, recommended for easy setup)

## Quick Start with Docker

The easiest way to get started is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/lucho19jose/aoe2-web.git
cd aoe2-web

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs/

## Manual Setup (Without Docker)

### 1. Set up PostgreSQL

```bash
# Create database
createdb aoe2_web

# Or using psql
psql -U postgres
CREATE DATABASE aoe2_web;
\q
```

### 2. Set up Redis

```bash
# Start Redis server
redis-server

# Or with Homebrew on macOS
brew services start redis
```

### 3. Backend Setup

```bash
cd server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env and configure your database and Redis settings
# nano .env

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Run development server
python manage.py runserver
```

In a separate terminal, start the WebSocket server:

```bash
cd server
source venv/bin/activate
daphne -b 0.0.0.0 -p 8000 core.asgi:application
```

In another terminal, start Celery worker:

```bash
cd server
source venv/bin/activate
celery -A core worker -l info
```

And Celery beat for scheduled tasks:

```bash
cd server
source venv/bin/activate
celery -A core beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### 4. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Copy environment file (if needed)
# cp .env.example .env

# Start development server
npm run dev
```

The frontend will be available at http://localhost:3000

## Project Structure

```
aoe2-web/
├── client/                 # Vue 3 frontend
│   ├── src/
│   │   ├── components/    # Reusable Vue components
│   │   ├── views/         # Page components
│   │   ├── stores/        # Pinia stores
│   │   ├── services/      # API and game services
│   │   ├── entities/      # Game entity classes
│   │   ├── utils/         # Utility functions
│   │   ├── config/        # Game configuration
│   │   ├── types/         # TypeScript types
│   │   └── styles/        # Global styles
│   ├── public/            # Static assets
│   └── package.json
│
├── server/                # Django backend
│   ├── core/              # Django project settings
│   ├── api/               # REST API app
│   ├── websocket/         # WebSocket consumers
│   ├── utils/             # Utility functions
│   └── requirements.txt
│
├── docker-compose.yml     # Docker Compose configuration
├── ARCHITECTURE.md        # System architecture documentation
├── ROADMAP.md            # Development roadmap
└── README.md             # Project overview
```

## Development Workflow

### Frontend Development

```bash
# Run development server with hot reload
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Development

```bash
# Create new Django app
python manage.py startapp app_name

# Make migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run tests
pytest

# Code formatting
black .

# Linting
flake8
```

## Common Tasks

### Create a New Game Model

1. Add model to `server/api/models.py`
2. Create migration: `python manage.py makemigrations`
3. Apply migration: `python manage.py migrate`
4. Add to admin: Update `server/api/admin.py`
5. Create serializer: Update `server/api/serializers.py`
6. Add API endpoint: Update `server/api/views.py` and `server/api/urls.py`

### Add a New Vue Component

1. Create component in `client/src/components/ComponentName.vue`
2. Use composition API with `<script setup lang="ts">`
3. Add types in `client/src/types/` if needed
4. Import and use in your views

### Add Game Entity Type

1. Define in `client/src/config/gameConfig.ts`
2. Add type to `client/src/types/game.ts`
3. Create or update entity class in `client/src/entities/`
4. Update GameEngine to handle new entity

### Add WebSocket Message Type

1. Update consumer in `server/websocket/consumers.py`
2. Add handler method (e.g., `handle_new_message_type`)
3. Update frontend WebSocketService in `client/src/services/WebSocketService.ts`
4. Add listener in game component

## Testing

### Frontend Tests

```bash
cd client
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Backend Tests

```bash
cd server
pytest                           # Run all tests
pytest --cov                     # With coverage
pytest path/to/test_file.py     # Specific test file
pytest -k test_name             # Specific test
```

## Debugging

### Frontend Debugging

1. Use Vue DevTools browser extension
2. Add `debugger` statements in your code
3. Check browser console for errors
4. Use `console.log()` for quick debugging

### Backend Debugging

1. Use Django Debug Toolbar (already configured)
2. Add `import pdb; pdb.set_trace()` for breakpoints
3. Check Django logs in console
4. Use Django shell: `python manage.py shell`

### WebSocket Debugging

1. Use browser DevTools Network tab → WS filter
2. Monitor WebSocket messages
3. Check Django Channels logs
4. Test with tools like `wscat`:

```bash
npm install -g wscat
wscat -c ws://localhost:8000/ws/game/1/
```

## Performance Optimization

### Frontend

- Code splitting with dynamic imports
- Lazy loading routes
- Optimize Three.js rendering
- Use object pooling for game entities
- Implement WebAssembly for heavy computations

### Backend

- Database indexing
- Query optimization with `select_related` and `prefetch_related`
- Redis caching for frequently accessed data
- Celery for background tasks
- Database connection pooling

## Environment Variables

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
VITE_WS_HOST=localhost:8000
```

### Backend (.env)

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=aoe2_web
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Troubleshooting

### Database Connection Error

- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -l`

### Redis Connection Error

- Ensure Redis is running: `redis-cli ping`
- Check Redis host/port in settings

### WebSocket Connection Failed

- Ensure Daphne or Channels is running
- Check WebSocket URL in frontend
- Verify CORS settings

### Frontend Build Errors

- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `npm cache clean --force`
- Check Node.js version: `node --version`

## Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes
3. Run tests: `npm run test` and `pytest`
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

## Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Quasar Framework](https://quasar.dev/)
- [Three.js Documentation](https://threejs.org/docs/)
- [Django Documentation](https://docs.djangoproject.com/)
- [Django Channels](https://channels.readthedocs.io/)
- [Celery Documentation](https://docs.celeryproject.org/)

## License

MIT License - see LICENSE file for details
