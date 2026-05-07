export function getBorrowStatusLabel(status: string | null | undefined): string {
  const normalized = status?.toUpperCase();

  switch (normalized) {
    case 'PENDING':
      return 'Chờ duyệt';
    case 'APPROVED':
      return 'Đã duyệt';
    case 'BORROWING':
      return 'Đang mượn';
    case 'RETURNED':
      return 'Đã trả';
    case 'REJECTED':
      return 'Từ chối';
    case 'CANCELLED':
    case 'CANCELED':
      return 'Đã hủy';
    default:
      return status || '-';
  }
}

export function getDeviceStatusLabel(status: string | null | undefined): string {
  const normalized = status?.toUpperCase();

  switch (normalized) {
    case 'AVAILABLE':
    case 'IN_STOCK':
      return 'Có sẵn';
    case 'OUT_OF_STOCK':
      return 'Hết hàng';
    case 'LOW_STOCK':
      return 'Sắp hết';
    default:
      return status || '-';
  }
}

export function getRoleLabel(role: string | null | undefined): string {
  const normalized = role?.toUpperCase();

  switch (normalized) {
    case 'ADMIN':
      return 'Quản trị viên';
    case 'EMPLOYEE':
      return 'Nhân viên';
    default:
      return role || '-';
  }
}
