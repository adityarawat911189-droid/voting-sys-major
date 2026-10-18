package com.evoting.votingsysmaj.pojo;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "mock_voters")
public class MockVoter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ward_no")
    private Integer wardNo;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "gender")
    private String gender;

    @Column(name = "dob", nullable = false)
    private LocalDate dob;

    @Column(name = "father_name")
    private String fatherName;

    @Column(name = "mother_name")
    private String motherName;

    @Column(name = "spouse_name")
    private String spouseName;

    @Column(name = "nationality")
    private String nationality;

    @Column(name = "state")
    private String state;

    @Column(name = "city")
    private String city;

    @Column(name = "address", columnDefinition = "text")
    private String address;

    @Column(name = "contact_no")
    private String contactNo;

    @Column(name = "aadhaar_no", nullable = false)
    private String aadhaarNo;

    @Column(name = "pan_no")
    private String panNo;

    @Column(name = "photo", columnDefinition = "text")
    private String photo;

    @Column(name = "pin", columnDefinition = "text")
    private String pin;

    @Column(name = "registered", nullable = false)
    private Boolean registered = false;

    @Column(name = "role", nullable = false)
    private String role;

    @Column(name = "webauthn_credential_id", columnDefinition = "text")
    private String webauthnCredentialId;

    @Column(name = "webauthn_public_key", columnDefinition = "text")
    private String webauthnPublicKey;

    @Column(name = "webauthn_sign_count", nullable = false)
    private Long webauthnSignCount = 0L;

    public MockVoter() {}

    public Integer getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }

    public String getFatherName() { return fatherName; }
    public void setFatherName(String fatherName) { this.fatherName = fatherName; }

    public String getMotherName() { return motherName; }
    public void setMotherName(String motherName) { this.motherName = motherName; }

    public String getSpouseName() { return spouseName; }
    public void setSpouseName(String spouseName) { this.spouseName = spouseName; }

    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public Integer getWardNo() { return wardNo; }
    public void setWardNo(Integer wardNo) { this.wardNo = wardNo; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getContactNo() { return contactNo; }
    public void setContactNo(String contactNo) { this.contactNo = contactNo; }

    public String getAadhaarNo() { return aadhaarNo; }
    public void setAadhaarNo(String aadhaarNo) { this.aadhaarNo = aadhaarNo; }

    public String getPanNo() { return panNo; }
    public void setPanNo(String panNo) { this.panNo = panNo; }

    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }

    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }

    public Boolean getRegistered() { return registered; }
    public void setRegistered(Boolean registered) { this.registered = registered; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getWebauthnCredentialId() { return webauthnCredentialId; }
    public void setWebauthnCredentialId(String webauthnCredentialId) { this.webauthnCredentialId = webauthnCredentialId; }

    public String getWebauthnPublicKey() { return webauthnPublicKey; }
    public void setWebauthnPublicKey(String webauthnPublicKey) { this.webauthnPublicKey = webauthnPublicKey; }

    public Long getWebauthnSignCount() { return webauthnSignCount; }
    public void setWebauthnSignCount(Long webauthnSignCount) { this.webauthnSignCount = webauthnSignCount; }
}