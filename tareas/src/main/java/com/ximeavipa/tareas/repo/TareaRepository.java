package com.ximeavipa.tareas.repo;

import com.ximeavipa.tareas.model.Tarea;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TareaRepository extends JpaRepository<Tarea, Long> {}
