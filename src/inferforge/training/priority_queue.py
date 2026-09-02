from dataclasses import dataclass, field
from typing import Dict, Any, Optional
from pathlib import Path
import json
from datetime import datetime
import threading
import heapq

@dataclass
class TaskPriority:
    priority: int
    timestamp: float = field(default_factory=lambda: datetime.now().timestamp())
    task_id: str = ""
    
    def __lt__(self, other):
        if self.priority != other.priority:
            return self.priority > other.priority
        return self.timestamp < other.timestamp

class PriorityQueue:
    def __init__(self, max_size: int = 1000, premium: bool = False):
        self.max_size = max_size if premium else min(max_size, 100)
        self.queue: list[tuple[TaskPriority, Dict[str, Any]]] = []
        self.lock = threading.RLock()
        self.processed_count = 0
        self.dropped_count = 0
    
    def enqueue(self, task_id: str, task: Dict[str, Any], priority: int = 0) -> bool:
        with self.lock:
            if len(self.queue) >= self.max_size:
                if priority <= 0:
                    self.dropped_count += 1
                    return False
                self.queue.pop()
            
            task_priority = TaskPriority(priority=priority, task_id=task_id)
            heapq.heappush(self.queue, (task_priority, task))
            return True
    
    def dequeue(self) -> Optional[tuple[str, Dict[str, Any]]]:
        with self.lock:
            if not self.queue:
                return None
            priority_obj, task = heapq.heappop(self.queue)
            self.processed_count += 1
            return priority_obj.task_id, task
    
    def peek(self) -> Optional[tuple[str, Dict[str, Any]]]:
        with self.lock:
            if not self.queue:
                return None
            priority_obj, task = self.queue[0]
            return priority_obj.task_id, task
    
    def size(self) -> int:
        with self.lock:
            return len(self.queue)
    
    def clear(self) -> None:
        with self.lock:
            self.queue.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        with self.lock:
            return {
                "queued": len(self.queue),
                "processed": self.processed_count,
                "dropped": self.dropped_count,
                "max_size": self.max_size,
                "utilization": len(self.queue) / self.max_size
            }
    
    def persist(self, path: Path) -> None:
        with self.lock:
            data = {
                "tasks": [(p.task_id, t) for p, t in self.queue],
                "stats": self.get_stats()
            }
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(data, default=str, indent=2))
    
    def restore(self, path: Path) -> None:
        if not path.exists():
            return
        with self.lock:
            data = json.loads(path.read_text())
            self.queue.clear()
            for task_id, task in data.get("tasks", []):
                self.enqueue(task_id, task)
