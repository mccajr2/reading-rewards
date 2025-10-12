
package com.example.reading.controller;

import com.example.reading.model.User;
import com.example.reading.model.User.UserRole;
import com.example.reading.repo.UserRepository;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;


import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepo;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // --- JWT configuration ---
    // NOTE: use an environment variable or secrets manager in production
    private static final String JWT_SECRET = "change_this_secret_change_this_secret_32bytes_minimum!";
    private static final SecretKey JWT_KEY = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));
    private static final long JWT_EXPIRATION_MS = 1000L * 60 * 60 * 24; // 24h

    // --- Signup ---
    @PostMapping("/signup")
    public ResponseEntity<?> registerParent(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String username = body.get("username");

        if (email == null || password == null || username == null) {
            return ResponseEntity.badRequest().body("Email, username, and password are required");
        }
        if (userRepo.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("Email already in use");
        }
        if (userRepo.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body("Username already in use");
        }

        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(UserRole.PARENT);
        userRepo.save(user);

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", user.getId());
        resp.put("email", user.getEmail());
        resp.put("username", user.getUsername());
        resp.put("role", user.getRole());
        return ResponseEntity.ok(resp);
    }

    // --- Login ---
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String username = body.get("username");
        String password = body.get("password");

        User user = null;
        if (email != null) {
            user = userRepo.findByEmail(email).orElse(null);
        } else if (username != null) {
            user = userRepo.findByUsername(username).orElse(null);
        }

        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        // --- Generate JWT (non-deprecated API) ---
        String token = Jwts.builder()
                .subject(user.getId().toString())
                .claim("role", user.getRole().name())
                .claim("username", user.getUsername())
                .claim("email", user.getEmail())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + JWT_EXPIRATION_MS))
                // 👇 Explicitly specify algorithm using new API
                .signWith(JWT_KEY, Jwts.SIG.HS256)
                .compact();

        Map<String, Object> resp = new HashMap<>();
        resp.put("token", token);
        resp.put("role", user.getRole());
        resp.put("username", user.getUsername());
        resp.put("email", user.getEmail());
        resp.put("id", user.getId());

        return ResponseEntity.ok(resp);
    }
    // --- Create Child Account ---
    @PostMapping("/create-child")
    public ResponseEntity<?> createChild(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body("Username and password are required");
        }

        // Get parentId from JWT (set as request attribute by JwtAuthFilter)
        String parentIdStr = (String) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        if (parentIdStr == null || role == null || !role.equals("PARENT")) {
            return ResponseEntity.status(403).body("Only a parent can create child accounts");
        }
        java.util.UUID parentId;
        try {
            parentId = java.util.UUID.fromString(parentIdStr);
        } catch (Exception e) {
            return ResponseEntity.status(403).body("Invalid parentId in token");
        }
        User parent = userRepo.findById(parentId).orElse(null);
        if (parent == null || parent.getRole() != UserRole.PARENT) {
            return ResponseEntity.status(403).body("Only a parent can create child accounts");
        }

        if (userRepo.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body("Username already in use");
        }

        User child = new User();
        child.setUsername(username);
        child.setPassword(passwordEncoder.encode(password));
        child.setRole(UserRole.CHILD);
        child.setParentId(parent.getId());
        child.setParent(parent); // for JPA relationship
        child.setEmail(null); // children do not have email

        userRepo.save(child);

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", child.getId());
        resp.put("username", child.getUsername());
        resp.put("role", child.getRole());
        resp.put("parentId", child.getParentId());
        return ResponseEntity.ok(resp);
    }
}
