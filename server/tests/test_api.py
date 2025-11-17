"""
Tests for API endpoints
"""
import pytest
from django.urls import reverse
from api.models import Game, Player


@pytest.mark.django_db
class TestGameAPI:
    """Test Game API endpoints"""

    def test_list_games_requires_authentication(self, api_client):
        """Test that listing games requires authentication"""
        url = reverse('game-list')
        response = api_client.get(url)
        assert response.status_code == 401

    def test_list_games_authenticated(self, authenticated_client):
        """Test listing games when authenticated"""
        url = reverse('game-list')
        response = authenticated_client.get(url)
        assert response.status_code == 200
        assert isinstance(response.data, dict)

    def test_create_game(self, authenticated_client, user):
        """Test creating a new game"""
        url = reverse('game-list')
        data = {
            'name': 'Test Game',
            'map_name': 'Arabia',
            'max_players': 4,
        }
        response = authenticated_client.post(url, data)
        assert response.status_code == 201
        assert response.data['name'] == 'Test Game'
        assert response.data['map_name'] == 'Arabia'

    def test_available_games(self, authenticated_client, user):
        """Test getting available games"""
        # Create some games
        Game.objects.create(
            name='Waiting Game',
            map_name='Arabia',
            max_players=4,
            status='waiting'
        )
        Game.objects.create(
            name='Started Game',
            map_name='Arabia',
            max_players=4,
            status='in_progress'
        )

        url = reverse('game-available')
        response = authenticated_client.get(url)
        assert response.status_code == 200
        # Should only return waiting games
        assert len(response.data) == 1
        assert response.data[0]['status'] == 'waiting'


@pytest.mark.django_db
class TestGameModel:
    """Test Game model"""

    def test_create_game(self):
        """Test creating a game instance"""
        game = Game.objects.create(
            name='Test Game',
            map_name='Arabia',
            max_players=4,
        )
        assert game.name == 'Test Game'
        assert game.status == 'waiting'
        assert game.player_count == 0

    def test_game_str_representation(self):
        """Test game string representation"""
        game = Game.objects.create(
            name='Test Game',
            map_name='Arabia',
            max_players=4,
        )
        assert str(game) == 'Test Game'


@pytest.mark.django_db
class TestPlayerModel:
    """Test Player model"""

    def test_create_player(self, user):
        """Test creating a player instance"""
        game = Game.objects.create(
            name='Test Game',
            map_name='Arabia',
            max_players=4,
        )
        player = Player.objects.create(
            user=user,
            game=game,
            civilization='Britons',
        )
        assert player.user == user
        assert player.game == game
        assert player.civilization == 'Britons'
        assert player.is_ready is False
