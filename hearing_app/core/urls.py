from django.urls import path, re_path
from django.views.generic import TemplateView
from .views import save_results, get_test_results, get_patient_tests, get_calibration

urlpatterns = [
    path('api/save-results/', save_results, name='save_results'),
    path('api/results/<int:test_id>/', get_test_results, name='get_test_results'),
    path('api/patient-tests/', get_patient_tests, name='get_patient_tests'),
    # re_path(r'^.*', TemplateView.as_view(template_name='index.html')),
    path('api/calibration/', get_calibration, name='get_calibration'),
]
