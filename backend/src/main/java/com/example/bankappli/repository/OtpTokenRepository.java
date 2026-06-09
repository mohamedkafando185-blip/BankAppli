package com.example.bankappli.repository;

import com.example.bankappli.model.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, String> {

    Optional<OtpToken> findTopByEmailAndTypeAndUsedFalseOrderByCreatedAtDesc(
        String email, OtpToken.TypeOtp type);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("DELETE FROM OtpToken o WHERE o.email = :email AND o.type = :type")
    void deleteByEmailAndType(@Param("email") String email, @Param("type") OtpToken.TypeOtp type);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("DELETE FROM OtpToken o WHERE o.expiresAt < :now")
    void deleteExpired(@Param("now") LocalDateTime now);
}
