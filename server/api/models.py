from django.db import models
from django.contrib.auth.models import User


class Game(models.Model):
    """Represents a game session"""
    STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('starting', 'Starting'),
        ('in_progress', 'In Progress'),
        ('finished', 'Finished'),
    ]

    name = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    max_players = models.IntegerField(default=8)
    map_size = models.CharField(max_length=20, default='medium')
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.status})"

    @property
    def player_count(self):
        return self.players.count()


class Player(models.Model):
    """Represents a player in a game"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='game_players')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='players')
    civilization = models.CharField(max_length=50, default='Random')
    color = models.CharField(max_length=7, default='#FF0000')
    team = models.IntegerField(default=0)
    is_ready = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    # Game state
    food = models.IntegerField(default=200)
    wood = models.IntegerField(default=200)
    gold = models.IntegerField(default=100)
    stone = models.IntegerField(default=100)
    population = models.IntegerField(default=3)
    max_population = models.IntegerField(default=200)

    class Meta:
        unique_together = ['user', 'game']

    def __str__(self):
        return f"{self.user.username} in {self.game.name}"
