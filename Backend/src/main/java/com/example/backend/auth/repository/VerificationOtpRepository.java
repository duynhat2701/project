package com.example.backend.auth.repository;

import com.example.backend.auth.entity.VerificationOtp;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationOtpRepository extends JpaRepository<VerificationOtp, Long> {

    Optional<VerificationOtp> findTopByUserEmailAndOtpOrderByIdDesc(String email, String otp);

    boolean existsByUserId(Long userId);

    void deleteByUserId(Long userId);
}
