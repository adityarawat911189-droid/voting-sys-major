package com.evoting.votingsysmaj.service;

public interface OtpService {
    void sendOtp(String contactNo);
    boolean checkOtp(String contactNo, String code);
}