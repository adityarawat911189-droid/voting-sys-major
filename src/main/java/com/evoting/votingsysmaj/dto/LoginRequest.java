package com.evoting.votingsysmaj.dto;

public class LoginRequest {
    private String contactNo;
    private String pin;

    public String getContactNo() { return contactNo; }
    public void setContactNo(String contactNo) { this.contactNo = contactNo; }

    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }
}