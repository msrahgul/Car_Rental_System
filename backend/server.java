import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import java.util.List;
import java.util.Map;

@SpringBootApplication
@RestController
@CrossOrigin
public class CarRentalBackend {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public static void main(String[] args) {
        SpringApplication.run(CarRentalBackend.class, args);
    }

    // User login (Customer/Admin)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String userType = body.get("userType");
        String identifier = body.get("identifier");
        String password = body.get("password");

        try {
            if (userType.equals("customer")) {
                List<Map<String, Object>> results = jdbcTemplate.queryForList("SELECT customer_id, name FROM customers WHERE email = ? AND password = ?", identifier, password);
                if (!results.isEmpty()) {
                    return ResponseEntity.ok(Map.of("success", true, "message", "Customer login successful!", "userType", "customer", "customerId", results.get(0).get("customer_id"), "customerName", results.get(0).get("name")));
                }
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password"));
            } else if (userType.equals("admin")) {
                List<Map<String, Object>> results = jdbcTemplate.queryForList("SELECT admin_id FROM admins WHERE username = ? AND password = ?", identifier, password);
                if (!results.isEmpty()) {
                    return ResponseEntity.ok(Map.of("success", true, "message", "Admin login successful!", "userType", "admin", "adminId", results.get(0).get("admin_id")));
                }
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid username or password"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid user type"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Database error"));
        }
    }

    @GetMapping("/get-cars")
    public List<Map<String, Object>> getAvailableCars() {
        return jdbcTemplate.queryForList("SELECT * FROM cars WHERE status = 'Available'");
    }

}
