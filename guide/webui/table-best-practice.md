## UI table Best Practices

These are the best practices for buttons

### Buttons in html
````HTML
<div class="table">
  <div class="thead row">
      <div class="cell"></div>
      <div class="cell"></div>
    </div>
  </div>
  <div class="tbody">
    <div class="row">
      <div class="cell"></div>
      <div class="cell"></div>
    </div>
  </div>
</div>
````

requires: 
- tbody should scroll vertically
- use css ```display: grid``` as much as you can
- for button, class prime for edit, class danger for delete
- use gray border color --clr-gray-200, and border with --clr-gray-300, 
- the header text color is --clr-gray-800, body text color --clr-gray-900
- and the table is fix parent container with padding: 3rem;
