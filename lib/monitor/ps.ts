import path from 'path';
import { exec } from 'child_process';

// modified from https://github.com/microsoft/vscode/blob/master/src/vs/base/node/ps.ts

export interface ProcessItem {
  cmd: string;
  pid: number;
  ppid: number;
  load: number;
  mem: number;

  children?: ProcessItem[];
}

function calculateLinuxCpuUsage() {}

export function listProcesses(rootPid: number): Promise<Map<number, ProcessItem>> {
  return new Promise((resolve, reject) => {
    const processMap = new Map<number, ProcessItem>();

    function addToMap(pid: number, ppid: number, cmd: string, load: number, mem: number) {
      const item = {
        cmd,
        pid,
        ppid,
        load,
        mem,
      };
      processMap.set(pid, item);
    }

    if (process.platform === 'win32') {
      const cleanUNCPrefix = (value: string): string => {
        if (value.indexOf('\\\\?\\') === 0) {
          return value.substr(4);
        } else if (value.indexOf('\\??\\') === 0) {
          return value.substr(4);
        } else if (value.indexOf('"\\\\?\\') === 0) {
          return '"' + value.substr(5);
        } else if (value.indexOf('"\\??\\') === 0) {
          return '"' + value.substr(5);
        }
        return value;
      };

      require('windows-process-tree').then((windowsProcessTree: any) => {
        windowsProcessTree.getProcessList(
          rootPid,
          (processList: any[]) => {
            windowsProcessTree.getProcessCpuUsage(processList, (completeProcessList: any[]) => {
              completeProcessList.forEach((process: any) => {
                const commandLine = cleanUNCPrefix(process.commandLine || '');
                processMap.set(process.pid, {
                  cmd: commandLine,
                  pid: process.pid,
                  ppid: process.ppid,
                  load: process.cpu || 0,
                  mem: process.memory || 0,
                });
              });

              resolve(processMap);
            });
          },
          windowsProcessTree.ProcessDataFlag.CommandLine | windowsProcessTree.ProcessDataFlag.Memory
        );
      });
    } else {
      // OS X & Linux
      exec('which ps', {}, (err, stdout, stderr) => {
        if (err || stderr) {
          if (process.platform !== 'linux') {
            reject(err || new Error(stderr.toString()));
          } else {
            const cmd = JSON.stringify(path.join(__dirname, './ps.sh', require as any));
            exec(cmd, {}, (err, stdout, stderr) => {
              if (err || stderr) {
                reject(err || new Error(stderr.toString()));
              } else {
                parsePsOutput(stdout, addToMap);
                calculateLinuxCpuUsage();
              }
            });
          }
        } else {
          const ps = stdout.toString().trim();
          const args = '-ax -o pid=,ppid=,pcpu=,pmem=,command=';

          // Set numeric locale to ensure '.' is used as the decimal separator
          exec(`${ps} ${args}`, { maxBuffer: 1000 * 1024, env: { LC_NUMERIC: 'en_US.UTF-8' } }, (err, stdout, stderr) => {
            // Silently ignoring the screen size is bogus error. See https://github.com/microsoft/vscode/issues/98590
            if (err || (stderr && !stderr.includes('screen size is bogus'))) {
              reject(err || new Error(stderr.toString()));
            } else {
              parsePsOutput(stdout, addToMap);

              if (process.platform === 'linux') {
                calculateLinuxCpuUsage();
              } else {
                resolve(processMap);
              }
            }
          });
        }
      });
    }
  });
}

function parsePsOutput(stdout: string, addToTree: (pid: number, ppid: number, cmd: string, load: number, mem: number) => void): void {
  const PID_CMD = /^\s*([0-9]+)\s+([0-9]+)\s+([0-9]+\.[0-9]+)\s+([0-9]+\.[0-9]+)\s+(.+)$/;
  const lines = stdout.toString().split('\n');
  for (const line of lines) {
    const matches = PID_CMD.exec(line.trim());
    if (matches && matches.length === 6) {
      addToTree(parseInt(matches[1]), parseInt(matches[2]), matches[5], parseFloat(matches[3]), parseFloat(matches[4]));
    }
  }
}
