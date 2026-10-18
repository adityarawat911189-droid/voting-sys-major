package com.evoting.votingsysmaj.service;

import java.util.Map;

public interface CandidateSelfService {

    /** Voter agar approved candidate hai to uski profile + latest request ka status, warna {candidate: false}. */
    Map<String, Object> me(int voterId);

    /** Profile badalne ki request (admin ke paas PENDING jayegi). */
    Map<String, Object> requestChange(int voterId, String party, String manifesto,
                                      String qualification, String occupation);
}