import { useToasts } from "./useToast";

export default function useAppToast() {
  const toaster = useToasts();
  return {
    toast: {
      success: toaster.success,
      error: toaster.error,
      info: toaster.info,
      warning: toaster.warning,
    },
    success: (message: string) => toaster.success(message),
    error: (message: string) => toaster.error(message),
    info: (message: string) => toaster.info(message),
    warning: (message: string) => toaster.warning(message),
  };
}
