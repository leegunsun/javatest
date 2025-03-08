package com.example.open.common.utile;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;
import org.springframework.util.ReflectionUtils;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.*;
@Component
@RequiredArgsConstructor
public class ErrorCodeRegistry implements ApplicationRunner {

    private record ClassHistory(String className, String constName) {}

    private final DefaultListableBeanFactory beanFactory;
    private static final String BEAN_NAME = "errorCodeRegistry";
    private static final Map<Integer, ClassHistory> codes = new HashMap<>();
    private final String basePackage = "com.example.open.common.utile";

    @Override
    public void run(ApplicationArguments args) throws Exception {
        checkBeanStatus();
        init();
        removeBean();
        checkBeanStatus();
    }

    public void init() {
        String path = basePackage.replace('.', '/');
        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources("classpath*:" + path + "/**/*.class");

            for (Resource resource : resources) {
                String resourceUrl = resource.getURL().toString();
                if (!resourceUrl.endsWith(".class")) {
                    continue;
                }
                String className = extractClassName(resourceUrl, path);
                if (isEnumClass(className)) {
                    processEnumClass(className);
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("패키지 스캔 실패: " + basePackage, e);
        }
    }

    private String extractClassName(String url, String basePath) {
        return url.substring(url.indexOf(basePath))
                .replace('/', '.')
                .replace(".class", "");
    }

    private boolean isEnumClass(String className) {
        try {
            Class<?> clazz = Class.forName(className, true, Thread.currentThread().getContextClassLoader());
            return clazz.isEnum();
        } catch (ClassNotFoundException e) {
            return false;
        }
    }

    private void processEnumClass(String className) {
        try {
            Class<?> clazz = Class.forName(className);
            Enum<?>[] enumConstants = (Enum<?>[]) clazz.getEnumConstants();

            // getCode 메서드를 한 번만 조회
            Method getCodeMethod = ReflectionUtils.findMethod(clazz, "getCode");
            if (getCodeMethod == null) {
                throw new ExceptionInInitializerError(
                        clazz.getSimpleName() + " enum에 'getCode()' 메서드가 존재하지 않습니다."
                );
            }

            for (Enum<?> errorCode : enumConstants) {
                int code = (int) getCodeMethod.invoke(errorCode);
                if (codes.containsKey(code)) {
                    ClassHistory existing = codes.get(code);
                    String errorMessage = String.format(
                            "❗ [중복으로 설정된 오류코드 발견] ❗ %s (%s) - %s (%s) : 중복된 오류코드: %s",
                            existing.className(), existing.constName(), clazz.getSimpleName(), errorCode.name(), code
                    );
                    throw new ExceptionInInitializerError(errorMessage);
                }
                codes.put(code, new ClassHistory(clazz.getSimpleName(), errorCode.name()));
            }
        } catch (ClassNotFoundException | InvocationTargetException | IllegalAccessException e) {
            throw new RuntimeException(e);
        }
    }

    private void checkBeanStatus() {
        boolean exists = beanFactory.containsBeanDefinition(BEAN_NAME);
        System.out.println(BEAN_NAME + " 등록 상태: " + (exists ? "✅ 등록됨" : "❌ 등록되지 않음"));
    }

    private void removeBean() {
        if (beanFactory.containsBeanDefinition(BEAN_NAME)) {
            if (beanFactory.containsSingleton(BEAN_NAME)) {
                beanFactory.destroySingleton(BEAN_NAME);
            }
            beanFactory.removeBeanDefinition(BEAN_NAME);
            System.out.println("❌ CustomErrorTest 빈이 제거되었습니다.");
        }
    }
}
