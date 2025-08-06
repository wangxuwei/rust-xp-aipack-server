## UI form Best Practices

These are the best practices for UI form, usually in dialog

### the html form in dialog
````HTML
<div class="ui-form">
  <div class="ui-form-row">
      <label class="ui-form-lbl">Name:</label>
      <input class="ui-form-val" placeholder="Enter name" />
    </div>
  </div>
  ...
</div>
````

the 

requires: 
- the ui form can be scroll vertically if parent container height is not enough
- the form should fix parent
- the ui-form-row make .ui-form-lbl and .ui-form-lbl in one row, use display: grid