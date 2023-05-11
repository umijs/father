// import 'reflect-metadata'; // 如果您使用了 TypeScript 的装饰器，请导入此模块
import { register } from 'ts-node';

register({
  project: './tsconfig.json', // 指定 TypeScript 配置文件路径
});
