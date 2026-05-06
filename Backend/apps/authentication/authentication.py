from urllib.parse import urlparse

import requests

from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User
from django.conf import settings


class API3MAuthBackend(ModelBackend):
    """
    Custom authentication backend that validates user credentials
    via the external API3M service and synchronizes user information
    in the local Django database.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username or not password:
            return None

        api3m_url = getattr(settings, "API3M_URL", "").rstrip("/")
        api3m_token = getattr(settings, "API3M_TOKEN", None)

        if not api3m_url or not api3m_token:
            return None

        parsed_url = urlparse(api3m_url)
        if not parsed_url.scheme:
            api3m_url = f"https://{api3m_url}"

        api_url = f"{api3m_url}/api/authenticate-gia/"
        headers = {"Authorization": f"Token {api3m_token}"}
        payload = {"user": username, "password": password}

        try:
            response = requests.post(api_url, json=payload, headers=headers, timeout=10, verify=False)
            response.raise_for_status()
            data = response.json()
        except (requests.RequestException, ValueError):
            return None

        if not data.get("success"):
            return None

        user_info = data.get("user_info") or {}
        uid = user_info.get("uid")
        if not uid:
            return None

        user, created = User.objects.get_or_create(username=uid)

        updated = False
        for field, api_field in [
            ("first_name", "givenName"),
            ("last_name", "sn"),
            ("email", "mail"),
        ]:
            new_value = user_info.get(api_field)
            if new_value and getattr(user, field) != new_value:
                setattr(user, field, new_value)
                updated = True

        if updated:
            user.save(update_fields=["first_name", "last_name", "email"])

        return user