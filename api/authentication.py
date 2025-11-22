from typing import Optional, Tuple

from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

from .models import MemberToken


class MemberTokenAuthentication(BaseAuthentication):
    keyword = b"Token"

    def authenticate(self, request) -> Optional[Tuple[object, None]]:
        auth = get_authorization_header(request).split()

        if not auth or auth[0].lower() != self.keyword.lower():
            return None

        if len(auth) == 1:
            raise AuthenticationFailed(
                "Недействительный заголовок авторизации. Токен не найден."
            )
        if len(auth) > 2:
            raise AuthenticationFailed(
                "Недействительный заголовок авторизации. Токен должен состоять из одного слова."
            )

        try:
            key = auth[1].decode("utf-8")
        except UnicodeError as exc:  # noqa: F841
            raise AuthenticationFailed("Недействительный токен.")

        try:
            member_token = MemberToken.objects.select_related("member").get(key=key)
        except MemberToken.DoesNotExist:
            raise AuthenticationFailed("Недействительный или просроченный токен.")

        return member_token.member, None
