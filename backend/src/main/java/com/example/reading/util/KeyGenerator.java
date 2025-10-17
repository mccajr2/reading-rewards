package com.example.reading.util;

import java.security.SecureRandom;
import java.util.Base64;

public class KeyGenerator {
    public static void main(String[] args) {
        SecureRandom sr = new SecureRandom();
        byte[] keyBytes = new byte[64]; // 64 bytes = 512 bits (good for HS512)
        sr.nextBytes(keyBytes);
        String base64 = Base64.getEncoder().encodeToString(keyBytes);
        System.out.println(base64); // store this string in your secret store / env var
    }
}
