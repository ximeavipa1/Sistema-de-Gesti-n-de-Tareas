package com.ximeavipa.tareas.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor
public class Tarea {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String titulo;

    private String descripcion;

    @Column(nullable = false)
    private String estado = "Pendiente"; // Pendiente | En Progreso | Hecha
}
