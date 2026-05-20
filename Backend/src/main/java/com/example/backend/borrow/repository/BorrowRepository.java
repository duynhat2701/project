package com.example.backend.borrow.repository;

import com.example.backend.borrow.entity.Borrow;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BorrowRepository extends JpaRepository<Borrow, Long> {

    List<Borrow> findByUserIdOrderByIdDesc(Long userId);

    @Query("""
            select coalesce(sum(b.quantity), 0)
            from Borrow b
            where b.device.id = :deviceId and upper(b.status) = 'BORROWING'
            """)
    int getBorrowedQuantityByDeviceId(@Param("deviceId") Long deviceId);
}
