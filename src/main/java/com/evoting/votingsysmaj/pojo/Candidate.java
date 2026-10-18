package com.evoting.votingsysmaj.pojo;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidates")
public class Candidate {

    // status ki allowed values (DB check constraint se match)
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_REJECTED = "REJECTED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "voter_id", nullable = false)
    private Integer voterId;

    @Column(name = "party")
    private String party;

    @Column(name = "symbol")
    private String symbol;

    @Column(name = "manifesto", columnDefinition = "text")
    private String manifesto;

    @Column(name = "occupation")
    private String occupation;

    @Column(name = "qualification")
    private String qualification;

    @Column(name = "status", nullable = false)
    private String status = STATUS_PENDING;

    @Column(name = "applied_at", nullable = false)
    private LocalDateTime appliedAt = LocalDateTime.now();

    public Candidate() {}

    public Integer getId() { return id; }

    public Integer getVoterId() { return voterId; }
    public void setVoterId(Integer voterId) { this.voterId = voterId; }


    public String getParty() { return party; }
    public void setParty(String party) { this.party = party; }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public String getManifesto() { return manifesto; }
    public void setManifesto(String manifesto) { this.manifesto = manifesto; }

    public String getOccupation() { return occupation; }
    public void setOccupation(String occupation) { this.occupation = occupation; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getAppliedAt() { return appliedAt; }
    public void setAppliedAt(LocalDateTime appliedAt) { this.appliedAt = appliedAt; }

}