export interface ProcessInfo {
  cmd?: string;
  sandboxed?: boolean;
  cpu: {
    percentCPUUsage: number;
    idleWakeupsPerSecond: number;
  };
  creationTime: number;
  memory: {
    workingSetSize: number;
    peakWorkingSetSize: number;
  };
  pid: number;
  type: string;
  webContentInfo?: {
    id: number;
    pid: number;
    type: string;
    url: string;
  };
}
