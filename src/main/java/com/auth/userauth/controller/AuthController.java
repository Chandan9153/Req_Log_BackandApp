package com.auth.userauth.controller;

import com.auth.userauth.dto.*;
import com.auth.userauth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /api/auth/register - Register a new user
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDto>> register(@Valid @RequestBody RegisterRequest request) {
        UserDto createdUser = authService.registerUser(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful! You can now log in.", createdUser));
    }

    /**
     * POST /api/auth/login - Authenticate user and initiate session
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserDto>> login(@Valid @RequestBody LoginRequest request,
                                                      HttpServletRequest httpRequest,
                                                      HttpServletResponse httpResponse) {
        UserDto user = authService.login(request, httpRequest, httpResponse);
        return ResponseEntity.ok(ApiResponse.success("Login successful. Welcome back!", user));
    }

    /**
     * GET /api/auth/me - Retrieve current logged-in user profile
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser() {
        UserDto user = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("Authenticated user retrieved", user));
    }

    /**
     * POST /api/auth/logout - Logout user and clear session
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(request, response);
        return ResponseEntity.ok(ApiResponse.success("You have been logged out successfully."));
    }

    /**
     * POST /api/auth/forgot-password - Request password reset
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        Map<String, Object> tokenInfo = authService.initiatePasswordReset(request);
        return ResponseEntity.ok(ApiResponse.success(
                "Password reset instructions have been generated. Follow the link to reset your password.",
                tokenInfo
        ));
    }

    /**
     * GET /api/auth/validate-reset-token - Check if reset token is valid
     */
    @GetMapping("/validate-reset-token")
    public ResponseEntity<ApiResponse<Boolean>> validateToken(@RequestParam("token") String token) {
        boolean isValid = authService.validateResetToken(token);
        if (isValid) {
            return ResponseEntity.ok(ApiResponse.success("Token is valid", true));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("Token is invalid or expired", false));
        }
    }

    /**
     * POST /api/auth/reset-password - Reset password with token
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password has been successfully reset! Please log in with your new password."));
    }
}
