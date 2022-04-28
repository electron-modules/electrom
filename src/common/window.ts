import type { Shell } from 'electron/common';

export interface PreloadElectron {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => void;
    on: (channel: string, listener: any) => void;
    removeListener: (channel: string, listener: any) => void;
  };
  shell: Shell;
}
