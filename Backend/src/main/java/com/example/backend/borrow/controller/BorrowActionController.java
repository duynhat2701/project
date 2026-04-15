package com.example.backend.borrow.controller;

import com.example.backend.borrow.dto.BorrowResponse;
import com.example.backend.borrow.service.BorrowService;
import com.example.backend.common.response.ApiResponse;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class BorrowActionController {

    private final BorrowService borrowService;

    public BorrowActionController(BorrowService borrowService) {
        this.borrowService = borrowService;
    }

    @PostMapping("/approve/{requestId}")
    public ApiResponse<BorrowResponse> approve(@PathVariable Long requestId) {
        return ApiResponse.success("Request approved successfully", borrowService.approveRequest(requestId));
    }

    @PostMapping("/return/{borrowId}")
    public ApiResponse<BorrowResponse> returnDevice(@PathVariable Long borrowId) {
        return ApiResponse.success("Device returned successfully", borrowService.returnDevice(borrowId));
    }
}
