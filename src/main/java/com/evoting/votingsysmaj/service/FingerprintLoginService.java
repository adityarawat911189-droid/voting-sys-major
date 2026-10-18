package com.evoting.votingsysmaj.service;

import java.util.Map;

public interface FingerprintLoginService {

    /** Mobile number ke liye WebAuthn login options (JSON string). */
    String options(String contactNo);

    /** Browser ka assertion verify karta hai. Success par {voterId, role} deta hai. */
    Map<String, Object> finish(String contactNo, String credentialJson);
}