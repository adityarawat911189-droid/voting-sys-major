package com.evoting.votingsysmaj.pojo;

import jakarta.persistence.*;
import org.hibernate.annotations.Immutable;
import java.time.LocalDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Immutable
@Table(name = "audit_logs")
public class AuditLog {

    /** prev_hash of the very first audit entry (no previous entry exists): 64 zeros */
    public static final String GENESIS_HASH = "0".repeat(64);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ref_no", nullable = false)
    private String refNo;

    @Column(name = "admin_id")
    private Integer adminId;

    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "target_type")
    private String targetType;

    @Column(name = "target_id")
    private Integer targetId;

    @Column(name = "reason", columnDefinition = "text")
    private String reason;

    @Column(name = "status", nullable = false)
    private String status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "old_value", columnDefinition = "jsonb")
    private String oldValue;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "new_value", columnDefinition = "jsonb")
    private String newValue;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "prev_hash", nullable = false)
    private String prevHash;

    @Column(name = "hash", nullable = false)
    private String hash;

    public AuditLog() {}

    public AuditLog(String refNo, Integer adminId, String action, String targetType, Integer targetId, String reason, String status, String oldValue, String newValue, LocalDateTime createdAt, String prevHash, String hash) {
        this.refNo = refNo;
        this.adminId = adminId;
        this.action = action;
        this.targetType = targetType;
        this.targetId = targetId;
        this.reason = reason;
        this.status = status;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.createdAt = createdAt;
        this.prevHash = prevHash;
        this.hash = hash;
    }

    public Integer getId() { return id; }

    public String getRefNo() { return refNo; }

    public Integer getAdminId() { return adminId; }

    public String getAction() { return action; }

    public String getTargetType() { return targetType; }

    public Integer getTargetId() { return targetId; }

    public String getReason() { return reason; }

    public String getStatus() { return status; }

    public String getOldValue() { return oldValue; }

    public String getNewValue() { return newValue; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public String getPrevHash() { return prevHash; }

    public String getHash() { return hash; }
}