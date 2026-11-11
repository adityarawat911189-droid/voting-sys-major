package com.evoting.votingsysmaj.serviceimpl;

import com.evoting.votingsysmaj.service.OtpService;
import com.twilio.Twilio;
import com.twilio.exception.ApiException;
import com.twilio.rest.verify.v2.service.Verification;
import com.twilio.rest.verify.v2.service.VerificationCheck;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpServiceImpl implements OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpServiceImpl.class);

    @Value("${twilio.account-sid:}") private String accountSid;
    @Value("${twilio.auth-token:}") private String authToken;
    @Value("${twilio.verify-service-sid:}") private String verifySid;
    @Value("${otp.dev-mode:false}") private boolean devMode;   // sirf local testing ke liye

    private record DevOtp(String code, Instant expires) {}
    private final Map<String, DevOtp> devCodes = new ConcurrentHashMap<>();
    private final SecureRandom rnd = new SecureRandom();

    @PostConstruct
    void init() {
        if (devMode) {
            log.warn("OTP DEV MODE ON: SMS nahi jayega, OTP console mai print hoga.");
        } else {
            Twilio.init(accountSid, authToken);
        }
    }

    @Override
    public void sendOtp(String contactNo) {
        if (devMode) {
            String code = String.format("%06d", rnd.nextInt(1_000_000));
            devCodes.put(contactNo, new DevOtp(code, Instant.now().plusSeconds(300)));
            log.warn("DEV OTP for {} = {}", contactNo, code);
            return;
        }
        Verification.creator(verifySid, "+91" + contactNo, "sms").create();
    }

    @Override
    public boolean checkOtp(String contactNo, String code) {
        if (devMode) {
            DevOtp d = devCodes.get(contactNo);
            if (d == null || Instant.now().isAfter(d.expires())) return false;
            boolean ok = d.code().equals(code);
            if (ok) devCodes.remove(contactNo);
            return ok;
        }
        try {
            VerificationCheck c = VerificationCheck.creator(verifySid)
                    .setTo("+91" + contactNo)
                    .setCode(code)
                    .create();
            return "approved".equals(c.getStatus());
        } catch (ApiException e) {
            return false;
        }
    }
}