export type ToastVariant = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

export type ToastInput = {
  message: string;
  variant?: ToastVariant;
};
