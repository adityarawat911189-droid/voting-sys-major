package com.evoting.votingsysmaj.serviceimpl;

import com.evoting.votingsysmaj.service.AuditService;
import com.evoting.votingsysmaj.service.VoterProfileService;
import com.evoting.votingsysmaj.util.PinGuard;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.yubico.webauthn.CredentialRepository;
import com.yubico.webauthn.FinishRegistrationOptions;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.RegistrationResult;
import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.StartRegistrationOptions;
import com.yubico.webauthn.data.AuthenticatorAttachment;
import com.yubico.webauthn.data.AuthenticatorSelectionCriteria;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.PublicKeyCredentialCreationOptions;
import com.yubico.webauthn.data.PublicKeyCredentialDescriptor;
import com.yubico.webauthn.data.RelyingPartyIdentity;
import com.yubico.webauthn.data.UserIdentity;
import com.yubico.webauthn.data.UserVerificationRequirement;
import com.yubico.webauthn.data.PublicKeyCredential;
import com.yubico.webauthn.exception.RegistrationFailedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VoterProfileServiceImpl implements VoterProfileService {

    private static final Duration PENDING_TTL = Duration.ofMinutes(5);

    private record Pending(PublicKeyCredentialCreationOptions request, Instant expiresAt) {}

    private final JdbcTemplate jdbc;
    private final PinGuard pinGuard;
    private final AuditService audit;
    private final RelyingParty rp;

    // voterId -> start aur finish ke beech ki pending registration
    private final Map<Integer, Pending> pending = new ConcurrentHashMap<>();

    public VoterProfileServiceImpl(JdbcTemplate jdbc, PinGuard pinGuard, AuditService audit,
                                   @Value("${webauthn.rp-id:localhost}") String rpId,
                                   @Value("${webauthn.origin:http://localhost:5173}") String origin) {
        this.jdbc = jdbc;
        this.pinGuard = pinGuard;
        this.audit = audit;
        this.rp = RelyingParty.builder()
                .identity(RelyingPartyIdentity.builder().id(rpId).name("E-Voting System").build())
                .credentialRepository(new NoLookupRepository())
                .origins(Set.of(origin))
                .build();
    }

    // ------------------------------------------------------------------
    @Override
    public Map<String, Object> profile(int voterId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                select name, gender, to_char(dob, 'DD Mon YYYY') as dob, state, city, ward_no, address,
                       contact_no, aadhaar_no, pan_no, photo, webauthn_credential_id
                from mock_voters
                where id = ? and registered = true
                """, voterId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in again.");
        }
        Map<String, Object> r = rows.get(0);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("name", r.get("name"));
        out.put("gender", r.get("gender"));
        out.put("dob", r.get("dob"));
        out.put("state", r.get("state"));
        out.put("city", r.get("city"));
        out.put("wardNo", r.get("ward_no"));
        out.put("address", r.get("address"));
        out.put("contactNo", r.get("contact_no"));
        out.put("aadhaarMasked", mask((String) r.get("aadhaar_no"), 4));
        out.put("panMasked", mask((String) r.get("pan_no"), 4));
        out.put("photo", r.get("photo"));
        out.put("fingerprintRegistered", r.get("webauthn_credential_id") != null);
        return out;
    }

    // ------------------------------------------------------------------
    @Override
    public String fingerprintOptions(int voterId, String pin) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "select name, pin from mock_voters where id = ? and registered = true", voterId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in again.");
        }
        pinGuard.check(voterId, (String) rows.get(0).get("pin"), pin);
        pinGuard.clear(voterId);

        String name = String.valueOf(rows.get(0).get("name"));
        UserIdentity user = UserIdentity.builder()
                .name(name)
                .displayName(name)
                .id(userHandle(voterId))
                .build();

        PublicKeyCredentialCreationOptions request = rp.startRegistration(
                StartRegistrationOptions.builder()
                        .user(user)
                        .authenticatorSelection(AuthenticatorSelectionCriteria.builder()
                                .authenticatorAttachment(AuthenticatorAttachment.PLATFORM) // device ka apna fingerprint
                                .userVerification(UserVerificationRequirement.REQUIRED)
                                .build())
                        .build());

        Instant now = Instant.now();
        pending.values().removeIf(p -> p.expiresAt().isBefore(now));
        pending.put(voterId, new Pending(request, now.plus(PENDING_TTL)));

        try {
            return request.toCredentialsCreateJson();
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not start fingerprint registration.");
        }
    }

    // ------------------------------------------------------------------
    @Override
    @Transactional
    public Map<String, Object> registerFingerprint(int voterId, String credentialJson) {
        Pending p = pending.remove(voterId);
        if (p == null || p.expiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Session expired. Please start fingerprint registration again.");
        }

        RegistrationResult result;
        try {
            var credential = PublicKeyCredential.parseRegistrationResponseJson(credentialJson);
            result = rp.finishRegistration(FinishRegistrationOptions.builder()
                    .request(p.request())
                    .response(credential)
                    .build());
        } catch (IOException | RegistrationFailedException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Fingerprint registration failed. Please try again.");
        }

        List<String> old = jdbc.queryForList(
                "select webauthn_credential_id from mock_voters where id = ?", String.class, voterId);
        boolean had = !old.isEmpty() && old.get(0) != null;

        jdbc.update("""
                update mock_voters
                set webauthn_credential_id = ?, webauthn_public_key = ?, webauthn_sign_count = ?
                where id = ?
                """,
                result.getKeyId().getId().getBase64Url(),
                result.getPublicKeyCose().getBase64Url(),
                result.getSignatureCount(),
                voterId);

        audit.logSystem(had ? "FINGERPRINT_REPLACED" : "FINGERPRINT_REGISTERED", "VOTER", voterId, null,
                Map.of("fingerprint", had ? "REGISTERED" : "NOT_REGISTERED"),
                Map.of("fingerprint", "REGISTERED"));

        return Map.of("message", "Fingerprint registered successfully.", "fingerprintRegistered", true);
    }

    // ------------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------------

    /** Aakhri `keep` characters chhodkar baaki X. */
    private String mask(String v, int keep) {
        if (v == null || v.isBlank()) return null;
        String s = v.replaceAll("\\s", "");
        if (s.length() <= keep) return s;
        return "X".repeat(s.length() - keep) + s.substring(s.length() - keep);
    }

    /** WebAuthn user handle: naam ya number nahi, sirf ek opaque hash. */
    private ByteArray userHandle(int voterId) {
        try {
            byte[] d = MessageDigest.getInstance("SHA-256")
                    .digest(("evoting-voter-" + voterId).getBytes(StandardCharsets.UTF_8));
            return new ByteArray(d);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    /**
     * Abhi sirf registration hai, isliye lookup ki zaroorat nahi.
     * Fingerprint login banate waqt isse mock_voters se bharenge.
     */
    private static class NoLookupRepository implements CredentialRepository {
        @Override
        public Set<PublicKeyCredentialDescriptor> getCredentialIdsForUsername(String username) {
            return Set.of();
        }

        @Override
        public Optional<ByteArray> getUserHandleForUsername(String username) {
            return Optional.empty();
        }

        @Override
        public Optional<String> getUsernameForUserHandle(ByteArray userHandle) {
            return Optional.empty();
        }

        @Override
        public Optional<RegisteredCredential> lookup(ByteArray credentialId, ByteArray userHandle) {
            return Optional.empty();
        }

        @Override
        public Set<RegisteredCredential> lookupAll(ByteArray credentialId) {
            return Set.of();
        }
    }
}