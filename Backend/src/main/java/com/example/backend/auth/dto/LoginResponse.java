package com.example.backend.auth.dto;

public record LoginResponse(
        String token,
        String type,
        Long userId,
        String name,
        String email,
        String role
) {
}
