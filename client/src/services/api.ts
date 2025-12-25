import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5000", // backend
});

// Her isteğe token ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
