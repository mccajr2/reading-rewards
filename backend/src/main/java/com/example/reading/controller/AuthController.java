package com.example.reading.controller;

import com.example.reading.model.User;
import com.example.reading.repo.UserRepository;
import com.example.reading.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Value("${frontend.url}")
    private String frontendUrl;
    @Autowired
    private com.example.reading.service.BrevoEmailService brevoEmailService;
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
        // Send verification email using Brevo API
        String subject = "Verify your Reading Rewards account";
        String htmlContent = "Welcome! Please verify your account by clicking: " +
            "<a href='" + frontendUrl + "/verify-email?token=" + verificationToken + "'>Verify Account</a>";
        boolean sent = brevoEmailService.sendEmail(email, subject, htmlContent);
        if (!sent) {
            log.warn("Signup created user but verification email failed to send for {}", email);
            return ResponseEntity.accepted().body("Signup successful, but we could not send verification email right now. Please try again shortly.");
        }
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
            authenticationManager.authenticate(
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
