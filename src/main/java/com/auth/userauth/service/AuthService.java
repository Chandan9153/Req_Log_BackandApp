package com.auth.userauth.service;

import com.auth.userauth.dto.*;
import com.auth.userauth.entity.PasswordResetToken;
import com.auth.userauth.entity.User;
import com.auth.userauth.exception.BadRequestException;
import com.auth.userauth.exception.ResourceNotFoundException;
import com.auth.userauth.repository.PasswordResetTokenRepository;
import com.auth.userauth.repository.UserRepository;
import com.auth.userauth.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;

    public AuthService(UserRepository userRepository,
                       PasswordResetTokenRepository resetTokenRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       SecurityContextRepository securityContextRepository) {
        this.userRepository = userRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
    }

    /**
     * Registers a new user with validation, duplicate checks, and BCrypt password hashing.
     */
    @Transactional
    public UserDto registerUser(RegisterRequest request) {
        // Validate password confirmation
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        // Validate unique email
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("An account with this email address already exists.");
        }

        // Validate unique username
        String normalizedUsername = request.getUsername().trim();
        if (userRepository.existsByUsername(normalizedUsername)) {
            throw new BadRequestException("Username '" + normalizedUsername + "' is already taken. Please choose another.");
        }

        // Secure password hashing with BCrypt
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        String mobile = request.getMobileNumber() != null && !request.getMobileNumber().trim().isEmpty()
                ? request.getMobileNumber().trim()
                : null;

        User user = new User(
                request.getFullName().trim(),
                normalizedUsername,
                normalizedEmail,
                mobile,
                hashedPassword
        );

        User savedUser = userRepository.save(user);
        logger.info("Successfully registered new user: {} (id: {})", savedUser.getEmail(), savedUser.getId());

        return UserDto.fromEntity(savedUser);
    }

    /**
     * Authenticates user, establishes secure session, and stores security context.
     */
    public UserDto login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String identifier = request.getEmail().trim();

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(identifier, request.getPassword())
            );

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);

            // Persist context in session
            securityContextRepository.saveContext(context, httpRequest, httpResponse);

            HttpSession session = httpRequest.getSession(true);
            if (request.isRememberMe()) {
                // Keep session alive for 30 days if Remember Me is checked
                session.setMaxInactiveInterval(30 * 24 * 60 * 60);
            } else {
                // Default session timeout: 2 hours
                session.setMaxInactiveInterval(2 * 60 * 60);
            }

            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            User user = userRepository.findById(principal.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            logger.info("User logged in successfully: {}", user.getEmail());
            return UserDto.fromEntity(user);

        } catch (BadCredentialsException ex) {
            logger.warn("Failed login attempt for identifier: {}", identifier);
            throw new BadCredentialsException("Invalid email/username or password. Please check your credentials.");
        }
    }

    /**
     * Retrieves currently authenticated user details.
     */
    @Transactional(readOnly = true)
    public UserDto getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BadCredentialsException("No authenticated user found");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal userPrincipal) {
            User user = userRepository.findById(userPrincipal.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User profile not found"));
            return UserDto.fromEntity(user);
        }

        throw new BadCredentialsException("Invalid authentication session");
    }

    /**
     * Logs out the user and invalidates session.
     */
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    /**
     * Initiates password reset by creating a secure, time-limited, single-use token.
     */
    @Transactional
    public Map<String, Object> initiatePasswordReset(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + email));

        // Generate secure 36-char UUID token
        String token = UUID.randomUUID().toString();
        // 15-minute token expiration
        LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(15);

        PasswordResetToken resetToken = new PasswordResetToken(token, user, expiryDate);
        resetTokenRepository.save(resetToken);

        logger.info("Generated password reset token for user {}: {}", user.getEmail(), token);

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("resetUrl", "/reset-password.html?token=" + token);
        result.put("expiresAt", expiryDate);
        return result;
    }

    /**
     * Validates if a password reset token is active and valid.
     */
    @Transactional(readOnly = true)
    public boolean validateResetToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        return resetTokenRepository.findByToken(token.trim())
                .map(t -> !t.isUsed() && !t.isExpired())
                .orElse(false);
    }

    /**
     * Resets password using single-use reset token.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New passwords do not match");
        }

        PasswordResetToken resetToken = resetTokenRepository.findByToken(request.getToken().trim())
                .orElseThrow(() -> new BadRequestException("Invalid or expired password reset link."));

        if (resetToken.isUsed()) {
            throw new BadRequestException("This password reset link has already been used.");
        }

        if (resetToken.isExpired()) {
            throw new BadRequestException("This password reset link has expired. Please request a new one.");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        resetTokenRepository.save(resetToken);

        logger.info("Password successfully reset for user: {}", user.getEmail());
    }

    /**
     * Changes password for authenticated user in dashboard.
     */
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New passwords do not match");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect.");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password cannot be the same as your old password.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        logger.info("Password changed successfully for user id: {}", userId);
    }
}
