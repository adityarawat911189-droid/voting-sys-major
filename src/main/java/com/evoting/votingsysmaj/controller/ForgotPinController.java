package com.evoting.votingsysmaj.controller;

import com.evoting.votingsysmaj.pojo.MockVoter;
import com.evoting.votingsysmaj.repository.MockVoterRepository;
import com.evoting.votingsysmaj.service.OtpService;
import com.evoting.votingsysmaj.util.PinGuard;
import com.evoting.votingsysmaj.util.PinResetTokenStore;
import com.evoting.votingsysmaj.util.RateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth/forgot-pin")
public class ForgotPinController {

    private static final Logger log = LoggerFactory.getLogger(ForgotPinController.class);

    private final MockVoterRepository voters;
    private final OtpService otp;
    private final PinResetTokenStore tokens;
    private final RateLimiter limiter;
    private final PasswordEncoder encoder;
    private final PinGuard pinGuard;                                   // <-- CHANGE 1: field

    public ForgotPinController(MockVoterRepository voters, OtpService otp,
                               PinResetTokenStore tokens, RateLimiter limiter,
                               PasswordEncoder encoder, PinGuard pinGuard) {   // <-- CHANGE 2: parameter
        this.voters = voters;
        this.otp = otp;
        this.tokens = tokens;
        this.limiter = limiter;
        this.encoder = encoder;
        this.pinGuard = pinGuard;                                      // <-- CHANGE 2: assign
    }

    private static ResponseEntity<?> msg(int status, String m) {
        return ResponseEntity.status(status).body(Map.of("message", m));
    }

    private Optional<MockVoter> registeredVoter(String contactNo) {
        return voters.findByContactNo(contactNo)
                .filter(v -> Boolean.TRUE.equals(v.getRegistered()));
    }

    @PostMapping("/send")
    public ResponseEntity<?> send(@RequestBody Map<String, String> body, HttpServletRequest req) {
        String c = body.getOrDefault("contactNo", "");
        if (!c.matches("\\d{10}")) return msg(400, "Enter a valid 10-digit mobile number.");

        if (!limiter.allow("send:" + c, 3, Duration.ofHours(1))
                || !limiter.allow("sendip:" + req.getRemoteAddr(), 10, Duration.ofHours(1)))
            return msg(429, "Too many attempts.");

        // Registered ho ya na ho, response same (kaun voter hai ye leak na ho)
        if (registeredVoter(c).isPresent()) {
            try {
                otp.sendOtp(c);
            } catch (Exception e) {
                log.error("Twilio send failed for {}: {}", c, e.getMessage());
            }
        }
        return ResponseEntity.ok(Map.of("message", "If this number is registered, an OTP has been sent."));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> body) {
        String c = body.getOrDefault("contactNo", "");
        String code = body.getOrDefault("code", "");
        if (!c.matches("\\d{10}") || !code.matches("\\d{4,8}")) return msg(400, "Invalid request.");
        if (!limiter.allow("verify:" + c, 5, Duration.ofMinutes(10))) return msg(429, "Too many attempts.");

        boolean ok = registeredVoter(c).isPresent() && otp.checkOtp(c, code);
        if (!ok) return msg(401, "Wrong or expired OTP.");

        return ResponseEntity.ok(Map.of("resetToken", tokens.issue(c)));
    }

    @PostMapping("/reset")
    public ResponseEntity<?> reset(@RequestBody Map<String, String> body) {
        String c = body.getOrDefault("contactNo", "");
        String token = body.getOrDefault("resetToken", "");
        String newPin = body.getOrDefault("newPin", "");

        if (!newPin.matches("\\d{4,6}")) return msg(400, "PIN must be 4 to 6 digits.");
        if (!tokens.consume(token, c)) return msg(401, "Reset session expired. Start again.");

        MockVoter voter = registeredVoter(c).orElse(null);
        if (voter == null) return msg(401, "Reset session expired. Start again.");

        voter.setPin(encoder.encode(newPin));
        voters.save(voter);
        pinGuard.clear(voter.getId());                                 // <-- CHANGE 3: galat-PIN counter saaf

        return ResponseEntity.ok(Map.of("message", "PIN updated. You can log in now."));
    }
}