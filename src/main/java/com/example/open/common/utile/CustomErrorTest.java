package com.example.open.common.utile;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;


//@Component
public class CustomErrorTest {

//    // 🔥 private 생성자로 직접 인스턴스 생성 차단
//    private CustomErrorTest() {}
//
//    @Autowired
//    private ConfigurableApplicationContext context;
//
//    @Override
//    public void run(ApplicationArguments args) throws Exception {
//        // 강제로 초기화합니다.
//        new EnumSum();
////        System.out.println("Enum 초기화 완료: " + codes.length + " 개의 항목 로드");
//
//        // 안전한 시점에서 removeSelf() 실행
//        removeSelf();
//    }
//
//    private void removeSelf() {
//        context.getBeanFactory().destroyBean(this);
//        System.out.println("CustomErrorTest Bean이 제거되었습니다.");
//    }
//
//    @Override
//    public void execute() {
//        System.out.println("CustomErrorTest 실행됨");
//    }
}
