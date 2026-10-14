const mxn = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 990 -> "$990", 1980.5 -> "$1,980.50" */
export const formatPrice = (value: number): string => mxn.format(Number(value) || 0);
