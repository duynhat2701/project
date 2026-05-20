package com.example.backend.device.dto;

public record DeviceResponse(
        Long id,
        String name,
        String code,
        int quantity,
        int totalQuantity,
        int borrowedQuantity,
        String status
) {
}
