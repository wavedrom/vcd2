#ifndef INCLUDE_VCD_PARSER_H_
#define INCLUDE_VCD_PARSER_H_
#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>

typedef struct vcd_parser_s vcd_parser_t;
struct vcd_parser_s {
  int32_t _index;
  void* _span_pos0;
  void* _span_cb0;
  int32_t error;
  const char* reason;
  const char* error_pos;
  void* data;
  void* _current;
  uint64_t t0;
  uint64_t time;
  void* definitions_ptr;
  void* output_idx_ptr;
  void* free_page_ptr;
  uint32_t num_ids;
  uint32_t id_sum;
  uint32_t size;
  void* trigger;
  void* triee;
  void* lifee;
  void* info;
  void* value;
  void* mask;
  uint32_t digitCount;
  uint32_t maskCount;
  void* tmpStr;
  void* timeStampStr;
  void* idStr;
  void* tmpStr2;
  uint32_t stackPointer;
  void* id;
  void* napi_env;
  uint8_t command;
  uint8_t type;
};

int vcd_parser_init(vcd_parser_t* s);
int vcd_parser_execute(vcd_parser_t* s, const char* p, const char* endp);

#ifdef __cplusplus
}  /* extern "C" */
#endif
#endif  /* INCLUDE_VCD_PARSER_H_ */
