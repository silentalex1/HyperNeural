from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class DetectionResult:
    app_type: str
    confidence: float
    heuristics_used: list[str]
    detected_languages: list[str]
    detected_frameworks: list[str]
    custom_language_detected: str | None
    reasoning: str


class AdvancedAppDetector:
    def __init__(self):
        self.language_signatures = self._build_signatures()
        self.framework_signatures = self._build_framework_signatures()
        self.detection_cache: dict[str, DetectionResult] = {}
    
    def _build_signatures(self) -> dict[str, Any]:
        return {
            "python": {"files": ["*.py", "requirements.txt"], "patterns": [r"import\s+", r"def\s+\w+"]},
            "javascript": {"files": ["*.js", "*.jsx", "package.json"], "patterns": [r"import.*from", r"require\("]},
            "typescript": {"files": ["*.ts", "*.tsx", "tsconfig.json"], "patterns": [r":\s*\w+", r"interface"]},
        }
    
    def _build_framework_signatures(self) -> dict[str, Any]:
        return {
            "discord_bot": {"patterns": [r"discord\.", r"@bot\.", r"on_message"]},
            "web_app": {"patterns": [r"<html", r"React\.", r"Vue\."]},
            "api_service": {"patterns": [r"@app\.", r"FastAPI", r"express\."]},
        }
    
    def detect_app(self, project_dir: Path) -> DetectionResult:
        project_hash = self._hash_project(project_dir)
        if project_hash in self.detection_cache:
            return self.detection_cache[project_hash]
        
        heuristics = []
        languages = self._detect_languages(project_dir)
        heuristics.append("language_detection")
        
        frameworks = self._detect_frameworks(project_dir)
        heuristics.append("framework_detection")
        
        custom_lang = self._detect_custom_language(project_dir)
        if custom_lang:
            heuristics.append("custom_language")
        
        app_type, confidence = self._determine_app_type(languages, frameworks, project_dir)
        
        result = DetectionResult(
            app_type=app_type,
            confidence=confidence,
            heuristics_used=heuristics,
            detected_languages=languages,
            detected_frameworks=frameworks,
            custom_language_detected=custom_lang,
            reasoning=self._generate_reasoning(app_type, languages, frameworks)
        )
        
        self.detection_cache[project_hash] = result
        return result
    
    def _hash_project(self, project_dir: Path) -> str:
        return hashlib.md5(str(project_dir).encode()).hexdigest()[:16]
    
    def _detect_languages(self, project_dir: Path) -> list[str]:
        languages = []
        for file in project_dir.rglob("*"):
            if file.is_file():
                for lang, sig in self.language_signatures.items():
                    for pattern in sig["files"]:
                        if file.match(pattern):
                            if lang not in languages:
                                languages.append(lang)
        return languages
    
    def _detect_frameworks(self, project_dir: Path) -> list[str]:
        frameworks = []
        for file in project_dir.rglob("*"):
            if file.is_file() and file.suffix in [".py", ".js", ".jsx", ".ts"]:
                try:
                    with open(file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    for fw, sig in self.framework_signatures.items():
                        for pattern in sig["patterns"]:
                            if re.search(pattern, content):
                                if fw not in frameworks:
                                    frameworks.append(fw)
                except Exception:
                    continue
        return frameworks
    
    def _detect_custom_language(self, project_dir: Path) -> str | None:
        for file in project_dir.rglob("*"):
            if file.is_file():
                ext = file.suffix
                if ext in [".nexara", ".forge", ".gguf"]:
                    return ext[1:]
        return None
    
    def _determine_app_type(self, languages: list[str], frameworks: list[str], project_dir: Path) -> tuple[str, float]:
        if "discord_bot" in frameworks:
            return "discord", 0.95
        if "web_app" in frameworks:
            return "web", 0.9
        if "api_service" in frameworks:
            return "api", 0.85
        if "python" in languages:
            return "python", 0.75
        if "javascript" in languages or "typescript" in languages:
            return "web", 0.7
        return "auto", 0.5
    
    def _generate_reasoning(self, app_type: str, languages: list[str], frameworks: list[str]) -> str:
        return f"Detected {app_type} based on languages {languages} and frameworks {frameworks}"
