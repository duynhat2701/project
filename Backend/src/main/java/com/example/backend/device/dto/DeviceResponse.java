package com.example.backend.device.dto;

public record DeviceResponse(
        Long id,
        String name,
        String code,
        int quantity,
        String status
) {
}
