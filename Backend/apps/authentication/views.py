import requests

from django.contrib.auth.models import User

from apps.authentication.serializers import UserSerializer

from core.settings import OIDC_TOKEN_CHECK_ENDPOINT

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken


class OIDCView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token missing'}, status=status.HTTP_400_BAD_REQUEST)

        user_info = self.get_user_info(token)
        if not user_info:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

        user = self.get_or_create_user(user_info)
        if not user:
            return Response({'error': 'User creation failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        refresh = RefreshToken.for_user(User.objects.get(username=user))

        return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                })

    def get_user_info(self, token):
        try:
            response = requests.get(
                OIDC_TOKEN_CHECK_ENDPOINT,
                headers={'Authorization': f'Bearer {token}'},
                verify=False
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            error_message = f"Erreur lors de la récupération des infos utilisateur : {e}"
            return {'error': error_message}


    def get_or_create_user(self, user_info):
        username = user_info.get('preferred_username', '').lower()
        email = user_info.get('email', '')
        full_name = user_info.get('name', '')
        first_name = user_info.get('given_name', '')
        last_name = user_info.get('family_name', '')

        if not username:
            return None

        user = User.objects.filter(username__iexact=username).first()

        if user:
            user.first_name = first_name
            user.last_name = last_name
            user.email = email
            user.save()
        else:
            user = User.objects.create_user(username=username, email=email, first_name=first_name, last_name=last_name)

        return user


class UserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
