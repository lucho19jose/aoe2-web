from rest_framework import serializers
from .models import Game, Player
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class PlayerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Player
        fields = [
            'id', 'user', 'civilization', 'color', 'team',
            'is_ready', 'food', 'wood', 'gold', 'stone',
            'population', 'max_population', 'joined_at'
        ]


class GameSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, read_only=True)
    player_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Game
        fields = [
            'id', 'name', 'status', 'max_players', 'player_count',
            'map_size', 'created_at', 'started_at', 'finished_at', 'players'
        ]
