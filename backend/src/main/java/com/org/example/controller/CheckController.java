package com.org.example.controller;

import com.org.example.entities.User;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
public class CheckController {

    @GetMapping("/check")
    public String handler(){
        return "Dev Path Tracker working fine";
    }

    @GetMapping("/current_user")
    public String getLoggedInUser(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        if (principal instanceof User) {
            User user = (User) principal;
            Long id = user.getId();
            System.out.println("User ID: " + id);
            return user.getUsername() + " " + id;
        }
        return principal.toString();
    }

}
