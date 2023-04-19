export const generateExternal = async (pkg: Record<string, any>) => {
  const { dependencies = {}, peerDependencies = {} } = pkg;

  return (id: string) => {
    const packages: string[] = [...Object.keys(peerDependencies)];

    packages.push('@vue', ...Object.keys(dependencies));

    return [...new Set(packages)].some(
      (pkg) => id === pkg || id.startsWith(`${pkg}/`),
    );
  };
};
