from django.urls import path

from .views import (
    HelloView,
    RegisterView,
    LoginView,
    MeView,
    ChatMessageListCreateView,
)


urlpatterns = [
    path("hello/", HelloView.as_view(), name="hello"),
    path("members/register/", RegisterView.as_view(), name="member-register"),
    path("members/login/", LoginView.as_view(), name="member-login"),
    path("members/me/", MeView.as_view(), name="member-me"),
    path("chat/messages/", ChatMessageListCreateView.as_view(), name="chat-messages"),
]
