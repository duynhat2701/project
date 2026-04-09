package com.example.backend.request.dto;

public record RequestResponse(
        Long id,
        Long userId,
        String userName,
        Long deviceId,
        String deviceName,
        int quantity,
        String status
) {
}
