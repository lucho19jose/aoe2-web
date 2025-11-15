from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Game, Player
from .serializers import GameSerializer, PlayerSerializer


class GameViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing game sessions
    """
    queryset = Game.objects.all().order_by('-created_at')
    serializer_class = GameSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def available(self, request):
        """List available games to join"""
        games = Game.objects.filter(status='waiting').order_by('-created_at')
        serializer = self.get_serializer(games, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Join a game"""
        game = self.get_object()

        if game.status != 'waiting':
            return Response(
                {'error': 'Game is not accepting players'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if game.player_count >= game.max_players:
            return Response(
                {'error': 'Game is full'},
                status=status.HTTP_400_BAD_REQUEST
            )

        player, created = Player.objects.get_or_create(
            user=request.user,
            game=game,
            defaults={'civilization': 'Random'}
        )

        if not created:
            return Response(
                {'error': 'Already in this game'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(game)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Leave a game"""
        game = self.get_object()
        try:
            player = Player.objects.get(user=request.user, game=game)
            player.delete()
            return Response({'status': 'left game'})
        except Player.DoesNotExist:
            return Response(
                {'error': 'Not in this game'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start a game"""
        game = self.get_object()

        if game.status != 'waiting':
            return Response(
                {'error': 'Game already started'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if game.player_count < 2:
            return Response(
                {'error': 'Need at least 2 players'},
                status=status.HTTP_400_BAD_REQUEST
            )

        game.status = 'starting'
        game.save()

        serializer = self.get_serializer(game)
        return Response(serializer.data)


class PlayerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing players
    """
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter to only show current user's players"""
        return Player.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def ready(self, request, pk=None):
        """Mark player as ready"""
        player = self.get_object()
        player.is_ready = True
        player.save()
        serializer = self.get_serializer(player)
        return Response(serializer.data)
