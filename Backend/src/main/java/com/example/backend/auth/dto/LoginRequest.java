package com.example.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email is invalid")
    @Pattern(regexp = "(?i)^[A-Z0-9._%+-]+@gmail\\.com$", message = "Email must end with @gmail.com")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
