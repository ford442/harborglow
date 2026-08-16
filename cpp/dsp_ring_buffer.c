#include "dsp_ring_buffer.h"

#include <stdatomic.h>
#include <string.h>

typedef struct {
    _Alignas(64) _Atomic uint32_t read_index;
    _Alignas(64) _Atomic uint32_t write_index;
    _Alignas(64) _Atomic uint32_t overflow_count;
    uint32_t capacity;
    uint32_t item_size;
    uint32_t mask;
    uint32_t reserved;
    _Alignas(16) unsigned char data[];
} DspRingBuffer;

static int is_power_of_two(uint32_t value) {
    return value >= 2U && (value & (value - 1U)) == 0U;
}

size_t dsp_ring_required_bytes(uint32_t capacity, uint32_t item_size) {
    if (!is_power_of_two(capacity) || item_size == 0U) {
        return 0U;
    }
    return sizeof(DspRingBuffer) + (size_t)capacity * item_size;
}

size_t dsp_ring_data_offset(void) {
    return offsetof(DspRingBuffer, data);
}

size_t dsp_ring_read_offset(void) {
    return offsetof(DspRingBuffer, read_index);
}

size_t dsp_ring_write_offset(void) {
    return offsetof(DspRingBuffer, write_index);
}

size_t dsp_ring_overflow_offset(void) {
    return offsetof(DspRingBuffer, overflow_count);
}

int dsp_ring_init(void* memory, uint32_t capacity, uint32_t item_size) {
    if (!memory || !is_power_of_two(capacity) || item_size == 0U) {
        return 0;
    }
    DspRingBuffer* ring = (DspRingBuffer*)memory;
    atomic_init(&ring->read_index, 0U);
    atomic_init(&ring->write_index, 0U);
    atomic_init(&ring->overflow_count, 0U);
    ring->capacity = capacity;
    ring->item_size = item_size;
    ring->mask = capacity - 1U;
    ring->reserved = 0U;
    memset(ring->data, 0, (size_t)capacity * item_size);
    return 1;
}

int dsp_ring_push(void* memory, const void* item) {
    if (!memory || !item) {
        return 0;
    }
    DspRingBuffer* ring = (DspRingBuffer*)memory;
    const uint32_t write = atomic_load_explicit(
        &ring->write_index, memory_order_relaxed);
    const uint32_t read = atomic_load_explicit(
        &ring->read_index, memory_order_acquire);
    if ((uint32_t)(write - read) >= ring->capacity) {
        atomic_fetch_add_explicit(
            &ring->overflow_count, 1U, memory_order_relaxed);
        return 0;
    }
    memcpy(
        ring->data + (size_t)(write & ring->mask) * ring->item_size,
        item,
        ring->item_size);
    atomic_store_explicit(
        &ring->write_index, write + 1U, memory_order_release);
    return 1;
}

int dsp_ring_pop(void* memory, void* item) {
    if (!memory || !item) {
        return 0;
    }
    DspRingBuffer* ring = (DspRingBuffer*)memory;
    const uint32_t read = atomic_load_explicit(
        &ring->read_index, memory_order_relaxed);
    const uint32_t write = atomic_load_explicit(
        &ring->write_index, memory_order_acquire);
    if (read == write) {
        return 0;
    }
    memcpy(
        item,
        ring->data + (size_t)(read & ring->mask) * ring->item_size,
        ring->item_size);
    atomic_store_explicit(
        &ring->read_index, read + 1U, memory_order_release);
    return 1;
}

uint32_t dsp_ring_size(const void* memory) {
    if (!memory) {
        return 0U;
    }
    const DspRingBuffer* ring = (const DspRingBuffer*)memory;
    const uint32_t write = atomic_load_explicit(
        &ring->write_index, memory_order_acquire);
    const uint32_t read = atomic_load_explicit(
        &ring->read_index, memory_order_acquire);
    return (uint32_t)(write - read);
}

uint32_t dsp_ring_overflow_count(const void* memory) {
    if (!memory) {
        return 0U;
    }
    const DspRingBuffer* ring = (const DspRingBuffer*)memory;
    return atomic_load_explicit(
        &ring->overflow_count, memory_order_relaxed);
}

void dsp_ring_reset(void* memory) {
    if (!memory) {
        return;
    }
    DspRingBuffer* ring = (DspRingBuffer*)memory;
    atomic_store_explicit(&ring->read_index, 0U, memory_order_release);
    atomic_store_explicit(&ring->write_index, 0U, memory_order_release);
    atomic_store_explicit(&ring->overflow_count, 0U, memory_order_relaxed);
}
