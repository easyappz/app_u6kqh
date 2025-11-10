# Инструкция по реализации регистрации/авторизации

## 1. Архитектура системы аутентификации

### Важные принципы:

- **Стандартная модель User Django используется ТОЛЬКО для доступа к админ-панели**
- **Все пользователи приложения хранятся в отдельной модели Member**
- **Member не связана с системой аутентификации Django через AUTH_USER_MODEL**
- **Member - это полностью независимая модель с собственными полями email, password и др.**

### Структура моделей:

```python
# api/models.py
from django.db import models
from django.contrib.auth.hashers import make_password, check_password

class Member(models.Model):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)  # Хешированный пароль
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def set_password(self, raw_password):
        self.password = make_password(raw_password)
    
    def check_password(self, raw_password):
        return check_password(raw_password, self.password)
```

---

## 2. Процесс регистрации

### Эндпоинт:
```
POST /api/register/
```

### Обязательные поля:
- `email` - Email пользователя (должен быть уникальным)
- `username` - Имя пользователя (должно быть уникальным)
- `password` - Пароль (минимум 8 символов)
- `first_name` - Имя (опционально)
- `last_name` - Фамилия (опционально)

### Пример запроса:
```json
{
  "email": "user@example.com",
  "username": "john_doe",
  "password": "SecurePass123",
  "first_name": "Иван",
  "last_name": "Петров"
}
```

### Пример ответа (успех):
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "member": {
    "id": 1,
    "email": "user@example.com",
    "username": "john_doe",
    "first_name": "Иван",
    "last_name": "Петров"
  }
}
```

### Пример ответа (ошибка):
```json
{
  "email": ["Пользователь с таким email уже существует"]
}
```

---

## 3. Процесс авторизации (Login)

### Эндпоинт:
```
POST /api/login/
```

### Обязательные поля:
- `email` - Email пользователя
- `password` - Пароль

### Пример запроса:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### Пример ответа (успех):
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "member": {
    "id": 1,
    "email": "user@example.com",
    "username": "john_doe",
    "first_name": "Иван",
    "last_name": "Петров"
  }
}
```

### Пример ответа (ошибка):
```json
{
  "detail": "Неверные учетные данные"
}
```

---

## 4. Управление токенами (JWT)

### Структура токенов:

**Access Token (токен доступа)**:
- Срок жизни: 60 минут
- Используется для доступа к защищенным эндпоинтам
- Содержит информацию: `member_id`, `email`

**Refresh Token (токен обновления)**:
- Срок жизни: 30 дней
- Используется для получения новых access токенов
- Хранится безопасно на фронтенде

### Обновление Access Token:

**Эндпоинт:**
```
POST /api/token/refresh/
```

**Пример запроса:**
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Пример ответа:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Хранение токенов на фронтенде:

```javascript
// После успешной авторизации/регистрации
localStorage.setItem('access_token', response.data.access);
localStorage.setItem('refresh_token', response.data.refresh);

// Получение токенов
const accessToken = localStorage.getItem('access_token');
const refreshToken = localStorage.getItem('refresh_token');

// Удаление токенов (logout)
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
```

---

## 5. Работа с защищенными эндпоинтами

### Требования:

Все защищенные эндпоинты требуют заголовок `Authorization` с JWT токеном.

### Формат заголовка:
```
Authorization: Bearer <access_token>
```

### Пример запроса (JavaScript):

```javascript
import axios from 'axios';

const accessToken = localStorage.getItem('access_token');

const response = await axios.get('/api/profile/', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### Пример запроса (axios instance):

```javascript
// src/api/axios.js
import axios from 'axios';

const instance = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Автоматическое добавление токена к каждому запросу
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
```

### Валидация токена на бэкенде:

Бэкенд извлекает токен из заголовка, декодирует его и получает `member_id`, затем загружает соответствующий объект `Member` из базы данных.

### Ответы при ошибках:

**401 Unauthorized** - токен невалиден или истек:
```json
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid",
  "messages": [
    {
      "token_class": "AccessToken",
      "token_type": "access",
      "message": "Token is invalid or expired"
    }
  ]
}
```

**403 Forbidden** - доступ запрещен:
```json
{
  "detail": "У вас недостаточно прав для выполнения данного действия."
}
```

---

## 6. Пример: Эндпоинт профиля

### Эндпоинт:
```
GET /api/profile/
```

### Требования:
- Заголовок `Authorization` с валидным access token

### Пример запроса:
```javascript
GET /api/profile/
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
```

### Пример ответа (успех):
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "john_doe",
  "first_name": "Иван",
  "last_name": "Петров",
  "created_at": "2025-11-10T12:00:00Z"
}
```

