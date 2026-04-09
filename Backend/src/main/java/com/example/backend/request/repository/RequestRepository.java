package com.example.backend.request.repository;

import com.example.backend.request.entity.BorrowRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestRepository extends JpaRepository<BorrowRequest, Long> {
}