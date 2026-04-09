package com.example.backend.device.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeviceDTO {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Code is required")
    private String code;

    @Min(value = 0, message = "Quantity must be at least 0")
    private int quantity;

    @NotBlank(message = "Status is required")
    private String status;
}
