package com.example.backend.user.service;

import com.example.backend.user.dto.UserDTO;
import com.example.backend.user.dto.UserResponse;
import com.example.backend.user.entity.User;
import com.example.backend.user.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserResponse> getAll() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public UserResponse getById(Long id) {
        return toResponse(findUserById(id));
    }

    public UserResponse create(UserDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        if (dto.getPassword() == null || dto.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
        }

        User user = new User();
        applyChanges(user, dto, true);
        return toResponse(userRepository.save(user));
    }

    public UserResponse update(Long id, UserDTO dto) {
        User user = findUserById(id);

        if (userRepository.existsByEmailAndIdNot(dto.getEmail(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        applyChanges(user, dto, false);
        return toResponse(userRepository.save(user));
    }

    public void delete(Long id) {
        User user = findUserById(id);
        userRepository.delete(user);
    }

    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void applyChanges(User user, UserDTO dto, boolean creatingNewUser) {
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setRole(resolveRole(dto.getRole(), user.getId() == null));

        if (creatingNewUser) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
            return;
        }

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
    }

    private String resolveRole(String requestedRole, boolean creatingNewUser) {
        if (requestedRole == null || requestedRole.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role is required");
        }

        if (!creatingNewUser) {
            return requestedRole.toUpperCase();
        }

        if (userRepository.count() == 0) {
            return "ADMIN";
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.isAuthenticated()
                && authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()))) {
            return requestedRole.toUpperCase();
        }

        return "EMPLOYEE";
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }
}