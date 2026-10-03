package com.org.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DevPathTrackerApplication {

	public static void main(String[] args) {
		SpringApplication.run(DevPathTrackerApplication.class, args);
		System.out.println("Dev Path Tracker works!!");
	}

}
