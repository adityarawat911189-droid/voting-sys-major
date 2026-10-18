package com.evoting.votingsysmaj.pojo;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vote_participation")
public class VoteParticipation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "election_id", nullable = false)
    private Integer electionId;

    @Column(name = "voter_id", nullable = false)
    private Integer voterId;

    @Column(name = "voted_at", nullable = false)
    private LocalDateTime votedAt;

    public VoteParticipation() {}

    public VoteParticipation(Integer electionId, Integer voterId, LocalDateTime votedAt) {
        this.electionId = electionId;
        this.voterId = voterId;
        this.votedAt = votedAt;
    }

    public Integer getId() { return id; }

    public Integer getElectionId() { return electionId; }

    public Integer getVoterId() { return voterId; }

    public LocalDateTime getVotedAt() { return votedAt; }
}