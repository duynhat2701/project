package com.example.backend.device.controller;

import com.example.backend.common.response.ApiResponse;
import com.example.backend.device.dto.DeviceDTO;
import com.example.backend.device.dto.DeviceResponse;
import com.example.backend.device.service.DeviceService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    private final DeviceService deviceService;

    public DeviceController(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    @GetMapping
    public ApiResponse<List<DeviceResponse>> getAll() {
        return ApiResponse.success("Devices fetched successfully", deviceService.getAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<DeviceResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Device fetched successfully", deviceService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DeviceResponse>> create(@Valid @RequestBody DeviceDTO dto) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created("Device created successfully", deviceService.create(dto)));
    }

    @PutMapping("/{id}")
    public ApiResponse<DeviceResponse> update(@PathVariable Long id, @Valid @RequestBody DeviceDTO dto) {
        return ApiResponse.success("Device updated successfully", deviceService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        deviceService.delete(id);
        return ApiResponse.success("Device deleted successfully", null);
    }
}
