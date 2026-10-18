package com.evoting.votingsysmaj.service;

import java.util.Map;

public interface VoterProfileService {

    Map<String, Object> profile(int voterId);

    String fingerprintOptions(int voterId, String pin);

    Map<String, Object> registerFingerprint(int voterId, String credentialJson);
}