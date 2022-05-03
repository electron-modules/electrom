export const isWindows = () => window.navigator.platform.toLowerCase() === 'win32';

// 提取双引号的内容
const PROCESS_REGEX = /"?([^"]*)"?/;

/**
 * 获取进程 cmd 的简易信息
 */
export const findName = (cmd?: string, startIndex = 0): string => {
  if (!cmd) {
    return '';
  }
  const index = cmd.indexOf(' -');
  const end = index !== -1 ? index : cmd.length;
  if (startIndex > 0) {
    return `...${cmd.substring(startIndex + 1, end)}`;
  }
  const simplePath = cmd.substring(0, end);
  const matched = simplePath.match(PROCESS_REGEX);
  if (matched) {
    return matched[1];
  }
  return simplePath;
};

/**
 * 找出相同的字符串
 */
const findCommonString = (str1?: string, str2?: string) => {
  let index = -1;
  if (typeof str1 !== 'string' || typeof str2 !== 'string') {
    return index;
  }

  const minLen = Math.min(str1.length, str2.length);
  for (let i = 0; i < minLen; ++i) {
    if (str1[i] === str2[i]) {
      index = i;
    } else {
      break;
    }
  }
  return index;
};

/**
 * 从多个字符串中找到相同字符串
 */
export const findCommonStringPlus = (strs: string[]) => {
  if (strs.length < 2) {
    return -1;
  }

  const indexes = [];
  for (let i = 1; i < strs.length; i++) {
    indexes.push(findCommonString(strs[i - 1], strs[i]));
  }
  return Math.min(...indexes);
};
