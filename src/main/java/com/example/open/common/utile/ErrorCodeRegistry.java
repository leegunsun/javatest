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
@RequiredArgsConstructor
public class ErrorCodeRegistry implements ApplicationRunner {

    @RequiredArgsConstructor
    private static class ClassHistory {
        private final String className;
        private final String constName;
    }

    private final DefaultListableBeanFactory beanFactory;
    private static final String BEAN_NAME = "errorCodeRegistry";
    
    private static final Map<Integer ,ClassHistory> codes = new HashMap<>();
    String basePackage = "com.example.open.common.utile";

    public void init() {

        try {
            String path = basePackage.replace('.', '/');
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();

            Arrays.stream(resolver.getResources("classpath*:" + path + "/**/*.class"))
                    .filter(resource -> {
                        try {
                            return resource.getURL().toString().endsWith(".class");
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    })
                    .map(resource -> {
                        try {
                            return extractClassName(resource.getURL().toString(), path);
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    })
                    .filter(this::isEnumClass)
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
            Class<?> clazz = Class.forName(className, true, Thread.currentThread().getContextClassLoader());
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
                String existingConstName = codes.get(code).constName; // 기존에 등록된 상수명
                String existingConstClass = codes.get(code).className; // 기존에 등록된 상수명

                String errorMessage = String.format(
                        "❗ [중복 오류코드 발견] ❗ " +
                                "- 중복된 열거형 상수: %s ( %s )" +
                                "- 오류코드: %s " +
                                "- 중복이 감지된 상수: %s ( %s )",
                        existingConstClass, existingConstName, code, clazz.getSimpleName(), errorCode.name()
                );

                throw new ExceptionInInitializerError(errorMessage);
            }

            codes.put(code, new ClassHistory(clazz.getSimpleName(), errorCode.name()) );
        }
    }

    private void checkBeanStatus(DefaultListableBeanFactory beanFactory, String beanName) {
        boolean exists = beanFactory.containsBeanDefinition(beanName);
        System.out.println(beanName + " 등록 상태: " + (exists ? "✅ 등록됨" : "❌ 등록되지 않음"));
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        checkBeanStatus(beanFactory, BEAN_NAME);
        init();

        // 빈 제거 (안전한 순서)
        if (beanFactory.containsBeanDefinition(BEAN_NAME)) {
            if (beanFactory.containsSingleton(BEAN_NAME)) {
                beanFactory.destroySingleton(BEAN_NAME); // 1. 싱글톤 빈 제거
            }
            beanFactory.removeBeanDefinition(BEAN_NAME); // 2. 빈 정의 제거
            System.out.println("❌ CustomErrorTest 빈이 제거되었습니다.");
        }

        // 빈 제거 후 상태 확인
        checkBeanStatus(beanFactory, BEAN_NAME);
    }
}