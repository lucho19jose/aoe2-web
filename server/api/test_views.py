"""
Tests for the API views.
"""
import pytest
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from api.models import Game, Player


@pytest.mark.django_db
class TestGameViewSet:
    """Test cases for the Game ViewSet."""

    def setup_method(self):
        """Set up test fixtures."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_list_games(self):
        """Test listing games."""
        Game.objects.create(name='Game 1')
        Game.objects.create(name='Game 2')

        response = self.client.get('/api/games/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

    def test_create_game(self):
        """Test creating a game."""
        data = {
            'name': 'New Game',
            'max_players': 4,
            'map_size': 'large'
        }
        response = self.client.post('/api/games/', data)
        assert response.status_code == status.HTTP_201_CREATED
        assert Game.objects.count() == 1
        assert Game.objects.first().name == 'New Game'

    def test_available_games(self):
        """Test listing available games."""
        Game.objects.create(name='Waiting Game', status='waiting')
        Game.objects.create(name='Started Game', status='in_progress')

        response = self.client.get('/api/games/available/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Waiting Game'

    def test_join_game(self):
        """Test joining a game."""
        game = Game.objects.create(name='Test Game', status='waiting')

        response = self.client.post(f'/api/games/{game.id}/join/')
        assert response.status_code == status.HTTP_200_OK
        assert Player.objects.filter(user=self.user, game=game).exists()

    def test_join_full_game(self):
        """Test joining a full game."""
        game = Game.objects.create(name='Full Game', max_players=1, status='waiting')
        other_user = User.objects.create_user(username='other', password='pass123')
        Player.objects.create(user=other_user, game=game)

        response = self.client.post(f'/api/games/{game.id}/join/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'full' in response.data['error'].lower()

    def test_leave_game(self):
        """Test leaving a game."""
        game = Game.objects.create(name='Test Game')
        Player.objects.create(user=self.user, game=game)

        response = self.client.post(f'/api/games/{game.id}/leave/')
        assert response.status_code == status.HTTP_200_OK
        assert not Player.objects.filter(user=self.user, game=game).exists()

    def test_start_game(self):
        """Test starting a game."""
        game = Game.objects.create(name='Test Game', status='waiting')
        user2 = User.objects.create_user(username='player2', password='pass123')
        Player.objects.create(user=self.user, game=game)
        Player.objects.create(user=user2, game=game)

        response = self.client.post(f'/api/games/{game.id}/start/')
        assert response.status_code == status.HTTP_200_OK
        game.refresh_from_db()
        assert game.status == 'starting'

    def test_start_game_not_enough_players(self):
        """Test starting a game with not enough players."""
        game = Game.objects.create(name='Test Game', status='waiting')
        Player.objects.create(user=self.user, game=game)

        response = self.client.post(f'/api/games/{game.id}/start/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'at least 2 players' in response.data['error'].lower()

    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access games."""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/games/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestPlayerViewSet:
    """Test cases for the Player ViewSet."""

    def setup_method(self):
        """Set up test fixtures."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_list_players(self):
        """Test listing players (filtered by current user)."""
        game1 = Game.objects.create(name='Game 1')
        game2 = Game.objects.create(name='Game 2')
        other_user = User.objects.create_user(username='other', password='pass123')

        Player.objects.create(user=self.user, game=game1)
        Player.objects.create(user=self.user, game=game2)
        Player.objects.create(user=other_user, game=game1)

        response = self.client.get('/api/players/')
        assert response.status_code == status.HTTP_200_OK
        # Should only see own players
        assert len(response.data) == 2

    def test_mark_player_ready(self):
        """Test marking a player as ready."""
        game = Game.objects.create(name='Test Game')
        player = Player.objects.create(user=self.user, game=game)

        response = self.client.post(f'/api/players/{player.id}/ready/')
        assert response.status_code == status.HTTP_200_OK
        player.refresh_from_db()
        assert player.is_ready is True
