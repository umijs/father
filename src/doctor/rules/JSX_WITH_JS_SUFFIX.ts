import type { IApi } from '../../types';

/**
 * 增强型JSX正则检测（支持排除注释和字符串干扰）
 * @param {string} code 需要检测的代码
 * @returns {boolean} 是否包含JSX语法
 */
const hasJSX = (code: string) => {
  // 核心正则组合（含上下文排除）
  const patterns = {
    // 标准JSX元素：<Component> 或闭合标签 </>
    element: /<([A-Z][a-zA-Z0-9]*)(\s+[^>]*?)?>|<\/[A-Za-z]/,

    // JSX属性表达式：prop={value}
    attribute: /<\w+[^>]*\s\w+={[^}]+}/,

    // JSX内容表达式：{...}
    expression: /{(?![^{]*})([^{}]+)}/,

    // 注释排除：// /* ... */
    comment: /(\/\/.*|<!\-\-|\/\*[\s\S]*?\*\/)/g,

    // 字符串排除：单引号/双引号/模板字符串
    string: /(['"`])(?:\\.|(?!\1).)*?\1/g,
  };

  // 预处理：移除注释和字符串内容
  const cleanCode = code
    .replace(patterns.comment, '')
    .replace(patterns.string, (m) => ' '.repeat(m.length));

  // 执行复合检测
  return [patterns.element, patterns.attribute, patterns.expression].some(
    (regex) => regex.test(cleanCode),
  );
};

export default (api: IApi) => {
  api.addJSXSourceCheckup(({ file, content }) => {
    // 文件后缀名为 js 并且文件内容包含 JSX 语法
    if (/\.js$/.test(file) && hasJSX(content)) {
      return {
        type: 'error',
        problem: file,
        solution: '',
      };
    }
  });
};
