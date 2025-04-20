package com.example.open;

import com.example.open.common.utile.CustomErrorCode;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
public class OpenApplication {

	public static void main(String[] args) {
		SpringApplication.run(OpenApplication.class, args);
	}

}