### Обновление профиля:
```
PUT /api/profile/
```

**Запрос:**
```json
{
  "first_name": "Иван",
  "last_name": "Сидоров",
  "username": "ivan_sidorov"
}
```

**Ответ:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "ivan_sidorov",
  "first_name": "Иван",
  "last_name": "Сидоров",
  "created_at": "2025-11-10T12:00:00Z"
}
```

---

## 7. Важные детали реализации на бэкенде

### Custom Authentication Backend:

```python
# api/authentication.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from .models import Member

class MemberJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        try:
            member_id = validated_token['member_id']
            member = Member.objects.get(id=member_id)
            return member
        except Member.DoesNotExist:
            raise InvalidToken('Member not found')
```

### Custom TokenObtainPairSerializer:

```python
# api/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Member

class MemberTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        try:
            member = Member.objects.get(email=email)
            if not member.check_password(password):
                raise serializers.ValidationError('Неверные учетные данные')
        except Member.DoesNotExist:
            raise serializers.ValidationError('Неверные учетные данные')
        
        # Создаем токены
        refresh = self.get_token(member)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'member': MemberSerializer(member).data
        }
    
    @classmethod
    def get_token(cls, member):
        token = super().get_token(member)
        token['member_id'] = member.id
        token['email'] = member.email
        return token
```

### Настройки в settings.py:

```python
# config/settings.py
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'member_id',
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'api.authentication.MemberJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}
```

### Views для защищенных эндпоинтов:

```python
# api/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    # request.user содержит объект Member
    member = request.user
    serializer = MemberSerializer(member)
    return Response(serializer.data)
```

---

## 8. Интеграция на фронтенде (React)

### Сохранение токенов после логина/регистрации:

```javascript
// src/api/auth.js
import axios from './axios';

export const login = async (email, password) => {
  const response = await axios.post('/api/login/', { email, password });
  
  // Сохраняем токены
  localStorage.setItem('access_token', response.data.access);
  localStorage.setItem('refresh_token', response.data.refresh);
  
  return response.data;
};

export const register = async (userData) => {
  const response = await axios.post('/api/register/', userData);
  
  // Сохраняем токены
  localStorage.setItem('access_token', response.data.access);
  localStorage.setItem('refresh_token', response.data.refresh);
  
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};
```

### Автоматическое добавление заголовка Authorization:

```javascript
// src/api/axios.js
import axios from 'axios';

const instance = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor для обработки ошибок и обновления токена
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Если получили 401 и это не повторный запрос
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post('/api/token/refresh/', {
          refresh: refreshToken
        });
        
        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);
        
        // Повторяем оригинальный запрос с новым токеном
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        // Если обновление токена не удалось - разлогиниваем
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default instance;
```

### Защита роутов (React Router):

```javascript
// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

### Процесс Logout:

```javascript
// В компоненте
import { logout } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const handleLogout = () => {
  logout();
  navigate('/login');
};
```

---

## 9. Практики безопасности

### Обязательные требования:

1. **Никогда не передавайте refresh token в URL** - только в теле запроса
2. **Используйте HTTPS в продакшене** - токены должны передаваться только по защищенному соединению
3. **Не храните пароли в открытом виде** - Django автоматически хеширует пароли через `make_password()`
4. **Валидируйте токены на каждом запросе** - проверяйте срок действия и подпись
5. **Очищайте токены при logout** - удаляйте из localStorage
6. **Используйте короткий срок жизни для access токенов** - рекомендуется 15-60 минут
7. **Не логируйте токены** - они не должны попадать в логи сервера
8. **Проверяйте силу паролей** - минимум 8 символов, комбинация букв и цифр

### Хеширование паролей:

```python
from django.contrib.auth.hashers import make_password, check_password

# При создании пользователя
member = Member(
    email=email,
    username=username,
    password=make_password(password)  # Хеширование
)
member.save()

# При проверке пароля
if check_password(raw_password, member.password):
    # Пароль верный
    pass
```

### Настройки CORS (если фронтенд на другом домене):

```python
# config/settings.py
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
]

CORS_ALLOW_CREDENTIALS = True
```

---

## Заключение

Данная система аутентификации использует JWT токены для авторизации пользователей приложения, которые хранятся в отдельной модели Member. Стандартная модель User Django используется исключительно для доступа администраторов к админ-панели.

Основные принципы:
- Member - независимая модель для пользователей приложения
- JWT токены в заголовке Authorization
- Access token для доступа к API
- Refresh token для обновления access token
- Автоматическая обработка истекших токенов на фронтенде