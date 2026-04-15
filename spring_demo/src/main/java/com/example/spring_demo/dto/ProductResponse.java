package com.example.spring_demo.dto;

public record ProductResponse(
        Long id,
        String name,
        Integer price,
        String imageUrl
) {
}
