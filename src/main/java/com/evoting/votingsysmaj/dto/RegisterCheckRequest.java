package com.evoting.votingsysmaj.dto;

import java.time.LocalDate;

public class RegisterCheckRequest {
    private String name;
    private String contactNo;
    private LocalDate dob;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getContactNo() { return contactNo; }
    public void setContactNo(String contactNo) { this.contactNo = contactNo; }
    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }
}