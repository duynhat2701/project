package com.example.backend.borrow.repository;

import com.example.backend.borrow.entity.Borrow;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BorrowRepository extends JpaRepository<Borrow, Long> {

    List<Borrow> findByUserIdOrderByIdDesc(Long userId);
}