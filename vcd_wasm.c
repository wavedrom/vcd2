#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include "vcd_parser.h"

#define PAGE_SIZE 65536
//                                HEADER PADDING SIZE_OF_POINT
#define POINTS_PER_PAGE ((PAGE_SIZE - 32 - 8)  /  (3 * 4))

__attribute__((import_module("env"), import_name("endDefinitions"))) int endDefinitions();
__attribute__((import_module("env"), import_name("onCommand"))) int onCommand(int, const char*);
__attribute__((import_module("env"), import_name("onTimeStamp"))) void onTimeStamp();
__attribute__((import_module("env"), import_name("onIdHandler"))) void onIdHandler(const int32_t id);

// The length of the string (excluding the terminating 0) limited by 'maxsize'
static inline unsigned int _strnlen_s(const unsigned char* str, size_t maxsize) {
  const unsigned char* s;
  for (s = str; *s && maxsize--; ++s);
  return (unsigned int)(s - str);
}

void strcopy(const unsigned char* p, const unsigned char* endp, unsigned char* dst) {
  const unsigned char* src;
  src = p;
  while (src < endp) {
    *dst = *src;
    src++;
    dst++;
  }
  *dst = 0; // NULL termination
}

void strconcat(const unsigned char* p, const unsigned char* endp, unsigned char* dst) {
  // printf("<len:%d>", endp - p);
  dst += _strnlen_s(dst, 1000); // go to the end of string
  while (p < endp) {
    *dst = *p;
    p++;
    dst++;
  }
  *dst = 0;
}

int commandSpan(vcd_parser_t* state, const unsigned char* p, const unsigned char* endp) {
  const uint8_t command = state->command;
  if ((command > 0) && (command < 8)) {
    // 1: $comment
    // 2: $date
    // 3: $scope
    // 4: $timescale
    // 5: $upscope
    // 6: $var
    // 7: $version
    // const int len = endp - p;
    // int tailLen = 3;
    // if (len < 4) {
    //   tailLen = len;
    // }
    // strcopy(p, endp - tailLen, state->tmpStr);
    strcopy(p, endp, state->tmpStr);
    onCommand(command, state->tmpStr);
    return 0;
  }
  if (command == 8) { // $enddefinitions
    *(char *)state->idStr = 0;
    *(char *)state->timeStampStr = 0;
    // set_property_string("status", "simulation");
    // emit_lifee("$enddefinitions");
    endDefinitions();
    return 0;
  }
  // handle value changes
  // store

  return 0;
}

int idSpan(vcd_parser_t* state, const unsigned char* p, const unsigned char* endp) {
  strconcat(p, endp, state->idStr);
  return 0;
}

int timeSpan(vcd_parser_t* state, const unsigned char* p, const unsigned char* endp) {
  strconcat(p, endp, state->timeStampStr);
  return 0;
}

int onTime (vcd_parser_t* state, const unsigned char* p, const unsigned char* endp) {
  unsigned char* s = state->timeStampStr;
  int64_t time = 0;
  while (1) {
    int c = (unsigned char) *s;
    if (c == '\n') {
      break;
    }
    time *= 10;
    time += c - '0';
    s++;
  }
  if (state->time == INT64_MAX) {
    state->t0 = time;
  }
  state->time = time;
  *(char *)state->timeStampStr = 0;
  onTimeStamp();
  return 0;
}

uint32_t getHash(const unsigned char* p, const unsigned int plen) {
  // polynomial rolling hash function
  uint32_t hash = 0;
  uint32_t poly = 1;
  for (int i = 0; i < plen; i++) {
    uint32_t cc = (unsigned char) p[i];
    if (cc == 0) {
      break;
    }
    uint32_t c = cc - 33 + 1; // ! .. ~ (94 digits)
    hash = (hash + poly * c) & 0xfff;
    poly = (poly * 97) & 0xfff; // 89, 97
  }
  return hash;
}

struct hash_tail_s {
  int32_t id_when_true; // ID when string match
  int32_t id_or_index_when_false; // (>0 : ID; <0 : -index) when string mismatch
  const unsigned char str_to_match[16]; // string to match against
};
typedef struct hash_tail_s hash_tail_t;

