package com.example.reading.controller;

import com.example.reading.model.User;
import com.example.reading.repo.UserRepository;
import com.example.reading.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Value("${frontend.url}")
    private String frontendUrl;
    @Value("${spring.mail.from:noreply@example.com}")
    private String mailFrom;
    @Autowired
    private JavaMailSender mailSender;
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String firstName = body.get("firstName");
        String lastName = body.get("lastName");
        if (email == null || password == null || firstName == null || lastName == null) {
            return ResponseEntity.badRequest().body("Missing required fields");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("Email already registered");
        }
        // Create verification token
        String verificationToken = UUID.randomUUID().toString();
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstName(firstName);
        user.setUsername(email);
        user.setRole(User.UserRole.PARENT);
        user.setStatus("UNVERIFIED");
        user.setVerificationToken(verificationToken);
        userRepository.save(user);
        // Send verification email
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(email);
        message.setSubject("Verify your Reading Rewards account");
        message.setText("Welcome! Please verify your account by clicking: " +
                frontendUrl + "/verify-email?token=" + verificationToken);
        mailSender.send(message);
        return ResponseEntity.ok("Signup successful. Please check your email to verify your account.");
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        User user = userRepository.findByVerificationToken(token).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("Invalid or expired token");
        }
        user.setStatus("VERIFIED");
        user.setVerificationToken(null);
        userRepository.save(user);
        return ResponseEntity.ok("Email verified. You can now log in.");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));
            User user;
            if (username.contains("@")) {
                user = userRepository.findByEmail(username).orElseThrow();
            } else {
                user = userRepository.findByUsername(username).orElseThrow();
            }
            // Only require verification for parents
            if (user.getRole() == User.UserRole.PARENT && (user.getStatus() == null || !user.getStatus().equals("VERIFIED"))) {
                return ResponseEntity.status(403).body("Parent account not verified. Please check your email.");
            }
            String token = jwtUtil.generateToken(username);
            Map<String, Object> resp = new HashMap<>();
            resp.put("token", token);
            resp.put("user", user);
            return ResponseEntity.ok(resp);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // For JWT, logout is handled on the client by deleting the token.
        return ResponseEntity.ok().build();
    }


}
