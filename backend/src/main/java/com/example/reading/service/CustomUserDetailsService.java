package com.example.reading.service;

import com.example.reading.model.User;
import com.example.reading.repo.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.userdetails.User.UserBuilder;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Try to find by email first (for parents), then by username (for kids)
            User user;
            if (username.contains("@")) {
                // Parent account: use email
                user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new UsernameNotFoundException("Parent not found by email: " + username));
            } else {
                // Child account: use username
                user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new UsernameNotFoundException("Child not found by username: " + username));
            }
        UserBuilder builder = org.springframework.security.core.userdetails.User.withUsername(username)
            .password(user.getPassword())
            .roles(user.getRole().name());
        return builder.build();
    }
}
