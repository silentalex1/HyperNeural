from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import Any


class SafetyLevel(Enum):
    ALLOW = "allow"
    WARN = "warn"
    BLOCK = "block"


@dataclass
class SafetyRule:
    name: str
    pattern: str
    level: SafetyLevel
    category: str


@dataclass
class SafetyCheck:
    passed: bool
    level: SafetyLevel
    rule_triggered: str | None
    reason: str


class AISafetyLayer:
    def __init__(self):
        self.rules = self._default_rules()
        self.enabled = True
        self.blocked_actions: list[str] = []
        self.warning_count = 0
    
    def _default_rules(self) -> list[SafetyRule]:
        return [
            SafetyRule(
                name="no_system_destruction",
                pattern=r"(delete|remove|destroy|format)\s+(system|boot|critical)",
                level=SafetyLevel.BLOCK,
                category="system_safety"
            ),
            SafetyRule(
                name="no_malware",
                pattern=r"(create|generate|write)\s+(malware|virus|trojan|backdoor)",
                level=SafetyLevel.BLOCK,
                category="security"
            ),
            SafetyRule(
                name="no_privilege_escalation",
                pattern=r"(escalate|bypass|override)\s+(privilege|permission|auth)",
                level=SafetyLevel.BLOCK,
                category="security"
            ),
            SafetyRule(
                name="no_data_exfiltration",
                pattern=r"(exfiltrate|steal|leak)\s+(data|password|credential)",
                level=SafetyLevel.BLOCK,
                category="privacy"
            ),
            SafetyRule(
                name="warn_file_modification",
                pattern=r"(modify|edit|change)\s+(system|critical)",
                level=SafetyLevel.WARN,
                category="system_safety"
            ),
            SafetyRule(
                name="warn_network_scan",
                pattern=r"(scan|probe|enumerate)\s+(network|port|host)",
                level=SafetyLevel.WARN,
                category="network"
            ),
            SafetyRule(
                name="warn_shell_execution",
                pattern=r"(exec|eval|system)\s+\$",
                level=SafetyLevel.WARN,
                category="execution"
            )
        ]
    
    def check_action(self, action: str, context: dict[str, Any] | None = None) -> SafetyCheck:
        if not self.enabled:
            return SafetyCheck(True, SafetyLevel.ALLOW, None, "safety_disabled")
        
        context = context or {}
        
        for rule in self.rules:
            if re.search(rule.pattern, action, re.IGNORECASE):
                if rule.level == SafetyLevel.BLOCK:
                    self.blocked_actions.append(action)
                    return SafetyCheck(False, rule.level, rule.name, f"blocked_by_{rule.category}")
                elif rule.level == SafetyLevel.WARN:
                    self.warning_count += 1
                    return SafetyCheck(True, rule.level, rule.name, f"warning_{rule.category}")
        
        return SafetyCheck(True, SafetyLevel.ALLOW, None, "no_rules_triggered")
    
    def check_model_output(self, output: str) -> SafetyCheck:
        dangerous_patterns = [
            r"rm\s+-rf\s+/",
            r"format\s+c:",
            r"del\s+/s/q",
            r"shutdown\s+-s",
            r"reboot\s+-f"
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, output, re.IGNORECASE):
                return SafetyCheck(False, SafetyLevel.BLOCK, "dangerous_command", "output_contains_dangerous_command")
        
        return SafetyCheck(True, SafetyLevel.ALLOW, None, "output_safe")
    
    def add_custom_rule(self, name: str, pattern: str, level: SafetyLevel, category: str) -> None:
        rule = SafetyRule(name=name, pattern=pattern, level=level, category=category)
        self.rules.append(rule)
    
    def remove_rule(self, name: str) -> bool:
        for i, rule in enumerate(self.rules):
            if rule.name == name:
                del self.rules[i]
                return True
        return False
    
    def enable_safety(self) -> None:
        self.enabled = True
    
    def disable_safety(self) -> None:
        self.enabled = False
    
    def get_safety_report(self) -> dict[str, Any]:
        return {
            "enabled": self.enabled,
            "total_rules": len(self.rules),
            "blocked_actions_count": len(self.blocked_actions),
            "warning_count": self.warning_count,
            "recent_blocks": self.blocked_actions[-10:] if self.blocked_actions else [],
            "rules_by_category": self._count_rules_by_category()
        }
    
    def _count_rules_by_category(self) -> dict[str, int]:
        counts = {}
        for rule in self.rules:
            counts[rule.category] = counts.get(rule.category, 0) + 1
        return counts
    
    def rollback_model(self, model_path: str, reason: str) -> dict[str, Any]:
        return {
            "action": "rollback",
            "model_path": model_path,
            "reason": reason,
            "timestamp": 0.0,
            "status": "rolled_back"
        }
    
    def create_sandbox_config(self, restrictions: dict[str, Any]) -> dict[str, Any]:
        return {
            "network_access": restrictions.get("network_access", False),
            "file_system": restrictions.get("file_system", "readonly"),
            "execution": restrictions.get("execution", False),
            "memory_limit": restrictions.get("memory_limit", "4GB"),
            "timeout": restrictions.get("timeout", 300)
        }
