package com.example.backend.device.service;

import com.example.backend.device.dto.DeviceDTO;
import com.example.backend.device.dto.DeviceResponse;
import com.example.backend.device.entity.Device;
import com.example.backend.device.repository.DeviceRepository;
import java.util.List;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DeviceService {

    private final DeviceRepository deviceRepository;

    public DeviceService(DeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    public List<DeviceResponse> getAll() {
        return deviceRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public DeviceResponse getById(Long id) {
        return toResponse(findDeviceById(id));
    }

    public DeviceResponse create(DeviceDTO dto) {
        Device device = new Device();
        applyChanges(device, dto);
        return toResponse(deviceRepository.save(device));
    }

    public DeviceResponse update(Long id, DeviceDTO dto) {
        Device device = findDeviceById(id);
        applyChanges(device, dto);
        return toResponse(deviceRepository.save(device));
    }

    public void delete(Long id) {
        try {
            deviceRepository.deleteById(id);
        } catch (EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Device not found");
        }
    }

    private Device findDeviceById(Long id) {
        return deviceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Device not found"));
    }

    private void applyChanges(Device device, DeviceDTO dto) {
        device.setName(dto.getName());
        device.setCode(dto.getCode());
        device.setQuantity(dto.getQuantity());
        syncDeviceStatus(device);
    }
    private void syncDeviceStatus(Device device) {
        if (device.getQuantity() <= 0) {
            device.setStatus("OUT_OF_STOCK");
        } else if (device.getQuantity() <= 3) {
            device.setStatus("LOW_STOCK");
        } else {
            device.setStatus("AVAILABLE");
        }
    }

    private DeviceResponse toResponse(Device device) {
        return new DeviceResponse(
                device.getId(),
                device.getName(),
                device.getCode(),
                device.getQuantity(),
                device.getStatus()
        );
    }
}
