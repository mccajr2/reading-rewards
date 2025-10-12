package com.example.reading.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

@Configuration
public class SecurityConfig {
    private static final String JWT_SECRET = "change_this_secret_change_this_secret_32bytes_minimum!";
    private static final SecretKey JWT_KEY = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> {
                })
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authz -> authz
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/signup").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/create-child").hasRole("PARENT")
                        .anyRequest().authenticated())
                .addFilterBefore(new JwtAuthFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    public static class JwtAuthFilter extends OncePerRequestFilter {
        @Override
        protected boolean shouldNotFilter(@org.springframework.lang.NonNull HttpServletRequest request)
                throws ServletException {
            String path = request.getRequestURI();
            return path.equals("/api/auth/signup") || path.equals("/api/auth/login");
        }

        @Override
        protected void doFilterInternal(
                @org.springframework.lang.NonNull HttpServletRequest request,
                @org.springframework.lang.NonNull HttpServletResponse response,
                @org.springframework.lang.NonNull FilterChain chain)
                throws ServletException, IOException {
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);
                try {
                    Claims claims = io.jsonwebtoken.Jwts.parser()
                            .verifyWith(JWT_KEY)
                            .build()
                            .parseSignedClaims(token)
                            .getPayload();
                    String userId = claims.getSubject();
                    String role = (String) claims.get("role");
                    System.out.println("[JwtAuthFilter] userId=" + userId + ", role=" + role + ", path="
                            + request.getRequestURI());
                    java.util.List<org.springframework.security.core.GrantedAuthority> authorities = new java.util.ArrayList<>();
                    if (role != null) {
                        authorities.add(
                                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role));
                    }
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            userId, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    request.setAttribute("userId", userId);
                    request.setAttribute("role", role);
                } catch (Exception e) {
                    System.out.println("[JwtAuthFilter] JWT parse error: " + e.getMessage());
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    return;
                }
            }
            chain.doFilter(request, response);
        }
    }
}
