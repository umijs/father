const map = new Map();

/**
 * set data to map key
 */
export function setSharedData(key: string, value: any) {
  map.set(key, value);
}

/**
 * get data and clear map key
 */
export function getSharedData<T>(key: string): T {
  const data = map.get(key);

  map.delete(key);

  return data;
}
