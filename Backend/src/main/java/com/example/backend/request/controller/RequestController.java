package com.example.backend.request.controller;

import com.example.backend.common.response.ApiResponse;
import com.example.backend.request.dto.RequestDTO;
import com.example.backend.request.dto.RequestResponse;
import com.example.backend.request.service.RequestService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/requests")
public class RequestController {

    private final RequestService requestService;

    public RequestController(RequestService requestService) {
        this.requestService = requestService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RequestResponse>> create(@Valid @RequestBody RequestDTO dto) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created("Request created successfully", requestService.create(dto)));
    }

    @GetMapping
    public ApiResponse<List<RequestResponse>> getAll() {
        return ApiResponse.success("Requests fetched successfully", requestService.getAll());
    }
}
