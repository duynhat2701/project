package com.example.backend.auth.service;

import com.example.backend.auth.dto.LoginRequest;
import com.example.backend.auth.dto.LoginResponse;
import com.example.backend.auth.dto.RegisterRequest;
import com.example.backend.auth.dto.VerifyOtpRequest;
import com.example.backend.auth.entity.VerificationOtp;
import com.example.backend.auth.repository.VerificationOtpRepository;
import com.example.backend.security.CustomUserDetails;
import com.example.backend.security.JwtService;
import com.example.backend.user.dto.UserDTO;
import com.example.backend.user.dto.UserResponse;
import com.example.backend.user.entity.User;
import com.example.backend.user.repository.UserRepository;
import com.example.backend.user.service.UserService;
import java.security.SecureRandom;
import java.time.LocalDateTime;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
public class AuthService {

    private static final int OTP_EXPIRE_MINUTES = 60;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;
    private final UserRepository userRepository;
    private final VerificationOtpRepository verificationOtpRepository;
    private final EmailService emailService;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UserService userService,
            UserRepository userRepository,
            VerificationOtpRepository verificationOtpRepository,
            EmailService emailService
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userService = userService;
        this.userRepository = userRepository;
        this.verificationOtpRepository = verificationOtpRepository;
        this.emailService = emailService;
    }

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String token = jwtService.generateToken(userDetails);

        return new LoginResponse(
                token,
                "Bearer",
                userDetails.getId(),
                userDetails.getDisplayName(),
                userDetails.getUsername(),
                userDetails.getRole()
        );
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
      try {
          UserDTO dto = new UserDTO();
          dto.setName(request.getName());
          dto.setEmail(request.getEmail());
          dto.setPassword(request.getPassword());
          dto.setRole(userRepository.count() == 0 ? "ADMIN" : "EMPLOYEE");

          UserResponse userResponse = userService.create(dto, false);
          User user = userRepository.findById(userResponse.getId())
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

          verificationOtpRepository.deleteByUserId(user.getId());

          String otp = generateOtp();
          VerificationOtp verificationOtp = new VerificationOtp();
          verificationOtp.setUser(user);
          verificationOtp.setOtp(otp);
          verificationOtp.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRE_MINUTES));
          verificationOtpRepository.save(verificationOtp);

          try {
              emailService.sendOtpEmail(user.getEmail(), otp);
          } catch (Exception e) {
              log.error("Send mail failed", e);
          }
          return userResponse;
      } catch (Exception e) {
          log.error("Register fail", e);
          throw new ResponseStatusException(
                  HttpStatus.INTERNAL_SERVER_ERROR,
                  "Không thể đăng ký. Vui lòng thử lại."
          );
      }
    }

    @Transactional
    public void verifyOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        VerificationOtp verificationOtp = verificationOtpRepository
                .findTopByUserEmailAndOtpOrderByIdDesc(request.getEmail(), request.getOtp())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP is invalid"));

        if (verificationOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP has expired");
        }

        user.setStatus(true);
        userRepository.save(user);
        verificationOtpRepository.deleteByUserId(user.getId());
    }
    @Transactional
    public void resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.isStatus()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Account already verified");
        }

        verificationOtpRepository.deleteByUserId(user.getId());

        String otp = generateOtp();

        VerificationOtp verificationOtp = new VerificationOtp();
        verificationOtp.setUser(user);
        verificationOtp.setOtp(otp);
        verificationOtp.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRE_MINUTES));
        verificationOtpRepository.save(verificationOtp);

        emailService.sendOtpEmail(user.getEmail(), otp);
    }

    private String generateOtp() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }
}
