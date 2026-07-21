---
title: "basic pwntools methods that help with bin exp."
date: 2026-07-21
description: "basic pwntools methods that help with bin exp."
tags: [pwn, theory, pwntools]
type: note
---

# basic pwntools methods that help with bin exp.

`from pwn import *` - imports everything

`ipython` - useful for testing binaries

`r=process('./x')` - useful for connecting to local binary

`r.send()` - to send inputs

`r.cyclic()` - for cyclic patterns to determine the correct amount of offset required to overwrite something for every four bytes.

we can again query ipython to get the exact byte offset

# Misc commands

`objdump -d -M intel <your_binary_file>`
