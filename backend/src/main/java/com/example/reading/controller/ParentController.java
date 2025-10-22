package com.example.reading.controller;

import com.example.reading.dto.ResetChildPasswordRequest;
import com.example.reading.model.User;
import com.example.reading.repo.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parent")
public class ParentController {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    // List all kids for the authenticated parent
    @GetMapping("/kids")
    public ResponseEntity<?> getKids(@AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
        System.out.println("[DEBUG] principal username: " + (principal != null ? principal.getUsername() : "null"));
        // For parents, principal.getUsername() is their email, so look up by email
        User parent = userRepository.findByEmail(principal.getUsername()).orElse(null);
        System.out.println("[DEBUG] parent found: " + (parent != null ? parent.getUsername() : "null") + ", role: " + (parent != null ? parent.getRole() : "null"));
        if (parent == null || parent.getRole() != User.UserRole.PARENT) {
            System.out.println("[DEBUG] Not authorized: parent is null or not a parent");
            return ResponseEntity.status(403).body("Not authorized");
        }
        List<User> kids = parent.getChildren();
        // Only return id, firstName, username for each kid
        List<Map<String, Object>> result = kids.stream().map(kid -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", kid.getId());
            m.put("firstName", kid.getFirstName());
            m.put("username", kid.getUsername());
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    // Add a new kid for the authenticated parent
    @PostMapping("/kids")
    public ResponseEntity<?> addKid(@AuthenticationPrincipal org.springframework.security.core.userdetails.User principal, @RequestBody Map<String, String> body) {
        System.out.println("[DEBUG] principal username: " + (principal != null ? principal.getUsername() : "null"));
        // For parents, principal.getUsername() is their email, so look up by email
        User parent = userRepository.findByEmail(principal.getUsername()).orElse(null);
        System.out.println("[DEBUG] parent found: " + (parent != null ? parent.getUsername() : "null") + ", role: " + (parent != null ? parent.getRole() : "null"));
        if (parent == null || parent.getRole() != User.UserRole.PARENT) {
            System.out.println("[DEBUG] Not authorized: parent is null or not a parent");
            return ResponseEntity.status(403).body("Not authorized");
        }
        String username = body.get("username");
        String firstName = body.get("firstName");
        String password = body.get("password");
        if (username == null || firstName == null || password == null) {
            return ResponseEntity.badRequest().body("Missing required fields");
        }
        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body("Username already taken");
        }
        User kid = new User();
        kid.setUsername(username);
        kid.setFirstName(firstName);
        kid.setPassword(passwordEncoder.encode(password));
        kid.setRole(User.UserRole.CHILD);
        kid.setStatus("VERIFIED");
        kid.setParentId(parent.getId());
        userRepository.save(kid);
        return ResponseEntity.ok("Child account created");
    }

    // Allow parent to reset a child's password
    @PostMapping("/reset-child-password")
    public ResponseEntity<?> resetChildPassword(@AuthenticationPrincipal org.springframework.security.core.userdetails.User principal, @RequestBody ResetChildPasswordRequest req) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User parent = userRepository.findByEmail(principal.getUsername()).orElse(null);
        if (parent == null || parent.getRole() != User.UserRole.PARENT) {
            return ResponseEntity.status(403).body("Not authorized");
        }
        // Find the child by username and ensure they belong to this parent
        User child = userRepository.findByUsername(req.getChildUsername()).orElse(null);
        if (child == null || child.getParentId() == null || !child.getParentId().equals(parent.getId())) {
            return ResponseEntity.status(404).body("Child not found or not your child");
        }
        child.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(child);
        return ResponseEntity.ok("Child password reset successfully");
    }

}
