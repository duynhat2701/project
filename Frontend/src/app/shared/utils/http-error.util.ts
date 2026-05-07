interface HttpLikeError {
  status?: number;
  name?: string;
  error?: {
    message?: string;
  };
}

export function getLoadErrorMessage(error: HttpLikeError, fallbackMessage: string): string {
  if (error?.status === 0) {
    return 'Không kết nối được server.';
  }

  if (error?.status === 504 || error?.name === 'TimeoutError') {
    return 'Server đang khởi động, vui lòng thử lại sau ít giây.';
  }

  return error?.error?.message || fallbackMessage;
}

export function getActionErrorMessage(
  error: HttpLikeError,
  options: {
    forbiddenMessage: string;
    fallbackMessage: string;
  },
): string {
  if (error?.status === 403) {
    return options.forbiddenMessage;
  }

  if (error?.status === 401) {
    return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
  }

  if (error?.status === 0) {
    return 'Không kết nối được server.';
  }

  if (error?.name === 'TimeoutError') {
    return 'Server phản hồi quá chậm, vui lòng thử lại.';
  }

  return error?.error?.message || options.fallbackMessage;
}
