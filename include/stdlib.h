// MIT
#ifndef __STDLIB_H__
#define __STDLIB_H__

#define NULL ((void *)0)

__attribute__((import_module("env"), import_name("abort"))) void abort(void);

#endif  /* __STDLIB_H__ */
