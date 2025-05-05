package com.example.open.common.utile;


import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.util.Map;

@Component
public class ApiWorkStateLabel {

    // ✅ 이모티콘: 내부 출력용 (static final 유지)
    public static final String WORKING = "🔧";
    public static final String OK = "✅";
    public static final String UPDATE = "⬆️";
    public static final String NOT_WORKING = "⛔";
    public static final String TEST = "🧪";
    public static final String TEST_COMPLETE = "🟩";
    public static final String TEST_FAIL = "❌";
    public static final String TEST_SUCCESS = "🎉";

    // ✅ JSON 저장용 텍스트 (static final 유지)
    private static final String WORKING_TEXT = "작업중";
    private static final String OK_TEXT = "작업완료";
    private static final String UPDATE_TEXT = "업데이트";
    private static final String NOT_WORKING_TEXT = "작업안함";
    private static final String TEST_TEXT = "테스트중";
    private static final String TEST_COMPLETE_TEXT = "테스트완료";
    private static final String TEST_FAIL_TEXT = "테스트실패";
    private static final String TEST_SUCCESS_TEXT = "테스트성공";

//    // ✅ JSON으로 출력될 값만 Map에 구성
//    @PostConstruct
//    public void exportApiWorkStateJson() throws IOException {
//        Map<String, String> exportTextMap = Map.of(
//                WORKING, WORKING_TEXT,
//                OK, OK_TEXT,
//                UPDATE, UPDATE_TEXT,
//                NOT_WORKING, NOT_WORKING_TEXT,
//                TEST, TEST_TEXT,
//                TEST_COMPLETE, TEST_COMPLETE_TEXT,
//                TEST_FAIL, TEST_FAIL_TEXT,
//                TEST_SUCCESS, TEST_SUCCESS_TEXT
//        );
//
//        ObjectMapper mapper = new ObjectMapper();
//        File file = new File("src/main/resources/static/swagger-status/api-status.json");
//
//        // ✅ 디렉터리 없으면 생성
//        File parentDir = file.getParentFile();
//        if (!parentDir.exists()) {
//            boolean created = parentDir.mkdirs();
//            if (created) {
//                System.out.println("📁 디렉터리 생성됨: " + parentDir.getAbsolutePath());
//            } else {
//                System.out.println("⚠️ 디렉터리 생성 실패: " + parentDir.getAbsolutePath());
//            }
//        }
//
//        mapper.writeValue(file, exportTextMap);
//        System.out.println("✅ JSON 파일 생성됨: " + file.getAbsolutePath());
//    }

    // ✅ 화면 출력 등에서 이모티콘과 텍스트를 함께 보여주고 싶을 경우
    public static String getDisplayLabel(String code) {
        return switch (code) {
            case "WORKING" -> WORKING + " " + WORKING_TEXT;
            case "OK" -> OK + " " + OK_TEXT;
            case "UPDATE" -> UPDATE + " " + UPDATE_TEXT;
            case "NOT_WORKING" -> NOT_WORKING + " " + NOT_WORKING_TEXT;
            case "TEST" -> TEST + " " + TEST_TEXT;
            case "TEST_COMPLETE" -> TEST_COMPLETE + " " + TEST_COMPLETE_TEXT;
            case "TEST_FAIL" -> TEST_FAIL + " " + TEST_FAIL_TEXT;
            case "TEST_SUCCESS" -> TEST_SUCCESS + " " + TEST_SUCCESS_TEXT;
            default -> code;
        };
    }
}