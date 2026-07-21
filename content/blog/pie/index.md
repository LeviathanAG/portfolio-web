---
title: "Position Independent Executables"
date: 2026-07-21
description: "Position Independent Executables"
tags: [pwn, theory, pie]
type: note
---

# Position Independent Executables 

 A PIE binary and all of its dependencies are loaded into random locations within virtual memory each time the application is executed. This makes Return Oriented Programming (ROP) attacks much more difficult to execute reliably.

 -  This means you cannot hardcode values such as function addresses and gadget locations without finding out where they are.


# Exploitation techniques

PIE executables are based around relative rather than absolute addresses, meaning that while the locations in memory are fairly random the offsets between different parts of the binary remain constant. For example, if you know that the function main is located `0x120` bytes in memory after the base address of the binary, and you somehow find the location of main, you can simply subtract `0x120` from this to get the base address and from the addresses of everything else.

## So how do we leak this initial Address? 

 - We know that the return pointer is located on the stack - and much like a canary, we can use format string (or other vulns) to read the value off the stack. The value will always be a static offset away from the binary base, enabling us to completely bypass PIE.


# Double-Checking
Due to the way PIE randomisation works, the base address of a PIE executable will always end in the hexadecimal characters `000`. This is because pages are the things being randomised in memory, which have a standard size of `0x1000`. Operating Systems keep track of page tables which point to each section of memory and define the permissions for each section, similar to segmentation.

Checking the base address ends in `000` should probably be the first thing you do if your exploit is not working as you expected.


# Resources 

https://www.redhat.com/en/blog/position-independent-executables-pie

https://ir0nstone.gitbook.io/notes/binexp/stack/pie
