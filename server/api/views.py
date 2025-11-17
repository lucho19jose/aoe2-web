from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import connection
from django.core.cache import cache
from django.conf import settings
import redis
import logging

from .models import Game, Player
from .serializers import GameSerializer, PlayerSerializer

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Basic health check endpoint - returns 200 if service is up
    """
    return Response({
        'status': 'healthy',
        'service': 'aoe2-web-api',
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def readiness_check(request):
    """
    Readiness check - verifies all dependencies are available
    Checks: Database, Redis, Cache
    """
    checks = {
        'database': False,
        'redis': False,
        'cache': False,
    }

    all_healthy = True

    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks['database'] = True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        all_healthy = False

    # Check Redis connection
    try:
        redis_client = redis.Redis(
            host=settings.CHANNEL_LAYERS['default']['CONFIG']['hosts'][0][0],
            port=settings.CHANNEL_LAYERS['default']['CONFIG']['hosts'][0][1],
            socket_connect_timeout=2
        )
        redis_client.ping()
        checks['redis'] = True
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        all_healthy = False

    # Check cache
    try:
        cache.set('health_check', 'ok', 10)
        if cache.get('health_check') == 'ok':
            checks['cache'] = True
        else:
            all_healthy = False
    except Exception as e:
        logger.error(f"Cache health check failed: {e}")
        all_healthy = False

    response_data = {
        'status': 'ready' if all_healthy else 'not_ready',
        'checks': checks,
    }

    return Response(
        response_data,
        status=status.HTTP_200_OK if all_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    )


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
