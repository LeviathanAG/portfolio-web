---
title: "Understanding BinEX as an amateur"
date: 2026-07-21
description: "Understanding BinEX as an amateur"
tags: [pwn, theory, basics]
type: note
---

# Understanding BinEX as an amateur

* C has stack and heap.
* Stack is faster and easier to use.
* heap is slower, and user managed most of the time but we can write adts when u dont know how much mem to use generally. malloc and calloc.
* Heap can be really dangerous if user doesnt free mem after use.

## Stack

Lets dive deep into the rabbit hole of stacks to really understand binary exploitation properly.

### Stack Frame

  Function *identifiers (names)* are **not** stored on the stack at runtime. What the stack frame stores are *return address, saved registers/frame pointer, parameters (sometimes), and local variables*. The stack grows/shrinks with calls/returns.

so first of all in the stack frame :

* The *return address* is pushed onto the stack by the CPU when the call instruction runs . its exact position relative to the frame depends on calling convention and prologue/epilogue code. Its not  “at the start” of the frame in all architectures.



* then we store the parametres to the function -    **Correction:** Many calling conventions pass the first arguments in **registers** (e.g., x86-64 SysV uses `RDI`, `RSI`,etc . Some arguments are placed on the stack . So *parameters are sometimes on the stack, sometimes in registers*.


* then we next store the inputs etc
* i think what we store after is really abstract so i dont understand it that much but ill try :  after the return address and (maybe) params, we see saved frame pointer, saved callee-saved registers, local variables/buffers, and alignment padding.

* then we store the return call which shifts the stack pointer back the 1st address in the stack frame.

#### THUS by pushing and popping the frame the code runs the logic we have built

lets say we have a function in c :

```c
int foo(int a,int b){
    int c = a + b;
    return c;

}
```

now when we call it somewhere in the main method or any other method.

the identifiers and variables etc and other stuff is `copied` into the stack frame and then the code runs and all the functions are run.

`THE DANGEROUS PART HAPPENS WHEN USERS CAN OVERWRITE THE STACKFRAME WITH INPUTS AND WE CAN ADD OUR OWN DATA AND MANIPULATE WHEN THE RETURN IS CALLED  `

`OR  `

`WE CAN EVEN MOVE TO THE ADJACENT STACK FRAME to manipualte data there to induce unwanted behaviour`


## Initialization and cleanup

in c after the code runs unless we explicitly clean all the data c wont do it for us. even in the stack : c just reduces its scope bu sliding the window to remove the that particular stack frame. it still exists but we cant see

- `This can be used to exploit if some mem leak happens `

### For initilasation 

```c
void foo()
{
    char foobar[10];
    // here this data is NOT NULL initialised
    // also this isnt referencd to in the stack frame possibly
}
```
**NOTE** : `foobar might have values that was there in the stack leftver by a previous function call`.


# Resources Used : 

- https://pwn.college/intro-to-cybersecurity/binary-exploitation/
- https://www.youtube.com/watch?v=_8-ht2AKyH4

  
# END 

These notes cover my basic undersstanding of the c stack and heap allocations and their vulns.
