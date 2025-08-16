package com.ximeavipa.tareas.web;

import com.ximeavipa.tareas.model.Tarea;
import com.ximeavipa.tareas.repo.TareaRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tareas")
@CrossOrigin(origins = "*") // permite llamadas del frontend
public class TareaController {

    private final TareaRepository repo;

    public TareaController(TareaRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Tarea> listar() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tarea> obtener(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Tarea> crear(@Valid @RequestBody Tarea t) {
        return ResponseEntity.ok(repo.save(t));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tarea> actualizar(
            @PathVariable Long id, @Valid @RequestBody Tarea t) {
        return repo.findById(id).map(ex -> {
            ex.setTitulo(t.getTitulo());
            ex.setDescripcion(t.getDescripcion());
            ex.setEstado(t.getEstado());
            return ResponseEntity.ok(repo.save(ex));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
