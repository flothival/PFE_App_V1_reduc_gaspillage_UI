from django.urls import path

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .throttles import LoginRateThrottle
from .views import UserView, OIDCView


class ThrottledTokenObtainPairView(TokenObtainPairView):
    #Login user/password avec rate limiting (5/min/IP)

    throttle_classes = [LoginRateThrottle]


urlpatterns = [
    path("token/", ThrottledTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("user/", UserView.as_view(), name="user"),
    path("oidc/", OIDCView.as_view(), name="oidc"),
]