int32_t getId(vcd_parser_t* state, const unsigned char* p, const unsigned int plen) {
  const uint32_t hash = getHash(p, plen);
  const int32_t* def32 = (const int32_t*)state->definitions_ptr;
  int32_t el = def32[hash]; // entry point
  if (el >= 0) { // >0 -> ID; 0 -> Error
    return el;
  }

  hash_tail_t *current_tail;
  for (int j = 0; j < 100; j++) { // maximum number of links in the chain
    current_tail = (hash_tail_t *)(def32 - el);

    int matched = 1;
    for (int i = 0; i < plen; i++) {
      if (p[i] != current_tail->str_to_match[i]) {
        matched = 0;
        break;
      }
    }

    if (matched) {
      return current_tail->id_when_true;
    }

    el = current_tail->id_or_index_when_false;
    if (el >= 0) {
      return el;
    }
  }
  return 0;
}


typedef struct gl_page_point_s gl_page_point_t;
typedef struct gl_page_s gl_page_t;
typedef struct output_idx_s output_idx_t;

struct gl_page_point_s {
  uint32_t time; // time
  uint32_t tilt; // tilt code (only 3 bits (7 values) used)
  uint32_t color; // color code (only 4 bits (16 colors) used)
};

struct gl_page_s {
  uint64_t time_start; // start time of the page
  uint64_t time_end; // end time of the page
  int32_t id; // ID number of signal
  size_t length; // bytes used inside the page
  gl_page_t *next; // next page link
  gl_page_t *prev; // previous page link
  gl_page_point_t points[POINTS_PER_PAGE];
};

struct output_idx_s {
  gl_page_t *head_gl_page;
  gl_page_t *tale_gl_page;
  const unsigned char *head_data_page;
  const unsigned char *tale_data_page;
};

gl_page_t* get_gl_page (vcd_parser_t *state, int32_t id, output_idx_t *record) {
  if (record->tale_gl_page && record->tale_gl_page->length < (POINTS_PER_PAGE - 10)) {
    return record->tale_gl_page;
  }

  gl_page_t *new_gl_page = (gl_page_t *)state->free_page_ptr;

  if (record->tale_gl_page == 0) { // first ever page
    record->head_gl_page = new_gl_page;
    new_gl_page->prev = 0;
  } else { // additional page
    record->tale_gl_page->next = new_gl_page;
    new_gl_page->prev = record->tale_gl_page;
  }

  record->tale_gl_page = new_gl_page;
  new_gl_page->next = 0;
  new_gl_page->time_start = state->time;
  new_gl_page->id = id;
  new_gl_page->length = 0;

  state->free_page_ptr += PAGE_SIZE;
  return new_gl_page;

  // if (record->tale_gl_page == 0) {
  //   gl_page_t *new_gl_page = (gl_page_t *)state->free_page_ptr;
  //   record->head_gl_page = new_gl_page;
  //   record->tale_gl_page = new_gl_page;

  //   new_gl_page->next = 0;
  //   new_gl_page->prev = 0;
  //   new_gl_page->time_start = state->time;
  //   new_gl_page->id = id;
  //   new_gl_page->length = 0;

  //   state->free_page_ptr += PAGE_SIZE;
  //   return new_gl_page;
  // }
  // // already have allocated pages
  // gl_page_t *current_gl_page = record->tale_gl_page;
  // if (current_gl_page->length >= (POINTS_PER_PAGE - 10)) {
  //   // TODO how much space needed for one more record?
  //   gl_page_t *new_gl_page = (gl_page_t *)state->free_page_ptr;
  //   current_gl_page->next = new_gl_page;
  //   record->tale_gl_page = new_gl_page;

  //   new_gl_page->next = 0;
  //   new_gl_page->prev = current_gl_page;
  //   new_gl_page->time_start = state->time;
  //   new_gl_page->id = id;
  //   new_gl_page->length = 0;

  //   state->free_page_ptr += PAGE_SIZE;
  //   return new_gl_page;
  // }
  // return current_gl_page;
}

void gl_value_change_update(
  vcd_parser_t *state, gl_page_t *gl_page,
  uint64_t* value, const int digitCount,
  uint64_t* mask, const int maskCount
) {
  // int32_t id = gl_page->id;
  // const unsigned char* p = (unsigned char *)state->idStr;
  // uint8_t cmd = state->command;
  size_t idx = gl_page->length;

  // onIdString(p, id, cmd, value, digitCount, mask, maskCount);
  gl_page->points[idx++] = (gl_page_point_t){ .time = state->time, .tilt = 5, .color = 2 };

  // switch(cmd) {
  // case 14: // 0
  //   gl_page->points[idx++] = (gl_page_point_t){ .time = state->time, .tilt = 5, .color = 2 };
  //   break;
  // case 15: // 1
  //   gl_page->points[idx++] = (gl_page_point_t){ .time = state->time, .tilt = 2, .color = 3 };
  //   break;
  // case 16: // x
  // case 17: // X
  //   // break;
  // case 18: // z
  // case 19: // Z
  //   // break;
  // case 20: // u
  // case 21: // U
  //   // break;
  // case 22: // w
  // case 23: // W
  //   // break;
  // case 24: // l
  // case 25: // L
  //   // break;
  // case 26: // h
  // case 27: // H
  // case 28: // -
  //   // break;
  // case 30: // b
  // case 31: // B
  //   // break;
  // default:
  //   gl_page->points[idx++] = (gl_page_point_t){ .time = state->time, .tilt = 5, .color = 2 };
  //   // onIdString(p, id, cmd, value, digitCount, mask, maskCount);
  // }
  gl_page->length = idx;
  gl_page->time_end = state->time;
}

