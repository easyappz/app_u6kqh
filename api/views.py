from django.contrib.auth.hashers import check_password
from django.utils import timezone

from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import MemberTokenAuthentication
from .models import Member, ChatMessage, MemberToken
from .serializers import (
    MessageSerializer,
    MemberSerializer,
    RegisterSerializer,
    LoginSerializer,
    ChatMessageSerializer,
)


class HelloView(APIView):
    """A simple API endpoint that returns a greeting message."""

    @extend_schema(
        responses={200: MessageSerializer},
        description="Get a hello world message",
    )
    def get(self, request):
        data = {"message": "Hello!", "timestamp": timezone.now()}
        serializer = MessageSerializer(data)
        return Response(serializer.data)


class RegisterView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member = serializer.save()

        token, _ = MemberToken.objects.get_or_create(member=member)

        return Response(
            {
                "token": token.key,
                "member": MemberSerializer(member).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]

        try:
            member = Member.objects.get(username=username)
        except Member.DoesNotExist:
            return Response(
                {"detail": "Неверный логин или пароль."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not check_password(password, member.password):
            return Response(
                {"detail": "Неверный логин или пароль."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token, _ = MemberToken.objects.get_or_create(member=member)

        return Response(
            {
                "token": token.key,
                "member": MemberSerializer(member).data,
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    authentication_classes = (MemberTokenAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        member = request.user
        return Response(MemberSerializer(member).data)


class ChatMessageListCreateView(generics.ListCreateAPIView):
    authentication_classes = (MemberTokenAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ChatMessageSerializer
    queryset = ChatMessage.objects.select_related("author").all()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
