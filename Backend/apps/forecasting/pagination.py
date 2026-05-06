from rest_framework.pagination import PageNumberPagination


class ForecastPagination(PageNumberPagination):
    """Pagination dédiée à la liste des Forecast.

    - `page_size` : 20 par défaut (compromis lisible / nombre de requêtes).
    - `page_size_query_param` : permet au frontend de surcharger via
      `?page_size=50` (utile pour un export-style « tout charger »).
    - `max_page_size` : plafonne à 100 pour éviter qu'un client demande
      `?page_size=100000` et fasse exploser la mémoire serveur.
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
