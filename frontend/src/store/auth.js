import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null);
  const user = ref(null);

  function setToken(newToken) {
    token.value = newToken;
    localStorage.setItem('token', newToken);
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
  }

  async function fetchMe() {
    const { data } = await api.get('/auth/me');
    user.value = data;
  }

  return { token, user, setToken, logout, fetchMe };
});
