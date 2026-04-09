package com.example.backend.request.entity;

import com.example.backend.user.entity.User;
import com.example.backend.device.entity.Device;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "requests")
public class BorrowRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private User user;

    @ManyToOne
    private Device device;

    private int quantity;

    private String status; // PENDING, APPROVED, REJECTED
}

