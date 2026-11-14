export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface HealthCheckData {
  status: string;
  uptimeSeconds: number;
  database: {
    status: string;
    latencyMs: number;
  };
  system: {
    memoryHeapUsedMB: number;
    nodeVersion: string;
  };
}
