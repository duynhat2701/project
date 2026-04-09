package com.example.backend.borrow.service;

import com.example.backend.borrow.dto.BorrowResponse;
import com.example.backend.borrow.entity.Borrow;
import com.example.backend.borrow.repository.BorrowRepository;
import com.example.backend.device.entity.Device;
import com.example.backend.device.repository.DeviceRepository;
import com.example.backend.request.entity.BorrowRequest;
import com.example.backend.request.repository.RequestRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BorrowService {

    private final BorrowRepository borrowRepository;
    private final RequestRepository requestRepository;
    private final DeviceRepository deviceRepository;

    public BorrowService(BorrowRepository borrowRepository,
                         RequestRepository requestRepository,
                         DeviceRepository deviceRepository) {
        this.borrowRepository = borrowRepository;
        this.requestRepository = requestRepository;
        this.deviceRepository = deviceRepository;
    }

    @Transactional
    public BorrowResponse approveRequest(Long requestId) {
        BorrowRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));

        if (!"PENDING".equals(request.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request already processed");
        }

        Device device = request.getDevice();
        if (device.getQuantity() < request.getQuantity()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not enough device");
        }

        device.setQuantity(device.getQuantity() - request.getQuantity());
        if (device.getQuantity() == 0) {
            device.setStatus("OUT_OF_STOCK");
        }

        deviceRepository.save(device);

        Borrow borrow = new Borrow();
        borrow.setUser(request.getUser());
        borrow.setDevice(device);
        borrow.setQuantity(request.getQuantity());
        borrow.setBorrowDate(LocalDate.now());
        borrow.setStatus("BORROWING");

        request.setStatus("APPROVED");
        requestRepository.save(request);

        return toResponse(borrowRepository.save(borrow));
    }

    @Transactional
    public BorrowResponse returnDevice(Long borrowId) {
        Borrow borrow = borrowRepository.findById(borrowId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Borrow not found"));

        if ("RETURNED".equals(borrow.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Already returned");
        }

        Device device = borrow.getDevice();
        device.setQuantity(device.getQuantity() + borrow.getQuantity());
        device.setStatus("AVAILABLE");

        deviceRepository.save(device);

        borrow.setReturnDate(LocalDate.now());
        borrow.setStatus("RETURNED");

        return toResponse(borrowRepository.save(borrow));
    }

    public List<BorrowResponse> getAll() {
        return borrowRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    private BorrowResponse toResponse(Borrow borrow) {
        return new BorrowResponse(
                borrow.getId(),
                borrow.getUser().getId(),
                borrow.getUser().getName(),
                borrow.getDevice().getId(),
                borrow.getDevice().getName(),
                borrow.getQuantity(),
                borrow.getBorrowDate(),
                borrow.getReturnDate(),
                borrow.getStatus()
        );
    }
}
