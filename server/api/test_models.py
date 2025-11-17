"""
Tests for the API models.
"""
import pytest
from django.contrib.auth.models import User
from api.models import Game, Player


@pytest.mark.django_db
class TestGameModel:
    """Test cases for the Game model."""

    def test_create_game(self):
        """Test creating a game."""
        game = Game.objects.create(
            name='Test Game',
            max_players=4,
            map_size='large'
        )
        assert game.name == 'Test Game'
        assert game.status == 'waiting'
        assert game.max_players == 4
        assert game.map_size == 'large'

    def test_game_str_representation(self):
        """Test game string representation."""
        game = Game.objects.create(name='My Game')
        assert str(game) == 'My Game (waiting)'

    def test_player_count_property(self):
        """Test player_count property."""
        game = Game.objects.create(name='Test Game')
        user1 = User.objects.create_user(username='player1', password='pass123')
        user2 = User.objects.create_user(username='player2', password='pass123')

        Player.objects.create(user=user1, game=game)
        Player.objects.create(user=user2, game=game)

        assert game.player_count == 2


@pytest.mark.django_db
class TestPlayerModel:
    """Test cases for the Player model."""

    def test_create_player(self):
        """Test creating a player."""
        user = User.objects.create_user(username='testplayer', password='pass123')
        game = Game.objects.create(name='Test Game')

        player = Player.objects.create(
            user=user,
            game=game,
            civilization='Britons',
            color='#0000FF',
            team=1
        )

        assert player.user == user
        assert player.game == game
        assert player.civilization == 'Britons'
        assert player.color == '#0000FF'
        assert player.team == 1
        assert player.is_ready is False

    def test_player_str_representation(self):
        """Test player string representation."""
        user = User.objects.create_user(username='testplayer', password='pass123')
        game = Game.objects.create(name='Test Game')
        player = Player.objects.create(user=user, game=game)

        assert str(player) == 'testplayer in Test Game'

    def test_player_default_resources(self):
        """Test player default resources."""
        user = User.objects.create_user(username='testplayer', password='pass123')
        game = Game.objects.create(name='Test Game')
        player = Player.objects.create(user=user, game=game)

        assert player.food == 200
        assert player.wood == 200
        assert player.gold == 100
        assert player.stone == 100
        assert player.population == 3
        assert player.max_population == 200

    def test_unique_user_per_game(self):
        """Test that a user can only join a game once."""
        user = User.objects.create_user(username='testplayer', password='pass123')
        game = Game.objects.create(name='Test Game')

        Player.objects.create(user=user, game=game)

        # Attempting to create a duplicate should raise an error
        with pytest.raises(Exception):
            Player.objects.create(user=user, game=game)
