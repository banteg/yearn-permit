export function range(num) {
  return [...Array(num).entries()].map((e, i) => i);
}
