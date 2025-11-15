from django.contrib import admin
from .models import Game, Player


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'player_count', 'max_players', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name']


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ['user', 'game', 'civilization', 'team', 'is_ready', 'population']
    list_filter = ['civilization', 'is_ready', 'joined_at']
    search_fields = ['user__username', 'game__name']
