package com.example.backend.security;

import com.example.backend.auth.repository.VerificationOtpRepository;
import com.example.backend.user.entity.User;
import com.example.backend.user.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final VerificationOtpRepository verificationOtpRepository;

    public CustomUserDetailsService(
            UserRepository userRepository,
            VerificationOtpRepository verificationOtpRepository
    ) {
        this.userRepository = userRepository;
        this.verificationOtpRepository = verificationOtpRepository;

    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByEmail(username)
                .map(this::restoreLegacyUserIfNeeded)
                .map(CustomUserDetails::new)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid email or password"));
    }

    private User restoreLegacyUserIfNeeded(User user) {
        if (user.isStatus() || verificationOtpRepository.existsByUserId(user.getId())) {
            return user;
        }

        user.setStatus(true);
        return userRepository.save(user);
    }
}
