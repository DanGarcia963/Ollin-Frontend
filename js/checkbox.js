document.querySelectorAll('.checkbox-button').forEach(function(el) {
    el.addEventListener('click', function() {
        var checkbox = this.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
        this.classList.toggle('checked', checkbox.checked);
    });
});

