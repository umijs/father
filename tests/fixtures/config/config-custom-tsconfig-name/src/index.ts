export default async () => {
  try {
    await import('./exclude/index');
  } catch {}
};
