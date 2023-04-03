import type { IDoctorReport } from '..';
import type { IApi } from '../../types';

const PREFER_PEER_DEPS = ['react', 'react-dom', 'antd'];

export default (api: IApi) => {
  api.addRegularCheckup(() => {
    const warns: IDoctorReport = [];

    if (api.pkg.dependencies) {
      Object.keys(api.pkg.dependencies).forEach((pkg) => {
        if (
          PREFER_PEER_DEPS.includes(pkg) &&
          !api.pkg.peerDependencies?.[pkg]
        ) {
          warns.push({
            type: 'warn',
            problem: `The dependency \`${pkg}\` has multi-instance risk in host project`,
            solution: 'Move it into `peerDependencies` from `dependencies`',
          });
        }
      });
    }

    return warns;
  });
};
