---
title: "Debugging using gbd"
date: 2026-07-21
description: "Debugging using gbd"
tags: [pwn, theory, gdb]
type: note
---

# Debugging using gbd

- `Note : I use pwngdb which abstracts away a lot of the commands with a stack frame table but ill still try to explain all the commands in gdb and how breakpoints work.
`

# GDB commands

## Session

```bash
file ./vulnerable         # load binary
set args <arg1> <arg2>   # set program arguments
run                      # start program (alias: r)
start                    # start and break at entry (first instruction of `main` or _start)
quit                     # exit gdb
```


## brk pts and exec control
```bash
break main               # breakpoint at symbol 'main'
b *0x401234              # breakpoint at a raw address
tbreak <location>        # temporary breakpoint (auto-removed after hit)
clear <location>         # remove break(s)
delete <num>             # delete breakpoint number
info breakpoints         # list breakpoints
continue                 # resume execution (alias: c)
step                     # step into source line (high-level)
next                     # step over source line
si                       # step one machine instruction (stepi)
ni                       # next one machine instruction (nexti)
finish                   # run until current function returns
until <location>         # run until location (useful to get out of loops)
jump *0x401000           # set PC to address 
```


## Threads
```bash
info threads             # list threads
thread <n>               # switch to thread n
thread apply all bt      # run bt for all threads
```

## Registers
```bash
info registers           # show all registers
i r                      # short for info registers
print $rax               # print register value (use $ prefix)
set $rax = 0xdeadbeef    # modify register value
x/i $rip                 # disassemble at current instruction pointer
display $rip             # automatically show RIP each stop
```


## mem inspection

```bash

x/Nfu <addr>             # examine memory: N = count, f = format, u = unit size
# common examples:
x/20gx $rsp               # examine 20 8-byte words at stack (g = 8-byte)
x/40xb $rsp               # examine 40 bytes at stack in hex (b = byte)
x/s 0x601050             # print string at address
dump memory out.bin 0x400000 0x401000  # dump memory range to file
restore memory 0x400000 out.bin        # write contents back in
set {char[8]}0x7fffffffe000 = "ABCDEFG" # write memory (careful)
```


# disassmeble

```bash
disassemble <func>            # disassemble function
disassemble /r <func>         # show raw bytes
disassemble <addr> <addr>     # disassemble address range
layout asm                    # TUI: show assembly layout (if using TUI)
set disassembly-flavor intel  # use Intel syntax

```

## Misc 

### printing vars and calling funcs

```bash
print var                # print C variable or expression
print/x var              # print expression in hex
p *(char **)0x7fffffffe000   # dereference and print
x/s 0x601050             # print string at address
p &variable              # print address of variable
call function(args)      # call a function inside the debugged program
set variable var = val   # change variable value in program
printf "%s\n", (char*)0x601050  # print string via printf in gdb

```

### stacks
```bash

backtrace                # show call stack (alias: bt)
bt full                  # backtrace with local variables
frame <n>                # select frame n
info frame               # details about current frame
info locals              # list local variables
info args                # list arguments for current function
x/16gx $rsp              # raw stack contents from current frame

```


# Exploit example 

```bash
set disassembly-flavor intel
break *main+0x123         # break at offset inside main
run < <(python -c 'print("A"*200)') # feed input from process substitution (bash)
x/40bx $rbp               # examine 40 bytes at rbp in byte form
p/x $rbp+8                # print value as hex
printf "%s\n", (char*)0x601050 # print string via printf in gdb

```


# Binary Analysis Script 

```py
#!/usr/bin/env python3

from pwn import *

context.update(arch='amd64', os='linux')

# Load the binary
import os
script_dir = os.path.dirname(os.path.abspath(__file__))
binary_path = os.path.join(script_dir, 'chal')
elf = ELF(binary_path)



print(f"Architecture: {elf.arch}")
print(f"Bits: {elf.bits}")
print(f"Endianness: {elf.endian}")
print(f"PIE enabled: {elf.pie}")
print(f"NX enabled: {elf.nx}")
print(f"Canary: {elf.canary}")
print()

```

# Resources


man gdb
