package com.example.backend.borrow.dto;

import java.time.LocalDate;

public record BorrowResponse(
        Long id,
        Long userId,
        String userName,
        Long deviceId,
        String deviceName,
        int quantity,
        LocalDate borrowDate,
        LocalDate returnDate,
        String status
) {
}
