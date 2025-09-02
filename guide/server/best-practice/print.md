Here are the Rust10x best practices for that for print!, format!, write! macros.
#### when use println!, print! or eprinltn!

use 
```
println!("somthing {var}"); 
```
instead of
```
println!("somthing {}", var); 
```
or like: 

```
println!("somthing {var:?}"); 
```
instead of
```
println!("somthing {:?}", var); 
```