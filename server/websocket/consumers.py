import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from api.models import Game, Player


class GameConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time game updates
    """

    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.game_group_name = f'game_{self.game_id}'

        # Join game group
        await self.channel_layer.group_add(
            self.game_group_name,
            self.channel_name
        )

        await self.accept()

        # Send current game state
        game_state = await self.get_game_state()
        await self.send(text_data=json.dumps({
            'type': 'game_state',
            'data': game_state
        }))

    async def disconnect(self, close_code):
        # Leave game group
        await self.channel_layer.group_discard(
            self.game_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
            return

        message_type = data.get('type')

        # Validate user is authenticated
        if not self.scope.get('user') or not self.scope['user'].is_authenticated:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Authentication required'
            }))
            return

        # Validate user is part of this game
        is_player = await self.validate_player_in_game()
        if not is_player:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'You are not a player in this game'
            }))
            return

        # Route message to appropriate handler
        if message_type == 'unit_command':
            await self.handle_unit_command(data)
        elif message_type == 'build_command':
            await self.handle_build_command(data)
        elif message_type == 'research_tech':
            await self.handle_research_command(data)
        elif message_type == 'chat_message':
            await self.handle_chat_message(data)
        else:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Unknown message type: {message_type}'
            }))

    async def handle_unit_command(self, data):
        """Handle unit movement/action commands"""
        # Broadcast to all players in the game
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'unit_update',
                'data': data
            }
        )

    async def handle_build_command(self, data):
        """Handle building construction commands"""
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'building_update',
                'data': data
            }
        )

    async def handle_chat_message(self, data):
        """Handle chat messages"""
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'chat_message',
                'username': self.scope['user'].username,
                'message': data.get('message')
            }
        )

    # Message handlers
    async def unit_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'unit_update',
            'data': event['data']
        }))

    async def building_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'building_update',
            'data': event['data']
        }))

    async def handle_research_command(self, data):
        """Handle technology research commands"""
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'research_update',
                'data': data
            }
        )

    async def research_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'research_update',
            'data': event['data']
        }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'username': event['username'],
            'message': event['message']
        }))

    @database_sync_to_async
    def validate_player_in_game(self):
        """Check if the current user is a player in this game"""
        try:
            game = Game.objects.get(id=self.game_id)
            user = self.scope.get('user')
            if not user or not user.is_authenticated:
                return False
            return game.players.filter(user=user).exists()
        except Game.DoesNotExist:
            return False

    @database_sync_to_async
    def get_game_state(self):
        """Get current game state from database"""
        try:
            game = Game.objects.get(id=self.game_id)
            return {
                'id': game.id,
                'name': game.name,
                'status': game.status,
                'players': [
                    {
                        'id': p.id,
                        'username': p.user.username,
                        'civilization': p.civilization,
                        'color': p.color,
                        'resources': {
                            'food': p.food,
                            'wood': p.wood,
                            'gold': p.gold,
                            'stone': p.stone
                        }
                    }
                    for p in game.players.all()
                ]
            }
        except Game.DoesNotExist:
            return None


class LobbyConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for lobby updates
    """

    async def connect(self):
        self.lobby_group_name = 'lobby'

        # Join lobby group
        await self.channel_layer.group_add(
            self.lobby_group_name,
            self.channel_name
        )

        await self.accept()

        # Send current available games
        games = await self.get_available_games()
        await self.send(text_data=json.dumps({
            'type': 'available_games',
            'data': games
        }))

    async def disconnect(self, close_code):
        # Leave lobby group
        await self.channel_layer.group_discard(
            self.lobby_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Handle incoming lobby messages"""
        pass

    async def game_created(self, event):
        """Notify when a new game is created"""
        await self.send(text_data=json.dumps({
            'type': 'game_created',
            'data': event['data']
        }))

    async def game_updated(self, event):
        """Notify when a game is updated"""
        await self.send(text_data=json.dumps({
            'type': 'game_updated',
            'data': event['data']
        }))

    @database_sync_to_async
    def get_available_games(self):
        """Get list of available games"""
        games = Game.objects.filter(status='waiting')
        return [
            {
                'id': game.id,
                'name': game.name,
                'players': game.player_count,
                'max_players': game.max_players,
                'status': game.status
            }
            for game in games
        ]
