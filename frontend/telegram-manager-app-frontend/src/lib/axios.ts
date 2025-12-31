// src/lib/axios.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag để tránh refresh token loop
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

// Request Interceptor: Tự động gắn accessToken vào header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('accessToken');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Tự động refresh token khi 401
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu đang refresh thì đưa request vào queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = Cookies.get('refreshToken');

      if (!refreshToken) {
        // Không có refresh token → logout
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Gọi API refresh token
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          { refreshToken }
        );

        if (response.data.success) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          // Lưu token mới
          Cookies.set('accessToken', accessToken, { expires: 1 });
          Cookies.set('refreshToken', newRefreshToken, { expires: 7 });

          // Update header cho request hiện tại
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          // Process queue
          processQueue();
          isRefreshing = false;

          // Retry request gốc
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token thất bại → logout
        processQueue(refreshError);
        isRefreshing = false;
        
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;