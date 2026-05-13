package com.example.backend.request.service;

import com.example.backend.device.entity.Device;
import com.example.backend.device.repository.DeviceRepository;
import com.example.backend.request.dto.RequestDTO;
import com.example.backend.request.dto.RequestResponse;
import com.example.backend.request.entity.BorrowRequest;
import com.example.backend.request.repository.RequestRepository;
import com.example.backend.user.entity.User;
import com.example.backend.user.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import jakarta.transaction.Transactional;
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

    public RequestResponse create(RequestDTO dto, String email) {
        User user = findUserByEmail(email);

        Device device = deviceRepository.findById(dto.getDeviceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Device not found"));

        if (dto.getQuantity() > device.getQuantity()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Requested quantity exceeds available stock"
            );
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

    public List<RequestResponse> getMy(String email) {
        User user = findUserByEmail(email);
        return requestRepository.findByUserIdOrderByIdDesc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }
    @Transactional
    public RequestResponse reject(Long id) {
        BorrowRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Request not found"
                ));

        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only pending request can be rejected"
            );
        }

        request.setStatus("REJECTED");

        BorrowRequest savedRequest = requestRepository.save(request);

        return toResponse(savedRequest);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
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