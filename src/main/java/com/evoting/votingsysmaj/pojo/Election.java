package com.evoting.votingsysmaj.pojo;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "elections")
public class Election {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "constituency_id")
    private Integer constituencyId;

    @Column(name = "nomination_start", nullable = false)
    private LocalDateTime nominationStart;

    @Column(name = "nomination_end", nullable = false)
    private LocalDateTime nominationEnd;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "status", nullable = false)
    private String status = "DRAFT";

    @Column(name = "result_published", nullable = false)
    private Boolean resultPublished = false;

    @Column(name = "winner_candidate_id")
    private Integer winnerCandidateId;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "state")
    private String state;

    @Column(name = "stop_reason", columnDefinition = "text")
    private String stopReason;

    @Column(name = "actual_start_time")
    private LocalDateTime actualStartTime;

    @Column(name = "actual_end_time")
    private LocalDateTime actualEndTime;

    @Column(name = "total_votes", nullable = false)
    private Integer totalVotes = 0;

    @Column(name = "election_type")
    private String electionType;

    @Column(name = "city")
    private String city;

    @Column(name = "ward_no")
    private Integer wardNo;

    @Column(name = "result_status")
    private String resultStatus;

    @Column(name = "fail_reason", columnDefinition = "text")
    private String failReason;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    public Election() {}

    public Integer getId() { return id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getConstituencyId() { return constituencyId; }
    public void setConstituencyId(Integer constituencyId) { this.constituencyId = constituencyId; }

    public LocalDateTime getNominationStart() { return nominationStart; }
    public void setNominationStart(LocalDateTime nominationStart) { this.nominationStart = nominationStart; }

    public LocalDateTime getNominationEnd() { return nominationEnd; }
    public void setNominationEnd(LocalDateTime nominationEnd) { this.nominationEnd = nominationEnd; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getResultPublished() { return resultPublished; }
    public void setResultPublished(Boolean resultPublished) { this.resultPublished = resultPublished; }

    public String getElectionType() { return electionType; }
    public void setElectionType(String electionType) { this.electionType = electionType; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public Integer getWardNo() { return wardNo; }
    public void setWardNo(Integer wardNo) { this.wardNo = wardNo; }

    public Integer getWinnerCandidateId() { return winnerCandidateId; }
    public void setWinnerCandidateId(Integer winnerCandidateId) { this.winnerCandidateId = winnerCandidateId; }

    public Integer getCreatedBy() { return createdBy; }
    public void setCreatedBy(Integer createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getStopReason() { return stopReason; }
    public void setStopReason(String stopReason) { this.stopReason = stopReason; }

    public LocalDateTime getActualStartTime() { return actualStartTime; }
    public void setActualStartTime(LocalDateTime actualStartTime) { this.actualStartTime = actualStartTime; }

    public LocalDateTime getActualEndTime() { return actualEndTime; }
    public void setActualEndTime(LocalDateTime actualEndTime) { this.actualEndTime = actualEndTime; }

    public Integer getTotalVotes() { return totalVotes; }
    public void setTotalVotes(Integer totalVotes) { this.totalVotes = totalVotes; }

    public String getResultStatus() { return resultStatus; }
    public void setResultStatus(String resultStatus) { this.resultStatus = resultStatus; }

    public String getFailReason() { return failReason; }
    public void setFailReason(String failReason) { this.failReason = failReason; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }
}