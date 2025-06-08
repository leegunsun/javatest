package com.example.open.domain.todo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.LocalDateTime;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home(Model model) {

        LocalDateTime localDateTime = LocalDateTime.now();

        model.addAttribute("username", "개발자홍길동");
        model.addAttribute("message", "Thymeleaf를 환영합니다!");
        model.addAttribute("name", "name!");
//        model.addAttribute("time", localDateTime);
        return "home"; // → templates/home.html 렌더링
    }
}