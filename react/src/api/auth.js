import api from './tokenInterceptor';

export const register = async ({ username, password }) => {
  const response = await api.post('/api/members/register/', {
    username,
    password,
  });
  return response.data; // { token, member }
};

export const login = async ({ username, password }) => {
  const response = await api.post('/api/members/login/', {
    username,
    password,
  });
  return response.data; // { token, member }
};

export const getCurrentMember = async () => {
  const response = await api.get('/api/members/me/');
  return response.data; // Member object
};
