package com.ats.auth.controller;

import com.ats.auth.model.User;
import com.ats.auth.model.Candidate;
import com.ats.auth.repository.UserRepository;
import com.ats.auth.repository.CandidateRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${jwt.secret}")
    private String secret;

    @PostMapping("/register")
    public Map<String, String> register(@RequestBody User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userRepository.save(user);
        
        // Le profil candidat sera créé dans l'étape 2 via le formulaire dédié
        
        // Generate token for the newly registered user
        String token = Jwts.builder()
                .setSubject(savedUser.getEmail())
                .claim("role", savedUser.getRole())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)), SignatureAlgorithm.HS256)
                .compact();

        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        response.put("role", savedUser.getRole());
        response.put("userId", savedUser.getId().toString());
        return response;
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody User user) {
        User foundUser = userRepository.findByEmail(user.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (passwordEncoder.matches(user.getPassword(), foundUser.getPassword())) {
            String token = Jwts.builder()
                    .setSubject(foundUser.getEmail())
                    .claim("role", foundUser.getRole())
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + 86400000))
                    .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)), SignatureAlgorithm.HS256)
                    .compact();

            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("role", foundUser.getRole());
            response.put("userId", foundUser.getId().toString());
            return response;
        }
        throw new RuntimeException("Invalid credentials");
    }

    // ========== CRUD Users ==========
    
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/users/{id}")
    public User getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    @GetMapping("/users/email/{email}")
    public User getUserByEmail(@PathVariable String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    @PostMapping("/users")
    public User createUser(@RequestBody User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @PutMapping("/users/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        user.setEmail(userDetails.getEmail());
        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }
        user.setRole(userDetails.getRole());
        
        return userRepository.save(user);
    }

    @DeleteMapping("/users/{id}")
    public String deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return "User deleted successfully";
    }

    // ========== CRUD Candidates ==========
    
    @GetMapping("/candidates")
    public List<Candidate> getAllCandidates() {
        return candidateRepository.findAll();
    }

    @GetMapping("/candidates/debug")
    public Map<String, Object> debugCandidates() {
        List<Candidate> allCandidates = candidateRepository.findAll();
        Map<String, Object> debug = new HashMap<>();
        debug.put("total", allCandidates.size());
        debug.put("candidates", allCandidates);
        
        // Group by userId to find duplicates
        Map<String, Long> userIdCounts = allCandidates.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                Candidate::getUserId, 
                java.util.stream.Collectors.counting()
            ));
        
        Map<String, Long> duplicates = userIdCounts.entrySet().stream()
            .filter(entry -> entry.getValue() > 1)
            .collect(java.util.stream.Collectors.toMap(
                Map.Entry::getKey, 
                Map.Entry::getValue
            ));
        
        debug.put("duplicates", duplicates);
        return debug;
    }

    @GetMapping("/candidates/{id}")
    public Candidate getCandidateById(@PathVariable Long id) {
        return candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found with id: " + id));
    }

    @GetMapping("/candidates/user/{userId}")
    public Candidate getCandidateByUserId(@PathVariable String userId) {
        List<Candidate> candidates = candidateRepository.findAllByUserId(userId);
        if (candidates.isEmpty()) {
            throw new RuntimeException("Candidate not found with userId: " + userId);
        }
        // Retourner le candidat le plus récent (avec l'ID le plus élevé)
        return candidates.get(candidates.size() - 1);
    }

    @PostMapping("/candidates")
    public Candidate createCandidate(@RequestBody Candidate candidate) {
        // Vérifier s'il existe déjà des candidats avec ce userId et les supprimer
        List<Candidate> existingCandidates = candidateRepository.findAllByUserId(candidate.getUserId());
        for (Candidate existing : existingCandidates) {
            candidateRepository.delete(existing);
        }
        
        return candidateRepository.save(candidate);
    }

    @PutMapping("/candidates/{id}")
    public Candidate updateCandidate(@PathVariable Long id, @RequestBody Candidate candidateDetails) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found with id: " + id));
        
        candidate.setUserId(candidateDetails.getUserId());
        candidate.setFullName(candidateDetails.getFullName());
        candidate.setEmail(candidateDetails.getEmail());
        candidate.setPhone(candidateDetails.getPhone());
        candidate.setSkills(candidateDetails.getSkills());
        candidate.setExperience(candidateDetails.getExperience());
        
        return candidateRepository.save(candidate);
    }

    @DeleteMapping("/candidates/{id}")
    public String deleteCandidate(@PathVariable Long id) {
        candidateRepository.deleteById(id);
        return "Candidate deleted successfully";
    }
}
