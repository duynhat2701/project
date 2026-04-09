package com.example.backend.request.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequestDTO {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Device ID is required")
    private Long deviceId;

    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity;
}
