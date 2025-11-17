# Testing Documentation

## Overview

This document describes the testing strategy and how to run tests for the AoE2 Web Edition project.

## Testing Stack

### Frontend (Client)
- **Test Framework**: Vitest
- **Test Utilities**: @vue/test-utils
- **Coverage**: @vitest/coverage-v8
- **DOM Environment**: jsdom

### Backend (Server)
- **Test Framework**: pytest
- **Django Testing**: pytest-django
- **Async Testing**: pytest-asyncio
- **Fixtures**: factory-boy
- **Coverage**: pytest-cov

## Running Tests

### Frontend Tests

```bash
cd client

# Run all tests
npm test

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Backend Tests

```bash
cd server

# Run all tests
pytest

# Run with coverage
pytest --cov

# Run specific test file
pytest tests/test_api.py

# Run specific test
pytest tests/test_api.py::TestAuthAPI::test_user_can_login

# Run tests with specific markers
pytest -m unit
pytest -m integration
pytest -m websocket
```

## Test Structure

### Frontend Test Structure

```
client/src/tests/
├── setup.ts                    # Test setup and global mocks
├── unit/                       # Unit tests
│   ├── stores/                 # Store tests
│   │   └── game.test.ts
│   ├── services/               # Service tests
│   │   └── ApiService.test.ts
│   └── utils/                  # Utility tests
└── integration/                # Integration tests
    └── pathfinding.test.ts
```

### Backend Test Structure

```
server/tests/
├── __init__.py
├── conftest.py                 # Pytest fixtures
├── test_api.py                 # API endpoint tests
├── test_models.py              # Model tests
├── test_websocket.py           # WebSocket tests
└── test_security.py            # Security tests
```

## Writing Tests

### Frontend Unit Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '@/stores/game'

describe('Game Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default values', () => {
    const store = useGameStore()
    expect(store.isGameActive).toBe(false)
  })
})
```

### Backend Unit Test Example

```python
import pytest
from django.urls import reverse
from rest_framework import status

@pytest.mark.django_db
class TestGameAPI:
    def test_create_game(self, authenticated_client):
        url = reverse('game-list')
        data = {'name': 'Test Game'}
        response = authenticated_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
```

### WebSocket Test Example

```python
import pytest
from channels.testing import WebsocketCommunicator

@pytest.mark.asyncio
@pytest.mark.django_db
async def test_websocket_connect():
    communicator = WebsocketCommunicator(application, "/ws/game/1/")
    connected, _ = await communicator.connect()
    assert connected
    await communicator.disconnect()
```

## Test Categories

### Unit Tests
- Test individual components/functions in isolation
- Mock external dependencies
- Fast execution
- High code coverage

### Integration Tests
- Test multiple components working together
- Real database/service connections
- Slower than unit tests
- Test realistic scenarios

### End-to-End Tests
- Test complete user workflows
- Real browser/API interactions
- Slowest tests
- Most realistic

## Testing Best Practices

### General

1. **Naming Convention**
   - Use descriptive test names
   - Follow pattern: `test_<what>_<when>_<expected>`
   - Example: `test_user_creation_with_valid_data_succeeds`

2. **AAA Pattern**
   - Arrange: Set up test data
   - Act: Execute the code being tested
   - Assert: Verify the results

3. **Test Independence**
   - Each test should be independent
   - Don't rely on test execution order
   - Clean up after tests

4. **Use Fixtures**
   - Reuse common test setup
   - Keep tests DRY (Don't Repeat Yourself)

### Frontend Specific

1. **Component Testing**
   ```typescript
   import { mount } from '@vue/test-utils'

   it('renders correctly', () => {
     const wrapper = mount(MyComponent, {
       props: { title: 'Test' }
     })
     expect(wrapper.text()).toContain('Test')
   })
   ```

2. **Store Testing**
   - Test state changes
   - Test actions
   - Test getters
   - Use fresh pinia instance for each test

3. **Async Testing**
   ```typescript
   it('fetches data', async () => {
     const data = await fetchData()
     expect(data).toBeDefined()
   })
   ```

### Backend Specific

1. **Database Tests**
   - Use `@pytest.mark.django_db`
   - Transactions are rolled back after each test
   - Use fixtures for test data

2. **API Testing**
   - Test all HTTP methods
   - Test authentication/authorization
   - Test error cases
   - Verify response structure

3. **Mock External Services**
   ```python
   from unittest.mock import patch

   @patch('myapp.external_api.call')
   def test_with_mock(mock_call):
       mock_call.return_value = {'status': 'ok'}
       result = my_function()
       assert result == expected
   ```

## Coverage Goals

- **Overall Coverage**: Aim for 80%+
- **Critical Paths**: 100% coverage
- **New Code**: 90%+ coverage for new features

### Viewing Coverage

**Frontend:**
```bash
npm run test:coverage
# Open client/coverage/index.html in browser
```

**Backend:**
```bash
pytest --cov --cov-report=html
# Open server/htmlcov/index.html in browser
```

## Continuous Integration

Tests run automatically on:
- Every push to feature branches
- Pull requests to main/develop
- Scheduled weekly runs

### CI Test Pipeline

1. **Linting** → 2. **Type Checking** → 3. **Unit Tests** → 4. **Integration Tests** → 5. **Build Check**

## Debugging Tests

### Frontend

```bash
# Run tests in watch mode with UI
npm run test:ui

# Run specific test file
npm test src/tests/unit/stores/game.test.ts
```

### Backend

```bash
# Run with verbose output
pytest -v

# Run with print statements visible
pytest -s

# Drop into debugger on failure
pytest --pdb

# Run last failed tests
pytest --lf
```

## Test Data Management

### Frontend
- Mock data in `src/tests/mockData/`
- Use factory functions for complex objects

### Backend
- Use `factory-boy` for model factories
- Fixtures in `conftest.py`
- Test database automatically created/destroyed

## Performance Testing

For performance-critical code:

```python
import pytest
from time import time

@pytest.mark.slow
def test_performance():
    start = time()
    result = expensive_operation()
    duration = time() - start
    assert duration < 1.0  # Should complete in under 1 second
```

## Security Testing

Run security-focused tests:

```bash
# Backend
pytest -m security

# Check for vulnerabilities
safety check
bandit -r .

# Frontend
npm audit
```

## Troubleshooting

### Common Issues

1. **Tests failing in CI but passing locally**
   - Check environment variables
   - Verify database/Redis availability
   - Check for timing issues

2. **Slow tests**
   - Use `pytest-xdist` for parallel execution
   - Mock external API calls
   - Use smaller test datasets

3. **Flaky tests**
   - Add proper waits for async operations
   - Don't rely on timing
   - Ensure test independence

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [pytest Documentation](https://docs.pytest.org/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Django Testing](https://docs.djangoproject.com/en/stable/topics/testing/)
- [pytest-django](https://pytest-django.readthedocs.io/)

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure tests pass locally
3. Maintain or improve coverage
4. Update this documentation if needed
