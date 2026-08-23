from __future__ import annotations

from collections import OrderedDict
from dataclasses import dataclass
from typing import Any


@dataclass
class MemoryBlock:
    address: int
    size: int
    tensor_name: str
    access_frequency: int
    last_access: int
    is_compressed: bool


@dataclass
class MemoryStats:
    total_allocated: int
    total_used: int
    total_free: int
    fragmentation_ratio: float
    compression_savings: int


class MemoryOptimizer:
    def __init__(self, total_memory: int = 24 * 1024**3):
        self.total_memory = total_memory
        self.memory_blocks: OrderedDict[int, MemoryBlock] = OrderedDict()
        self.access_counter = 0
        self.compression_enabled = True
        self.lru_cache_size = 1000
    
    def allocate(self, tensor_name: str, size: int) -> int:
        if not self._can_allocate(size):
            self._free_memory(size)
        
        address = self._find_free_block(size)
        if address is None:
            address = self._allocate_new_block(size)
        
        block = MemoryBlock(
            address=address,
            size=size,
            tensor_name=tensor_name,
            access_frequency=0,
            last_access=self.access_counter,
            is_compressed=False
        )
        
        self.memory_blocks[address] = block
        self.access_counter += 1
        
        return address
    
    def _can_allocate(self, size: int) -> bool:
        used = sum(b.size for b in self.memory_blocks.values())
        return (used + size) <= self.total_memory
    
    def _free_memory(self, required_size: int) -> None:
        freed = 0
        to_remove = []
        
        for address, block in sorted(self.memory_blocks.items(), key=lambda x: x[1].access_frequency):
            if freed >= required_size:
                break
            to_remove.append(address)
            freed += block.size
        
        for address in to_remove:
            del self.memory_blocks[address]
    
    def _find_free_block(self, size: int) -> int | None:
        for address, block in self.memory_blocks.items():
            if block.size >= size and block.access_frequency == 0:
                return address
        return None
    
    def _allocate_new_block(self, size: int) -> int:
        used = sum(b.size for b in self.memory_blocks.values())
        return used
    
    def access(self, address: int) -> None:
        if address in self.memory_blocks:
            block = self.memory_blocks[address]
            block.access_frequency += 1
            block.last_access = self.access_counter
            self.access_counter += 1
            
            self.memory_blocks.move_to_end(address)
    
    def deallocate(self, address: int) -> None:
        if address in self.memory_blocks:
            del self.memory_blocks[address]
    
    def compress_inactive_blocks(self, threshold: int = 100) -> int:
        if not self.compression_enabled:
            return 0
        
        compressed_count = 0
        current_time = self.access_counter
        
        for address, block in self.memory_blocks.items():
            if not block.is_compressed and (current_time - block.last_access) > threshold:
                block.is_compressed = True
                block.size = int(block.size * 0.5)
                compressed_count += 1
        
        return compressed_count
    
    def defragment(self) -> int:
        blocks = list(self.memory_blocks.values())
        blocks.sort(key=lambda b: b.address)
        
        new_blocks = OrderedDict()
        current_address = 0
        
        for block in blocks:
            new_blocks[current_address] = MemoryBlock(
                address=current_address,
                size=block.size,
                tensor_name=block.tensor_name,
                access_frequency=block.access_frequency,
                last_access=block.last_access,
                is_compressed=block.is_compressed
            )
            current_address += block.size
        
        self.memory_blocks = new_blocks
        return len(blocks)
    
    def get_memory_layout(self) -> dict[str, Any]:
        layout = []
        
        for address, block in self.memory_blocks.items():
            layout.append({
                "address": address,
                "size": block.size,
                "tensor_name": block.tensor_name,
                "access_frequency": block.access_frequency,
                "is_compressed": block.is_compressed
            })
        
        return {"blocks": layout, "total_blocks": len(layout)}
    
    def get_statistics(self) -> MemoryStats:
        total_used = sum(b.size for b in self.memory_blocks.values())
        total_free = self.total_memory - total_used
        
        compressed_blocks = [b for b in self.memory_blocks.values() if b.is_compressed]
        compression_savings = sum(b.size for b in compressed_blocks)
        
        fragmentation = self._calculate_fragmentation()
        
        return MemoryStats(
            total_allocated=self.total_memory,
            total_used=total_used,
            total_free=total_free,
            fragmentation_ratio=fragmentation,
            compression_savings=compression_savings
        )
    
    def _calculate_fragmentation(self) -> float:
        if len(self.memory_blocks) < 2:
            return 0.0
        
        addresses = sorted(self.memory_blocks.keys())
        gaps = 0
        
        for i in range(len(addresses) - 1):
            current_block = self.memory_blocks[addresses[i]]
            next_address = addresses[i + 1]
            expected_next = addresses[i] + current_block.size
            if next_address != expected_next:
                gaps += next_address - expected_next
        
        total_gap_space = gaps
        return total_gap_space / self.total_memory if self.total_memory > 0 else 0.0
    
    def optimize_memory_layout(self) -> dict[str, Any]:
        stats_before = self.get_statistics()
        
        self.compress_inactive_blocks()
        self.defragment()
        
        stats_after = self.get_statistics()
        
        return {
            "before": {
                "used": stats_before.total_used,
                "fragmentation": stats_before.fragmentation_ratio
            },
            "after": {
                "used": stats_after.total_used,
                "fragmentation": stats_after.fragmentation_ratio
            },
            "memory_saved": stats_before.total_used - stats_after.total_used,
            "fragmentation_improved": stats_before.fragmentation_ratio - stats_after.fragmentation_ratio
        }
    
    def suggest_memory_allocation(self, tensor_sizes: dict[str, int]) -> dict[str, str]:
        suggestions = {}
        total_required = sum(tensor_sizes.values())
        
        if total_required > self.total_memory:
            suggestions["error"] = "insufficient_memory"
            suggestions["required"] = total_required
            suggestions["available"] = self.total_memory
            return suggestions
        
        stats = self.get_statistics()
        
        if stats.fragmentation_ratio > 0.2:
            suggestions["action"] = "defragment"
            suggestions["reason"] = "high_fragmentation"
        
        if stats.total_used / self.total_memory > 0.8:
            suggestions["action"] = "compress_inactive"
            suggestions["reason"] = "high_memory_usage"
        
        if not suggestions:
            suggestions["action"] = "allocate_direct"
            suggestions["reason"] = "sufficient_memory"
        
        return suggestions
