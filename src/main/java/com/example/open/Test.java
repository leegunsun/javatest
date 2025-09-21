package com.example.open;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collector;
import java.util.stream.Stream;
import java.util.stream.Collectors;

class Person {
    String name;
    int age;
    String department;
    double salary;

    Person(String name, int age, String department, double salary) {
        this.name = name;
        this.age = age;
        this.department = department;
        this.salary = salary;
    }

    @Override
    public String toString() {
        return String.format("%s(%d, %s, %.0f)", name, age, department, salary);
    }

    // Getters
    public String getName() { return name; }
    public int getAge() { return age; }
    public String getDepartment() { return department; }
    public double getSalary() { return salary; }
}

public class Test {

    public static void main(String[] args) {
        List<Person> people = Arrays.asList(
            new Person("김철수", 25, "개발", 5000),
            new Person("이영희", 30, "디자인", 4500),
            new Person("박민수", 28, "개발", 5500),
            new Person("최지은", 35, "마케팅", 4800),
            new Person("정하늘", 27, "개발", 5200),
            new Person("한솔", 32, "디자인", 4700)
        );

        System.out.println("=== 1. 기본 컬렉션 변환 ===");

        // List로 수집
        List<String> names = people.stream()
            .map(Person::getName)
            .toList();
        System.out.println("이름 리스트: " + names);

        // Set으로 수집 (중복 제거)
        Set<String> departments = people.stream()
            .map(Person::getDepartment)
            .collect(Collectors.toSet());
        System.out.println("부서 집합: " + departments);

        // TreeSet으로 수집 (정렬된 집합)
        TreeSet<String> sortedNames = people.stream()
            .map(Person::getName)
            .collect(Collectors.toCollection(TreeSet::new));
        System.out.println("정렬된 이름: " + sortedNames);

        System.out.println("\n=== 2. Map 변환 ===");

        // 이름을 키로 하는 Map
        Map<String, Person> nameToPersonMap = people.stream()
            .collect(Collectors.toMap(Person::getName, Function.identity()));
        System.out.println("이름->사람 맵: " + nameToPersonMap);

        // 부서별 첫 번째 사람
        Map<String, Person> deptToFirstPerson = people.stream()
            .collect(Collectors.toMap(
                Person::getDepartment,
                Function.identity(),
                (existing, replacement) -> existing // 중복 키 처리
            ));
        System.out.println("부서별 첫 번째 사람: " + deptToFirstPerson);

        System.out.println("\n=== 3. 그룹핑 (groupingBy) ===");

        // 부서별 그룹핑
        Map<String, List<Person>> peopleByDept = people.stream()
            .collect(Collectors.groupingBy(Person::getDepartment));
        System.out.println("부서별 직원:");
        peopleByDept.forEach((dept, persons) ->
            System.out.println("  " + dept + ": " + persons));

        // 나이대별 그룹핑
        Map<String, List<Person>> peopleByAgeGroup = people.stream()
            .collect(Collectors.groupingBy(person ->
                person.getAge() < 30 ? "20대" : "30대"));
        System.out.println("나이대별 직원:");
        peopleByAgeGroup.forEach((ageGroup, persons) ->
            System.out.println("  " + ageGroup + ": " + persons));

        System.out.println("\n=== 4. 다운스트림 컬렉터 활용 ===");

        // 부서별 인원수
        Map<String, Long> countByDept = people.stream()
            .collect(Collectors.groupingBy(
                Person::getDepartment,
                Collectors.counting()));
        System.out.println("부서별 인원수: " + countByDept);

        // 부서별 평균 연봉
        Map<String, Double> avgSalaryByDept = people.stream()
            .collect(Collectors.groupingBy(
                Person::getDepartment,
                Collectors.averagingDouble(Person::getSalary)));
        System.out.println("부서별 평균 연봉: " + avgSalaryByDept);

        // 부서별 최고 연봉자
        Map<String, Optional<Person>> topEarnerByDept = people.stream()
            .collect(Collectors.groupingBy(
                Person::getDepartment,
                Collectors.maxBy(Comparator.comparing(Person::getSalary))));
        System.out.println("부서별 최고 연봉자:");
        topEarnerByDept.forEach((dept, person) ->
            System.out.println("  " + dept + ": " + person.orElse(null)));

        // 부서별 이름 목록
        Map<String, List<String>> namesByDept = people.stream()
            .collect(Collectors.groupingBy(
                Person::getDepartment,
                Collectors.mapping(Person::getName, Collectors.toList())));
        System.out.println("부서별 이름 목록: " + namesByDept);

        System.out.println("\n=== 5. 파티셔닝 (partitioningBy) ===");

        // 연봉 5000 이상/미만으로 분할
        Map<Boolean, List<Person>> partitionedBySalary = people.stream()
            .collect(Collectors.partitioningBy(person -> person.getSalary() >= 5000));
        System.out.println("고연봉자(5000이상): " + partitionedBySalary.get(true));
        System.out.println("저연봉자(5000미만): " + partitionedBySalary.get(false));

        System.out.println("\n=== 6. 통계 및 요약 ===");

        // 문자열 연결
        String allNames = people.stream()
            .map(Person::getName)
            .collect(Collectors.joining(", "));
        System.out.println("모든 이름: " + allNames);

        // 접두사/접미사와 함께 연결
        String nameList = people.stream()
            .map(Person::getName)
            .collect(Collectors.joining(", ", "[", "]"));
        System.out.println("이름 목록: " + nameList);

        // 통계 수집
        DoubleSummaryStatistics salaryStats = people.stream()
            .collect(Collectors.summarizingDouble(Person::getSalary));
        System.out.println("연봉 통계: " + salaryStats);

        System.out.println("\n=== 7. 고급 컬렉터 조합 ===");

        // 부서별 연봉 통계
        Map<String, DoubleSummaryStatistics> salaryStatsByDept = people.stream()
            .collect(Collectors.groupingBy(
                Person::getDepartment,
                Collectors.summarizingDouble(Person::getSalary)));
        System.out.println("부서별 연봉 통계:");
        salaryStatsByDept.forEach((dept, stats) ->
            System.out.println("  " + dept + ": " + stats));

        // 다중 그룹핑 (부서 -> 나이대)
        Map<String, Map<String, List<Person>>> multiGrouping = people.stream()
            .collect(Collectors.groupingBy(
                Person::getDepartment,
                Collectors.groupingBy(person ->
                    person.getAge() < 30 ? "20대" : "30대")));
        System.out.println("부서별 나이대별 그룹핑:");
        multiGrouping.forEach((dept, ageGroups) -> {
            System.out.println("  " + dept + ":");
            ageGroups.forEach((ageGroup, persons) ->
                System.out.println("    " + ageGroup + ": " + persons));
        });

        System.out.println("\n=== 8. 커스텀 컬렉터 ===");

        // 직접 Collector 생성 (이름들을 역순으로 연결)
        String reversedNames = people.stream()
            .map(Person::getName)
            .collect(Collector.of(
                StringBuilder::new,                    // supplier
                (sb, name) -> sb.insert(0, name + " "), // accumulator
                (sb1, sb2) -> sb1.insert(0, sb2),     // combiner
                StringBuilder::toString                 // finisher
            ));
        System.out.println("역순 이름 연결: " + reversedNames);

        System.out.println("\n=== 9. 실용적인 예제 ===");

        // 부서별 평균 연봉보다 높은 연봉을 받는 사람들
        Map<String, Double> avgSalariesByDept = people.stream()
            .collect(Collectors.groupingBy(
                Person::getDepartment,
                Collectors.averagingDouble(Person::getSalary)));

        Map<String, List<Person>> aboveAvgByDept = people.stream()
            .filter(person -> person.getSalary() > avgSalariesByDept.get(person.getDepartment()))
            .collect(Collectors.groupingBy(Person::getDepartment));

        System.out.println("부서별 평균 연봉을 초과하는 직원들:");
        aboveAvgByDept.forEach((dept, persons) ->
            System.out.println("  " + dept + ": " + persons));
    }
}
