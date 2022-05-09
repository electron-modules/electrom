import { EOL } from 'os';
import path from 'path';
import { exec } from 'child_process';

// modified from https://github.com/microsoft/vscode/blob/master/src/vs/base/node/ps.ts

export interface ProcessItem {
  cmd: string;
  pid: number;
  ppid?: number;
  load?: number;
  mem?: number;

  children?: ProcessItem[];
}

function calculateLinuxCpuUsage() { }

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
      getWindowsProcessList(rootPid)
        .then((processList) => {
          processList.forEach((item) => {
            if (item) {
              processMap.set(item.pid, {
                cmd: item.cmd,
                pid: item.pid,
              });
            }
          });
          resolve(processMap);
        })
        .catch((err) => {
          reject(err);
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
          exec(
            `${ps} ${args}`,
            { maxBuffer: 1000 * 1024, env: { LANG: 'en_US.UTF-8', LC_NUMERIC: 'en_US.UTF-8' }, encoding: 'utf-8' },
            (err, stdout, stderr) => {
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
            },
          );
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

type WindowsProcess = { pid: number; cmd: string } | null;

const getWindowsPsCodeWithChild = (rootPid: number) => `
$OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding;
function Get-ChildProcesses ($ParentProcessId) {
    $filter = "parentprocessid = '$($ParentProcessId)'"
    Get-CIMInstance -ClassName Win32_Process -filter $filter | Foreach-Object {
        $_
        if ($_.ParentProcessId -ne $_.ProcessId) {
            Get-ChildProcesses $_.ProcessId
        }
    }
}
Get-ChildProcesses ${rootPid} | Select ProcessId, CommandLine | out-string -Width 1000
`;

function getWindowsProcessList(rootPid: number) {
  const PROCESS_REGEX = /(\d*)\s?(.*)?/;
  const outputFormatter = (output: string) => {
    const dataList = output.trim().split(EOL).slice(2);
    return dataList
      .map((item) => item.trim())
      .map((item) => item.match(PROCESS_REGEX))
      .map((item) => item && { pid: Number(item[1]), cmd: item[2] })
      .filter(Boolean);
  };

  const processListPromise = new Promise<WindowsProcess[]>((resolve, reject) => {
    exec(`
      $OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding;
      Get-CIMInstance -ClassName win32_process -filter "processid = ${rootPid}" | Select ProcessId, CommandLine | out-string -Width 1000`,
    { shell: 'powershell.exe' },
    (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }

      if (stderr) {
        console.error(stderr);
      }

      try {
        resolve(outputFormatter(stdout));
      } catch (parseError) {
        reject(parseError);
      }
    },
    );
  });

  const childProcessListPromise = new Promise<WindowsProcess[]>((resolve, reject) => {
    exec(getWindowsPsCodeWithChild(rootPid), { shell: 'powershell.exe' }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }

      if (stderr) {
        console.error(stderr);
      }

      try {
        resolve(outputFormatter(stdout));
      } catch (parseError) {
        reject(parseError);
      }
    });
  });

  return Promise.all([processListPromise, childProcessListPromise]).then((arr) => arr.flat());
}
