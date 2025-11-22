import api from './tokenInterceptor';

export const getMessages = async () => {
  const response = await api.get('/api/chat/messages/');
  return response.data; // ChatMessage[]
};

export const sendMessage = async (text) => {
  const response = await api.post('/api/chat/messages/', { text });
  return response.data; // created ChatMessage
};
