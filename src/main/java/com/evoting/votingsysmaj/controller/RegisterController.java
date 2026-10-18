package com.evoting.votingsysmaj.controller;

import com.evoting.votingsysmaj.dao.MockVoterDao;
import com.evoting.votingsysmaj.dto.RegisterCheckRequest;
import com.evoting.votingsysmaj.dto.SetPinRequest;
import com.evoting.votingsysmaj.pojo.MockVoter;
import com.evoting.votingsysmaj.util.FaceVerificationService;
import com.evoting.votingsysmaj.util.FaceVerificationService.Result;
import com.evoting.votingsysmaj.util.RegistrationTokenStore;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/register")
public class RegisterController {

    private static final long MAX_BYTES = 5 * 1024 * 1024;
    private static final int MAX_ATTEMPTS = 10;
    private static final long WINDOW_MS = 15 * 60 * 1000L;

    private final MockVoterDao mockVoterDao;
    private final RegistrationTokenStore tokenStore;
    private final FaceVerificationService faceService;
    private final PasswordEncoder passwordEncoder;

    // voterId -> [attemptCount, windowStartMillis]
    private final Map<Integer, long[]> attempts = new ConcurrentHashMap<>();

    public RegisterController(MockVoterDao mockVoterDao,
                              RegistrationTokenStore tokenStore,
                              FaceVerificationService faceService,
                              PasswordEncoder passwordEncoder) {
        this.mockVoterDao = mockVoterDao;
        this.tokenStore = tokenStore;
        this.faceService = faceService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/check")
    public ResponseEntity<?> check(@RequestBody RegisterCheckRequest req) {

        Optional<MockVoter> match =
                mockVoterDao.findByDetails(req.getName(), req.getContactNo(), req.getDob());

        if (match.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Details did not match our records."));
        }

        MockVoter v = match.get();

        if (isRegistered(v)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "You are already registered. Please log in."));
        }

        String token = tokenStore.issue(v.getId());

        ResponseCookie cookie = ResponseCookie.from("reg_token", token)
                .httpOnly(true)
                .secure(false)          // production (HTTPS) me true karna
                .sameSite("Strict")
                .path("/api/register")
                .maxAge(RegistrationTokenStore.TTL)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("eligible", true));
    }

    @PostMapping(value = "/verify", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> verify(
            @CookieValue(name = "reg_token", required = false) String token,
            @RequestPart("idImage") MultipartFile idImage,
            @RequestPart("selfie") MultipartFile selfie) throws IOException {

        Optional<Integer> voterId = tokenStore.validate(token);
        if (voterId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Session expired. Please start again."));
        }

        Optional<MockVoter> found = mockVoterDao.findById(voterId.get());
        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Session expired. Please start again."));
        }
        MockVoter v = found.get();

        if (isRegistered(v)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "You are already registered. Please log in."));
        }

        byte[] idBytes = idImage.getBytes();
        byte[] selfieBytes = selfie.getBytes();
        if (!isJpegOrPng(idBytes) || !isJpegOrPng(selfieBytes)
                || idBytes.length > MAX_BYTES || selfieBytes.length > MAX_BYTES) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Upload valid JPG or PNG images up to 5 MB."));
        }

        if (tooManyAttempts(voterId.get())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("message", "Too many attempts. Please try again in a few minutes."));
        }

        Result result;
        try {
            result = faceService.verify(idBytes, selfieBytes);
        } catch (FaceVerificationService.FaceServiceException e) {
            e.printStackTrace();   // temporary
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", "Face verification is unavailable right now. Please try again later."));
        }

        switch (result) {
            case NO_FACE_ID:
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "We could not find a face on the ID. Upload a clearer photo of the card."));
            case NO_FACE_SELFIE:
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "We could not find a face in your live photo. Retake it in good light."));
            case BAD_IMAGE:
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "We could not read one of the images. Please try again."));
            case NO_MATCH:
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Face did not match the ID photo."));
            case MATCH:
                break;
        }

        v.setPhoto("data:image/jpeg;base64," + Base64.getEncoder().encodeToString(selfieBytes));
        mockVoterDao.save(v);
        tokenStore.markFaceVerified(token);
        attempts.remove(voterId.get());

        return ResponseEntity.ok(Map.of("verified", true));
    }

    @PostMapping("/set-pin")
    public ResponseEntity<?> setPin(
            @CookieValue(name = "reg_token", required = false) String token,
            @RequestBody SetPinRequest req) {

        Optional<Integer> voterId = tokenStore.validate(token);
        if (voterId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Session expired. Please start again."));
        }

        Optional<MockVoter> found = mockVoterDao.findById(voterId.get());
        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Session expired. Please start again."));
        }
        MockVoter v = found.get();

        if (!tokenStore.isFaceVerified(token) || isBlank(v.getPhoto())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Please complete face verification first."));
        }
        if (isRegistered(v)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "You are already registered. Please log in."));
        }

        String pin = req.getPin();
        if (pin == null || !pin.matches("^\\d{4,6}$")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "PIN must be 4 to 6 digits."));
        }
        if (!pin.equals(req.getConfirmPin())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "PINs do not match."));
        }

        v.setPin(passwordEncoder.encode(pin));
        v.setRegistered(true);
        mockVoterDao.save(v);

        tokenStore.revoke(token);

        return ResponseEntity.ok(Map.of("registered", true));
    }

    private boolean isRegistered(MockVoter v) {
        return !isBlank(v.getPin()) || !isBlank(v.getWebauthnCredentialId());
    }

    private boolean tooManyAttempts(int voterId) {
        long now = System.currentTimeMillis();
        long[] a = attempts.compute(voterId, (k, cur) -> {
            if (cur == null || now - cur[1] > WINDOW_MS) return new long[]{1, now};
            return new long[]{cur[0] + 1, cur[1]};
        });
        return a[0] > MAX_ATTEMPTS;
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private boolean isJpegOrPng(byte[] b) {
        if (b == null || b.length < 4) return false;
        boolean jpeg = (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF;
        boolean png = (b[0] & 0xFF) == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47;
        return jpeg || png;
    }
}