#pragma once

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Shared-memory single-producer/single-consumer queue.
 *
 * The control block and payload storage live in one caller-owned allocation.
 * Capacity must be a power of two. Indices are monotonically increasing and
 * deliberately use unsigned wraparound.
 */
size_t dsp_ring_required_bytes(uint32_t capacity, uint32_t item_size);
size_t dsp_ring_data_offset(void);
size_t dsp_ring_read_offset(void);
size_t dsp_ring_write_offset(void);
size_t dsp_ring_overflow_offset(void);
int dsp_ring_init(void* memory, uint32_t capacity, uint32_t item_size);
int dsp_ring_push(void* memory, const void* item);
int dsp_ring_pop(void* memory, void* item);
uint32_t dsp_ring_size(const void* memory);
uint32_t dsp_ring_overflow_count(const void* memory);
void dsp_ring_reset(void* memory);

#ifdef __cplusplus
}
#endif
