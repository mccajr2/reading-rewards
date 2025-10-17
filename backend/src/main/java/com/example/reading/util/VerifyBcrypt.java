package com.example.reading.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class VerifyBcrypt {
    public static void main(String[] args) {
        //String rawPassword = "test"; // change to your test password
        //String hash = "$2a$10$Q9QwQwQwQwQwQwQwQwQwQOeQwQwQwQwQwQwQwQwQwQwQwQwQwQwQw"; // replace with your DB hash

        String rawPassword = "password123";
        String hash = "$2a$10$0O.Sn4J4a6uZwT4AsqE0UeT9nGkb9HxBGKdWDLD9FAdofyJy/ZiBC";

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

                System.out.println(encoder.encode("password123"));


        boolean matches = encoder.matches(rawPassword, hash);
        System.out.println("Password matches hash: " + matches);
    }
}