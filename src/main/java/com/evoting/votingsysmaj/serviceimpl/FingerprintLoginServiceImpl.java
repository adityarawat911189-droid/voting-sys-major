package com.evoting.votingsysmaj.serviceimpl;

import com.evoting.votingsysmaj.service.FingerprintLoginService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.yubico.webauthn.AssertionRequest;
import com.yubico.webauthn.AssertionResult;
import com.yubico.webauthn.CredentialRepository;
import com.yubico.webauthn.FinishAssertionOptions;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.StartAssertionOptions;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.PublicKeyCredential;
import com.yubico.webauthn.data.PublicKeyCredentialDescriptor;
import com.yubico.webauthn.data.RelyingPartyIdentity;
import com.yubico.webauthn.data.UserVerificationRequirement;
import com.yubico.webauthn.data.exception.Base64UrlException;
import com.yubico.webauthn.exception.AssertionFailedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FingerprintLoginServiceImpl implements FingerprintLoginService {

    private static final Duration PENDING_TTL = Duration.ofMinutes(5);
    private static final String NOT_AVAILABLE =
            "Fingerprint login is not available for this number. Please use your PIN.";

    private record Pending(AssertionRequest request, Instant expiresAt) {}

    private final JdbcTemplate jdbc;
    private final RelyingParty rp;

    // contactNo -> start aur finish ke beech ki pending login
    private final Map<String, Pending> pending = new ConcurrentHashMap<>();

    public FingerprintLoginServiceImpl(JdbcTemplate jdbc,
                                       @Value("${webauthn.rp-id:localhost}") String rpId,
                                       @Value("${webauthn.origin:http://localhost:5173}") String origin) {
        this.jdbc = jdbc;
        this.rp = RelyingParty.builder()
                .identity(RelyingPartyIdentity.builder().id(rpId).name("E-Voting System").build())
                .credentialRepository(new MockVoterCredentials(jdbc))
                .origins(Set.of(origin))
                .build();
    }

    // ------------------------------------------------------------------
    @Override
    public String options(String contactNo) {
        if (contactNo == null || !contactNo.matches("\\d{10}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid 10-digit mobile number.");
        }
        if (voterByContact(contactNo).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, NOT_AVAILABLE);
        }

        AssertionRequest request = rp.startAssertion(StartAssertionOptions.builder()
                .username(contactNo)
                .userVerification(UserVerificationRequirement.REQUIRED)
                .build());

        Instant now = Instant.now();
        pending.values().removeIf(p -> p.expiresAt().isBefore(now));
        pending.put(contactNo, new Pending(request, now.plus(PENDING_TTL)));

        try {
            return request.toCredentialsGetJson();
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not start fingerprint login.");
        }
    }

    // ------------------------------------------------------------------
    @Override
    public Map<String, Object> finish(String contactNo, String credentialJson) {
        Pending p = pending.remove(contactNo);
        if (p == null || p.expiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Fingerprint session expired. Please try again.");
        }

        AssertionResult result;
        try {
            var credential = PublicKeyCredential.parseAssertionResponseJson(credentialJson);
            result = rp.finishAssertion(FinishAssertionOptions.builder()
                    .request(p.request())
                    .response(credential)
                    .build());
        } catch (IOException | AssertionFailedException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Fingerprint did not match. Please try again or use your PIN.");
        }

        if (!result.isSuccess() || !contactNo.equals(result.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Fingerprint did not match. Please try again or use your PIN.");
        }

        Map<String, Object> voter = voterByContact(contactNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, NOT_AVAILABLE));
        int voterId = ((Number) voter.get("id")).intValue();

        jdbc.update("update mock_voters set webauthn_sign_count = ? where id = ?",
                result.getSignatureCount(), voterId);

        return Map.of("voterId", voterId, "role", String.valueOf(voter.get("role")));
    }

    // ------------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------------

    private Optional<Map<String, Object>> voterByContact(String contactNo) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                select id, role from mock_voters
                where contact_no = ? and registered = true and webauthn_credential_id is not null
                """, contactNo);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    /** Registration ke waqt wala hi user handle (naam/number nahi, sirf hash). */
    private static ByteArray userHandle(int voterId) {
        try {
            byte[] d = MessageDigest.getInstance("SHA-256")
                    .digest(("evoting-voter-" + voterId).getBytes(StandardCharsets.UTF_8));
            return new ByteArray(d);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static ByteArray b64(String s) {
        try {
            return ByteArray.fromBase64Url(s);
        } catch (Base64UrlException e) {
            throw new IllegalStateException(e);
        }
    }

    /** WebAuthn library ko mock_voters se credentials yahan se milte hain. Username = mobile number. */
    private static class MockVoterCredentials implements CredentialRepository {

        private final JdbcTemplate jdbc;

        MockVoterCredentials(JdbcTemplate jdbc) {
            this.jdbc = jdbc;
        }

        @Override
        public Set<PublicKeyCredentialDescriptor> getCredentialIdsForUsername(String username) {
            List<String> ids = jdbc.queryForList("""
                    select webauthn_credential_id from mock_voters
                    where contact_no = ? and registered = true and webauthn_credential_id is not null
                    """, String.class, username);
            if (ids.isEmpty()) return Set.of();
            return Set.of(PublicKeyCredentialDescriptor.builder().id(b64(ids.get(0))).build());
        }

        @Override
        public Optional<ByteArray> getUserHandleForUsername(String username) {
            List<Integer> ids = jdbc.queryForList("""
                    select id from mock_voters
                    where contact_no = ? and registered = true and webauthn_credential_id is not null
                    """, Integer.class, username);
            return ids.isEmpty() ? Optional.empty() : Optional.of(userHandle(ids.get(0)));
        }

        @Override
        public Optional<String> getUsernameForUserHandle(ByteArray userHandle) {
            List<Map<String, Object>> rows = jdbc.queryForList("""
                    select id, contact_no from mock_voters
                    where registered = true and webauthn_credential_id is not null
                    """);
            for (Map<String, Object> r : rows) {
                if (userHandle(((Number) r.get("id")).intValue()).equals(userHandle)) {
                    return Optional.ofNullable((String) r.get("contact_no"));
                }
            }
            return Optional.empty();
        }

        @Override
        public Optional<RegisteredCredential> lookup(ByteArray credentialId, ByteArray userHandle) {
            return lookupAll(credentialId).stream()
                    .filter(c -> c.getUserHandle().equals(userHandle))
                    .findFirst();
        }

        @Override
        public Set<RegisteredCredential> lookupAll(ByteArray credentialId) {
            List<Map<String, Object>> rows = jdbc.queryForList("""
                    select id, webauthn_public_key, webauthn_sign_count from mock_voters
                    where webauthn_credential_id = ? and registered = true
                    """, credentialId.getBase64Url());
            if (rows.isEmpty()) return Set.of();

            Map<String, Object> r = rows.get(0);
            int id = ((Number) r.get("id")).intValue();
            long count = r.get("webauthn_sign_count") == null ? 0L : ((Number) r.get("webauthn_sign_count")).longValue();
            return Set.of(RegisteredCredential.builder()
                    .credentialId(credentialId)
                    .userHandle(userHandle(id))
                    .publicKeyCose(b64((String) r.get("webauthn_public_key")))
                    .signatureCount(count)
                    .build());
        }
    }
}