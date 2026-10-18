package com.evoting.votingsysmaj.dto;

public class SetPinRequest {
    private String pin;
    private String confirmPin;

    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }
    public String getConfirmPin() { return confirmPin; }
    public void setConfirmPin(String confirmPin) { this.confirmPin = confirmPin; }
}