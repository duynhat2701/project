package com.example.backend.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromEmail;

    public EmailService(JavaMailSender mailSender, @Value("${spring.mail.username:}") String fromEmail) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
    }

    public void sendOtpEmail(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
     //   if (!fromEmail.isBlank()) {
     //       message.setFrom(fromEmail);
        //  }
        try {
            message.setFrom ("nhatnd2701@gmail.com");
            message.setTo(to);
            message.setSubject("Ma xac thuc tai khoan");
            message.setText("Ma OTP cua ban la: " + otp + ". Ma nay co hieu luc trong 5 phut.");
            mailSender.send(message);
        } catch (Exception e) {
          log.info("[DEBUG] SEND MAIL {}", e.getMessage());
        }
    }
}
