package com.example.prgi.web;

import com.example.prgi.domain.NewRegNewApplication;
import com.example.prgi.domain.NewRegDeficientApplication;
import com.example.prgi.repo.NewRegNewApplicationRepository;
import com.example.prgi.repo.NewRegDeficientApplicationRepository;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/new-registration")
@CrossOrigin(origins = "*")
public class NewRegistrationController {

    private final NewRegNewApplicationRepository newRepo;
    private final NewRegDeficientApplicationRepository defRepo;

    public NewRegistrationController(NewRegNewApplicationRepository newRepo, NewRegDeficientApplicationRepository defRepo) {
        this.newRepo = newRepo;
        this.defRepo = defRepo;
    }

    @GetMapping("/new-applications")
    public List<NewRegNewApplication> allNew() {
        return newRepo.findAll();
    }

    @GetMapping("/deficient")
    public List<NewRegDeficientApplication> allDeficient() {
        return defRepo.findAll();
    }
}
