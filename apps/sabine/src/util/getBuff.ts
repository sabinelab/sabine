export const getBuff = (level: number) => (level <= 1 ? 0 : (level - 1) * 1.45) / 100
