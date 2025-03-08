package com.example.open.common.utile;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class ErrorCodeRegistry implements ApplicationRunner {

    private record ErrorClassInfo(String enumClassName, String enumConstantName) {}
    public record DuplicateErrorDetails(String firstEnumClass, String firstEnumConstant, String secondEnumClass, String secondEnumConstant, String errorCode) {}

    private final DefaultListableBeanFactory beanFactory;
    private static final String BEAN_NAME = "errorCodeRegistry";
    private static final Map<Integer, ErrorClassInfo> codes = new HashMap<>();
    private static final List<DuplicateErrorDetails> duplicateErrors = new ArrayList<>();  // 중복된 오류 리스트 추가

    @Override
    public void run(ApplicationArguments args) throws Exception {
//        checkBeanStatus();
        init();
        validateDuplicateErrors(); // 추가된 로직
        removeBean();
//        checkBeanStatus();
    }

    public void init() {
        String basePackage = "com.example.open.common.utile";
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

            Method getCodeMethod = ReflectionUtils.findMethod(clazz, "getCode");
            if (getCodeMethod == null) {
                throw new ExceptionInInitializerError(
                        clazz.getSimpleName() + " enum에 'getCode()' 메서드가 존재하지 않습니다."
                );
            }

            for (Enum<?> errorCode : enumConstants) {
                int code = (int) getCodeMethod.invoke(errorCode);

                if (codes.containsKey(code)) {
                    ErrorClassInfo existing = codes.get(code);
                    DuplicateErrorDetails duplicateErrorDetails = new DuplicateErrorDetails(existing.enumClassName(), existing.enumConstantName(), clazz.getSimpleName(), errorCode.name(), String.valueOf(code));
                    duplicateErrors.add(duplicateErrorDetails);  // 중복된 오류 리스트에 추가
                } else {
                    codes.put(code, new ErrorClassInfo(clazz.getSimpleName(), errorCode.name()));
                }
            }
        } catch (ClassNotFoundException | InvocationTargetException | IllegalAccessException e) {
            throw new RuntimeException(e);
        }
    }

    // ANSI 색상 코드 정의
    private static final String RED = "\u001B[31m";
    private static final String BRIGHT_RED = "\u001B[38;5;196m"; // 강렬한 빨간색
    private static final String MAGENTA = "\u001B[35m";
    private static final String GREEN = "\u001B[32m";
    private static final String RESET = "\u001B[0m";
    private static final String PINK_256 = "\u001B[38;5;206m"; // 밝은 핑크

    private void validateDuplicateErrors() {
        if (!duplicateErrors.isEmpty()) {
            System.out.printf("%-31s❌❌❌ %-30s 중복 오류코드 발견 목록 %-22s ❌❌❌%n%s",
                    RED, "", "", RESET);

            printSeparator();
            System.out.printf("%-25s  %-25s  %-25s  %-25s  %-25s%n",
                    "중복된 오류 코드", "첫번째 사용 클래스", "상수 이름", "중복된 클래스", "상수 이름");
            printSeparator();

            for (DuplicateErrorDetails errorMessage : duplicateErrors) {
                printRow(List.of(
                        BRIGHT_RED + errorMessage.errorCode + RESET,
                        MAGENTA + errorMessage.firstEnumClass + RESET,
                        MAGENTA + errorMessage.firstEnumConstant + RESET,
                        PINK_256 + errorMessage.secondEnumClass + RESET,
                        PINK_256 + errorMessage.secondEnumConstant + RESET
                ));
            }

            printSeparator();
        }
    }

    // ANSI 제거를 위한 정규표현식
    private static final Pattern ANSI_ESCAPE_PATTERN = Pattern.compile("\u001B\\[[;\\d]*m");

    // 가변 데이터 길이를 반영하여 열 너비 자동 계산
    private void printRow(List<String> row) {
        int[] columnWidths = {20, 30, 30, 30, 30};

        for (int i = 0; i < row.size(); i++) {
            String cell = row.get(i);
            System.out.printf("| %-"+ columnWidths[i] +"s", padText(cell, columnWidths[i]));
        }
        System.out.println("|");
    }

    // 구분선 출력
    private void printSeparator() {
        System.out.println("------------------------------------------------------------------------------------------------------------------------------------------------------------------");
    }

    // ANSI 제거 후 문자열의 실제 길이 측정 + 공백 추가
    private String padText(String text, int targetLength) {
        int actualLength = ANSI_ESCAPE_PATTERN.matcher(text).replaceAll("").length();
        int padding = Math.max(0, targetLength - actualLength);
        return text + " ".repeat(padding);
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
//            System.out.println("❌ " + BEAN_NAME + "빈이 제거되었습니다.");
        }
    }
}
