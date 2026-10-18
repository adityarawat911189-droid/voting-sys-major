package com.evoting.votingsysmaj.pojo;

import jakarta.persistence.*;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;

@Entity
@Immutable
@Table(name = "election_results")
public class ElectionResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "election_id", nullable = false)
    private Integer electionId;

    @Column(name = "candidate_id", nullable = false)
    private Integer candidateId;

    @Column(name = "candidate_name", nullable = false)
    private String candidateName;

    @Column(name = "party")
    private String party;

    @Column(name = "symbol")
    private String symbol;

    @Column(name = "votes", nullable = false)
    private Integer votes;

    @Column(name = "vote_percent", nullable = false)
    private BigDecimal votePercent;

    @Column(name = "rank", nullable = false)
    private Integer rank;

    public ElectionResult() {}

    public Integer getId() { return id; }

    public Integer getElectionId() { return electionId; }
    public void setElectionId(Integer electionId) { this.electionId = electionId; }

    public Integer getCandidateId() { return candidateId; }
    public void setCandidateId(Integer candidateId) { this.candidateId = candidateId; }

    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }

    public String getParty() { return party; }
    public void setParty(String party) { this.party = party; }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public Integer getVotes() { return votes; }
    public void setVotes(Integer votes) { this.votes = votes; }

    public BigDecimal getVotePercent() { return votePercent; }
    public void setVotePercent(BigDecimal votePercent) { this.votePercent = votePercent; }

    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }
}