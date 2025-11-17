from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from . import auth_views

router = DefaultRouter()
router.register(r'games', views.GameViewSet, basename='game')
router.register(r'players', views.PlayerViewSet, basename='player')

urlpatterns = [
    path('', include(router.urls)),

    # Authentication endpoints
    path('auth/register/', auth_views.RegisterView.as_view(), name='register'),
    path('auth/login/', auth_views.LoginView.as_view(), name='login'),
    path('auth/logout/', auth_views.logout_view, name='logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', auth_views.CurrentUserView.as_view(), name='current_user'),

    # Health check
    path('health/', auth_views.health_check, name='health'),
]
