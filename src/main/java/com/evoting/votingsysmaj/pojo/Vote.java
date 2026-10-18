package com.evoting.votingsysmaj.pojo;

import jakarta.persistence.*;
import org.hibernate.annotations.Immutable;

@Entity
@Immutable
@Table(name = "votes")
public class Vote {

    /** prev_hash of the very first vote (no previous vote exists): 64 zeros */
    public static final String GENESIS_HASH = "0".repeat(64);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "election_id", nullable = false, updatable = false)
    private Integer electionId;

    @Column(name = "candidate_id", nullable = false, updatable = false)
    private Integer candidateId;

    @Column(name = "receipt_hash", nullable = false, updatable = false)
    private String receiptHash;

    @Column(name = "prev_hash", nullable = false, updatable = false)
    private String prevHash;

    @Column(name = "hash", nullable = false, updatable = false)
    private String hash;

    public Vote() {}

    public Vote(Integer electionId, Integer candidateId, String receiptHash, String prevHash, String hash) {
        this.electionId = electionId;
        this.candidateId = candidateId;
        this.receiptHash = receiptHash;
        this.prevHash = prevHash;
        this.hash = hash;
    }

    public Integer getId() { return id; }

    public Integer getElectionId() { return electionId; }

    public Integer getCandidateId() { return candidateId; }

    public String getReceiptHash() { return receiptHash; }

    public String getPrevHash() { return prevHash; }

    public String getHash() { return hash; }
}