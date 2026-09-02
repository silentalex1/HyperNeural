"""Tests for security manager."""

from __future__ import annotations

from pathlib import Path

import pytest

from inferforge.agent.security import (
    AuditEntry,
    OperationType,
    RiskLevel,
    SecurityConfig,
    SecurityManager,
)


@pytest.mark.unit
@pytest.mark.security
class TestSecurityConfig:
    """Test security configuration."""

    def test_default_config(self):
        """Test default security configuration."""
        config = SecurityConfig()
        assert config.allow_web_access is False
        assert config.require_consent_for_delete is True
        assert config.enable_audit_log is True

    def test_custom_config(self, workspace: Path):
        """Test custom security configuration."""
        config = SecurityConfig(
            allowed_workspaces=[workspace],
            allow_web_access=True,
            require_consent_for_delete=False,
        )
        assert len(config.allowed_workspaces) == 1
        assert config.allow_web_access is True


@pytest.mark.unit
@pytest.mark.security
class TestSecurityManager:
    """Test security manager."""

    def test_workspace_access_allowed(self, security_manager: SecurityManager, workspace: Path):
        """Test that workspace access is allowed."""
        test_path = workspace / "test.txt"
        assert security_manager.check_workspace_access(test_path)

    def test_workspace_access_denied(self, security_manager: SecurityManager, temp_dir: Path):
        """Test that access outside workspace is denied."""
        outside_path = temp_dir.parent / "outside.txt"
        assert not security_manager.check_workspace_access(outside_path)

    def test_web_rate_limiting(self, security_manager: SecurityManager):
        """Test web request rate limiting."""
        # First 10 requests should succeed
        for _ in range(10):
            assert security_manager.check_web_rate_limit()
        
        # 11th request should fail
        assert not security_manager.check_web_rate_limit()

    def test_risk_level_assignment(self, security_manager: SecurityManager):
        """Test risk level assignment for operations."""
        assert security_manager.get_risk_level(OperationType.DELETE_FILE) == RiskLevel.HIGH
        assert security_manager.get_risk_level(OperationType.READ_FILE) == RiskLevel.SAFE
        assert security_manager.get_risk_level(OperationType.RUN_COMMAND) == RiskLevel.MEDIUM

    def test_audit_logging(self, security_manager: SecurityManager):
        """Test audit logging."""
        entry = AuditEntry(
            timestamp=1234567890.0,
            operation=OperationType.CREATE_FILE,
            risk_level=RiskLevel.LOW,
            path="/test/file.txt",
            success=True,
        )
        security_manager.log_audit(entry)
        
        summary = security_manager.get_audit_summary()
        assert len(summary) == 1
        assert summary[0]["operation"] == "create_file"

    def test_backup_creation(self, security_manager: SecurityManager, workspace: Path):
        """Test file backup creation."""
        test_file = workspace / "test.txt"
        test_file.write_text("original content")
        
        backup_path = security_manager.create_backup(test_file)
        assert backup_path is not None
        assert backup_path.exists()
        assert backup_path.read_text() == "original content"

    def test_backup_restore(self, security_manager: SecurityManager, workspace: Path):
        """Test file restoration from backup."""
        test_file = workspace / "test.txt"
        test_file.write_text("original content")
        
        backup_path = security_manager.create_backup(test_file)
        test_file.write_text("modified content")
        
        success = security_manager.restore_backup(backup_path, test_file)
        assert success
        assert test_file.read_text() == "original content"

    def test_unrestricted_access_mode(self, workspace: Path):
        """Test unrestricted access mode."""
        config = SecurityConfig(
            allowed_workspaces=[workspace],
            unrestricted_access=True,
        )
        manager = SecurityManager(config)
        
        # Should allow access anywhere
        assert manager.check_workspace_access(Path("/tmp/test"))
        assert manager.check_workspace_access(Path("C:\\Windows\\System32"))
