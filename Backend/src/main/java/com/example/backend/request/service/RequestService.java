package com.example.backend.request.service;

import com.example.backend.request.dto.RequestDTO;
import com.example.backend.request.dto.RequestResponse;
import com.example.backend.request.entity.BorrowRequest;
import com.example.backend.request.repository.RequestRepository;
import com.example.backend.user.entity.User;
import com.example.backend.user.repository.UserRepository;
import com.example.backend.device.entity.Device;
import com.example.backend.device.repository.DeviceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class RequestService {

    private final RequestRepository requestRepository;
    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;

    public RequestService(RequestRepository requestRepository,
                          UserRepository userRepository,
                          DeviceRepository deviceRepository) {
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.deviceRepository = deviceRepository;
    }

    public RequestResponse create(RequestDTO dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Device device = deviceRepository.findById(dto.getDeviceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Device not found"));

        if (dto.getQuantity() > device.getQuantity()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requested quantity exceeds available stock");
        }

        BorrowRequest request = new BorrowRequest();
        request.setUser(user);
        request.setDevice(device);
        request.setQuantity(dto.getQuantity());
        request.setStatus("PENDING");

        return toResponse(requestRepository.save(request));
    }

    public List<RequestResponse> getAll() {
        return requestRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    private RequestResponse toResponse(BorrowRequest request) {
        return new RequestResponse(
                request.getId(),
                request.getUser().getId(),
                request.getUser().getName(),
                request.getDevice().getId(),
                request.getDevice().getName(),
                request.getQuantity(),
                request.getStatus()
        );
    }
}
