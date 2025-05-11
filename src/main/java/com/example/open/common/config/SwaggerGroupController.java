package com.example.open.common.config;

import lombok.RequiredArgsConstructor;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Profile("!prod") // !!! prod 환경에서는 사용하지 않음
@RestController
@RequiredArgsConstructor
public class SwaggerGroupController {

    public record GroupedOpenApiResponse(
            String group,
            String displayName,
            String parentGroup
    ) {}

    private final List<GroupedOpenApi> groupedApis;

    @GetMapping("/swagger-status/grouped-openapi-list")
    public List<GroupedOpenApiResponse> getGroupedOpenApiList() {
        return groupedApis.stream()
                .map(api -> {
                    String group = api.getGroup();
                    String parent = group.contains(".") ? group.substring(0, group.lastIndexOf(".")) : null;
                    return new GroupedOpenApiResponse(group, api.getDisplayName(), parent);
                })
                .toList();
    }
}
