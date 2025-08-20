package com.example.open.domain.dto;

import lombok.Data;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
public class ABase<T> {

    T aBaseItem;
}
