package com.example.open.common.service;

import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProfileCheckerService {
    private final Environment environment;

    public boolean isProduction() {
        return environment.matchesProfiles("prod");
    }

    public boolean isDebug() {
        return environment.matchesProfiles("dev");
    }
}