int onId (vcd_parser_t* state, const unsigned char* _p, const unsigned char* _endp) {
  const unsigned char* p = (unsigned char *)state->idStr;
  const unsigned int plen = _strnlen_s(p, 1000) - 1;
  *(char *)(p + plen) = 0; // null instead of space
  // const unsigned char* endp = p + plen - 1;
  const int valueWords = (state->digitCount + 63) >> 6;
  const int maskWords = (state->maskCount + 63) >> 6;
  uint64_t* value = state->value;
  uint64_t* mask = state->mask;
  int32_t id = getId(state, p, plen);

  state->id_sum = (state->id_sum + id) & 0xffff; // check sum of all ids

  output_idx_t *current_record;
  current_record = (output_idx_t *)(state->output_idx_ptr + (sizeof (output_idx_t)) * id);

  // if (id <= 0) {
  //   onIdString(id);
  // }
  if (state->trigger_enable) {
    const uint8_t trigger_id_enable = ((uint8_t *)(state->triggers_ptr))[id];
    if (trigger_id_enable) {
      onIdHandler(id);
    }
  }

  gl_page_t *current_gl_page = get_gl_page(state, id, current_record);
  gl_value_change_update(state, current_gl_page, value, state->digitCount, mask, state->maskCount);

  // cleanup
  for (int i = 0; i < valueWords; i++) {
    value[i] = 0;
  }
  for (int i = 0; i < maskWords; i++) {
    mask[i] = 0;
  }
  state->digitCount = 0;
  state->maskCount = 0;
  *(char *)state->idStr = 0;
  return 0;
}

int onDigit(vcd_parser_t* state, const unsigned char* _p, const unsigned char* _endp, int digit) {
  unsigned int valueCin = (digit & 1);
  unsigned int maskCin = ((digit >> 1) & 1);
  if ((valueCin != 0) || (state->digitCount != 0)) {
    unsigned int valueCout;
    uint64_t* value = state->value;
    const int valueWordsMinus = (state->digitCount >> 6);
    for (int i = 0; i <= valueWordsMinus; i++) {
      valueCout = value[i] >> 63;
      value[i] = (value[i] << 1) + valueCin;
      valueCin = valueCout;
    }
    state->digitCount += 1;
  }
  if ((maskCin != 0) || (state->maskCount != 0)) {
    unsigned int maskCout;
    uint64_t* mask = state->mask;
    const int maskWordsMinus = (state->maskCount >> 6);
    for (int i = 0; i <= maskWordsMinus; i++) {
      maskCout = mask[i] >> 63;
      mask[i]  = (mask[i] << 1) + maskCin;
      maskCin = maskCout;
    }
    state->maskCount += 1;
  }
  return 0;
}

int onRecover(vcd_parser_t* state, const unsigned char* p, const unsigned char* endp, int digit) {
  state->digitCount = 0;
  state->maskCount = 0;
  return 0;
}

void* init (void* top) {
  vcd_parser_t *state = (vcd_parser_t *)top;
  vcd_parser_init(state);
  top += sizeof *state;
  top = (void *)(((uintptr_t)top + (256 - 1)) & -256); // align

  // allocate buffers
  state->reason = top;        top += 256;
  // char str[] = "NO REASON";
  // state->reason = str;
  state->time = INT64_MAX;
  // state->trigger = top;       top += 4096;
  // state->triee = 0;
  // state->lifee = 0;
  state->value = top;         top += 4096;
  state->mask = top;          top += 4096;
  state->digitCount = 0;
  state->maskCount = 0;
  state->tmpStr = top;        top += 4096;
  state->timeStampStr = top;  top += 4096;
  state->idStr = top;         top += 4096;
  state->tmpStr2 = top;       top += 4096;
  // uint32_t *sp0 = state->_span_pos0;
  // sp0[1] = 55;
  return top;
}

int32_t chunk (vcd_parser_t* state, const char* inp, const char* oup) {
  const int32_t error = vcd_parser_execute(state, inp, oup);
  return error;
}
