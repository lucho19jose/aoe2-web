# Age of Empires II Web Edition

A browser-based real-time strategy game inspired by Age of Empires II: Definitive Edition, built with modern web technologies.

## 🎮 Features

- **Real-time Multiplayer**: 2-8 players with authoritative server
- **Classic RTS Gameplay**: Resource gathering, building construction, unit combat
- **Multiple Civilizations**: Each with unique bonuses and units
- **Advanced AI**: Multiple difficulty levels
- **WebAssembly Performance**: Native-speed pathfinding and collision detection
- **Replay System**: Watch and share your games
- **Cross-Platform**: Works on any modern browser

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL 15+
- Redis 7+
- Docker (optional, for containerized development)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/lucho19jose/aoe2-web.git
cd aoe2-web
```

2. **Install frontend dependencies**
```bash
cd client
npm install
npm run dev
```

3. **Install backend dependencies**
```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

4. **Start Redis (for WebSocket support)**
```bash
redis-server
```

5. **Run WebSocket server**
```bash
cd server
python manage.py run_channels
```

### Using Docker

```bash
docker-compose up -d
```

Visit `http://localhost:3000` to play!

## 📖 Documentation

- [**Architecture**](./ARCHITECTURE.md) - Detailed system architecture
- [**Roadmap**](./ROADMAP.md) - Development phases and milestones
- [**API Documentation**](./docs/API.md) - REST API reference
- [**WebSocket Protocol**](./docs/WEBSOCKET.md) - Real-time communication protocol
- [**Contributing**](./CONTRIBUTING.md) - How to contribute

## 🛠️ Tech Stack

### Frontend
- **Framework**: Vue 3 (Composition API)
- **UI Library**: Quasar Framework
- **Rendering**: WebGL (Three.js) + Canvas 2D
- **State Management**: Pinia
- **Build Tool**: Vite

### Backend
- **Framework**: Django 4.x + Django REST Framework
- **Real-time**: Django Channels (WebSocket)
- **Database**: PostgreSQL
- **Cache**: Redis
- **Task Queue**: Celery

### Performance
- **WebAssembly**: Rust (pathfinding, collision detection, simulation)
- **Spatial Indexing**: Quadtree + Spatial hashing
- **Object Pooling**: For projectiles and particles

## 🎯 Development Roadmap

- [x] Phase 1: Foundation (Rendering, basic movement)
- [ ] Phase 2: Core Gameplay (Resources, combat, buildings)
- [ ] Phase 3: Multiplayer (WebSocket, matchmaking)
- [ ] Phase 4: WebAssembly (Performance optimization)
- [ ] Phase 5: Content (Civilizations, units, buildings)
- [ ] Phase 6: Polish (AI, UI/UX, sound)

See [ROADMAP.md](./ROADMAP.md) for detailed tasks.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Age of Empires II by Ensemble Studios
- Game data and balance references from [AoE2.net](https://aoe2.net/)
- Open-source RTS game [0 A.D.](https://play0ad.com/) for technical inspiration

## 📧 Contact

- **Author**: Lucho19jose
- **GitHub**: [@lucho19jose](https://github.com/lucho19jose)
- **Issues**: [GitHub Issues](https://github.com/lucho19jose/aoe2-web/issues)

---

**Note**: This is a fan project and is not affiliated with or endorsed by Microsoft or Ensemble Studios.
