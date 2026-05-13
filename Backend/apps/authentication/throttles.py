from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """Limite les tentatives de connexion à 5/min par IP (anti brute-force).
    """

    scope = "login"
