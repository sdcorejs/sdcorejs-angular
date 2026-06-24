/**
 * Build Record<field, width> từ map column hiện tại trong ConfiguredTableResult.
 * Loại bỏ field có width undefined để consumer luôn nhận chuỗi 'NNpx'.
 */
export const buildColumnWidthMap = (column: Record<string, { width?: string }> | undefined | null): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!column) return result;
  for (const key of Object.keys(column)) {
    const w = column[key]?.width;
    if (w) result[key] = w;
  }
  return result;
};
