import path from 'path';
import fs from 'fs-extra';
import { getLernaPackages } from './';

export const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

export function getDirs() {
  return fs
		.readdirSync(FIXTURES_DIR)
		.filter(fixturePath =>
			fs.statSync(path.resolve(FIXTURES_DIR, fixturePath)).isDirectory(),
		);
}

export function fixture(...args: string[]) {
  return path.join(FIXTURES_DIR, ...args)
}

describe('default', () => {
  const fixturePath = fixture('default');

  it('获取所有的包', async () => {
    expect.assertions(1);

    const pkgs = await getLernaPackages(fixturePath, {
      stream: false
    });

    const pkgNames = ['bar', 'foo'];

    expect(pkgNames).toEqual(pkgs.map(item => item.name));
  })
});

describe('customize', () => {
  const fixturePath = fixture('customize');

  it('获取所有的包', async () => {
    expect.assertions(1);

    const pkgs = await getLernaPackages(fixturePath, {
      stream: false,
      showPrivate: true,
    });

    const pkgNames = ['core1', 'core2', 'bar', 'foo'];

    expect(pkgNames).toEqual(pkgs.map(item => item.name));
  });

  it('过滤私有的包', async () => {
    expect.assertions(1);

    const pkgs = await getLernaPackages(fixturePath, {
      stream: false,
      showPrivate: false,
    });

    const pkgNames = ['core1', 'bar', 'foo'];

    expect(pkgNames).toEqual(pkgs.map(item => item.name));
  });

  it('按照依赖顺序获取所有的包', async () => {
    expect.assertions(1);

    const pkgs = await getLernaPackages(fixturePath, {
      stream: true,
      showPrivate: true,
    });

    const pkgNames = ['core2', 'bar', 'foo', 'core1'];

    expect(pkgNames).toEqual(pkgs.map(item => item.name));
  });

  it('设置包含部分包', async () => {
    expect.assertions(1);

    const pkgs = await getLernaPackages(fixturePath, {
      stream: false,
      showPrivate: true,
      include: [
        'core*'
      ]
    });
    const pkgNames = ['core1', 'core2'];

    expect(pkgNames).toEqual(pkgs.map(item => item.name));
  })

  it('设置包含部分包', async () => {
    expect.assertions(1);

    const pkgs = await getLernaPackages(fixturePath, {
      stream: false,
      showPrivate: true,
      exclude: [
        'core1'
      ]
    });
    const pkgNames = ['core2', 'bar', 'foo'];

    expect(pkgNames).toEqual(pkgs.map(item => item.name));
  })
});
