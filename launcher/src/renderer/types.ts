export interface Game {
  id: string;
  name: string;
  genre: string;
  icon: string;
  isOptimized: boolean;
  baseFps: number;
  optimizedFps: number;
  currentFps?: number;
  lastOptimized?: string;
  exePath: string;
}

export interface SystemStats {
  cpuUsage: number;
  gpuUsage: number;
  ramUsage: number; // in %
  ramTotal: number; // in GB
  fps: number;
  tempCpu: number;
  tempGpu: number;
  ping: number;
}

export interface CrashLogTemplate {
  id: string;
  gameName: string;
  errorTitle: string;
  rawLog: string;
}

export interface OptimizationResponse {
  success: boolean;
  analysis: string;
  steps: string[];
  safeCommands?: string[];
}
