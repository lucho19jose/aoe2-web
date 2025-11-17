from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'games', views.GameViewSet, basename='game')
router.register(r'players', views.PlayerViewSet, basename='player')

urlpatterns = [
    # Health check endpoints
    path('health/', views.health_check, name='health-check'),
    path('ready/', views.readiness_check, name='readiness-check'),

    # API endpoints
    path('', include(router.urls)),
    path('auth/', include('rest_framework.urls')),
]
