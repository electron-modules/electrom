export interface ProcessInfo {
  cmd: string;
  cpu: {
    percentCPUUsage: number;
    idleWakeupsPerSecond: number;
  };
  creationTime: number;
  load: number;
  memory: {
    workingSetSize: number;
    peakWorkingSetSize: number;
  };
  pid: number;
  sandboxed: boolean;
  type: string;
  webContentInfo?: {
    id: number;
    pid: number;
    type: string;
    url: string;
  };
}
