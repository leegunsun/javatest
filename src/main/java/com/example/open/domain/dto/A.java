package com.example.open.domain.dto;

import lombok.*;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
public class A extends ABase<AExtends>{

    String aTest;

}
