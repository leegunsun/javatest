package com.example.open.common.utile;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;
import org.springframework.util.ReflectionUtils;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.*;

@Component
public class ErrorCodeRegistry implements ApplicationRunner {

    @Autowired
    private DefaultListableBeanFactory beanFactory;

    private static final Map<Integer, String> codes = new HashMap<>();
    String basePackage = "com.example.open";

    public void init() {

        try {
            String path = basePackage.replace('.', '/');
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();

            Arrays.stream(resolver.getResources("classpath*:" + path + "/**/*.class"))
                    .map(resource -> {
                        try {
                            return extractClassName(resource.getURL().toString(), path);
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    })
                    .filter(this::isEnumClass)  // ✅ 추가된 'Enum' 필터링 로직
                    .forEach(this::loadEnumClass);

        } catch (IOException e) {
            throw new RuntimeException("패키지 스캔 실패: " + basePackage, e);
        }
    }

    // ✅ 클래스 이름 필터링 (경로에서 정확한 클래스명 추출)
    private String extractClassName(String url, String basePath) {
        String className = url.substring(url.indexOf(basePath)).replace('/', '.');
        return className.replace(".class", "");
    }

    // ✅ 'Enum' 클래스 여부 확인
    private boolean isEnumClass(String className) {
        try {
            Class<?> clazz = Class.forName(className);
            return clazz.isEnum();
        } catch (ClassNotFoundException e) {
            return false; // 존재하지 않는 클래스는 무시
        }
    }

    private void loadEnumClass(String className) {
        try {
            Class<?> clazz = Class.forName(className);

            Enum<?>[] errorCodes = (Enum<?>[]) clazz.getEnumConstants();
            addErrorCodes(errorCodes, clazz);

        } catch (ExceptionInInitializerError e) {
            throw new ExceptionInInitializerError(e.getMessage());
        } catch (ClassNotFoundException e) {
            throw new RuntimeException(e);
        }
    }

    private void addErrorCodes(Enum<?>[] errorCodes, Class<?> clazz) {
        for (Enum<?> errorCode : errorCodes) {
            Method getCodeMethod = ReflectionUtils.findMethod(clazz, "getCode");

            if (getCodeMethod == null) {
                throw new ExceptionInInitializerError(
                        clazz.getSimpleName() + " enum에 'getCode()' 메서드가 존재하지 않습니다."
                );
            }

            int code;
            try {
                code = (int) getCodeMethod.invoke(errorCode);
            } catch (ExceptionInInitializerError e) {
                throw new ExceptionInInitializerError(
                        clazz.getSimpleName() + " enum의 'getCode()' 호출 중 오류 발생");
            } catch (InvocationTargetException | IllegalAccessException e) {
                throw new RuntimeException(e);
            }

            if (codes.containsKey(code)) {
                throw new ExceptionInInitializerError(
                        "중복된 에러 코드 발견: " + code + " (" + clazz.getSimpleName() + ")"
                );
            }

            codes.put(code, errorCode.name());
        }
    }

    private void checkBeanStatus(DefaultListableBeanFactory beanFactory, String beanName) {
        boolean exists = beanFactory.containsBeanDefinition(beanName);
        System.out.println(beanName + " 등록 상태: " + (exists ? "✅ 등록됨" : "❌ 등록되지 않음"));
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        checkBeanStatus(beanFactory, "errorCodeRegistry");
        init();

        // 빈 제거
        if (beanFactory.containsBeanDefinition("errorCodeRegistry")) {
            beanFactory.removeBeanDefinition("errorCodeRegistry");
            System.out.println("❌ CustomErrorTest 빈이 제거되었습니다.");
        }

        // 빈 제거 후 상태 확인
        checkBeanStatus(beanFactory, "errorCodeRegistry");
    }
}