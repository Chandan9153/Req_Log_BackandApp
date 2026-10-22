package com.auth.userauth.controller;

import com.auth.userauth.dto.ApiResponse;
import com.auth.userauth.dto.ChangePasswordRequest;
import com.auth.userauth.dto.UserDto;
import com.auth.userauth.security.UserPrincipal;
import com.auth.userauth.service.AuthService;
import com.auth.userauth.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    /**
     * GET /api/user/profile - Return profile of authenticated user
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserDto>> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        UserDto user = userService.getUserById(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", user));
    }

    /**
     * POST /api/user/change-password - Change password for authenticated user
     */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully!"));
    }
}
