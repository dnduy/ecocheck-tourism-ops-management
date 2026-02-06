import { User } from '../types';

let authToken: string | null = null;
let currentUser: User | null = null;

export const authStore = {
  setAuth(token: string, user: User) {
    authToken = token;
    currentUser = user;
  },
  setToken(token: string | null) {
    authToken = token;
  },
  setUser(user: User | null) {
    currentUser = user;
  },
  getToken(): string | null {
    return authToken;
  },
  getUser(): User | null {
    return currentUser;
  },
  clear() {
    authToken = null;
    currentUser = null;
  }
};
