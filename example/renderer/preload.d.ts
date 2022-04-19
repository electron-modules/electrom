import { Shell } from 'electron';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send: (channel: string, ...args: any[]) => void;
        on: (channel: string, listener: any) => void;
        removeListener: (channel: string, listener: any) => void;
      };
      shell: Shell;
    };
  }
}

export {};
