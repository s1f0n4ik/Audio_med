from django.urls import path, re_path
from django.views.generic import TemplateView
from .views import save_results

urlpatterns = [
    path('api/save-results/', save_results, name='analyze_audio'),
    re_path(r'^.*', TemplateView.as_view(template_name='index.html')),  # Для React Router
]
