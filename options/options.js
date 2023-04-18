import * as Settings from '../settings.js';

const DEBOUNCE_COOLDOWN_SECONDS = 3;

const $form = document.body.querySelector('form');
const $fields = [...$form.querySelectorAll('input')];

const Option = {

  _relevantProp: type => (type === 'checkbox') ? 'checked' : 'value',

  load(value, $field) {
    const type = $field.type;
    if (type === 'radio')
      $field.checked = ($field.value === `${value}`);
    else
      $field[this._relevantProp(type)] = value;
  },

  save($field) {
    const { type, name } = $field;
    if (type === 'radio') {
      // Booleanize any 'true'/'false' string
      const value = ({ true: true, false: false })[$field.value] ?? $field.value;
      if ($field.checked)
        Settings.set({ [name]: value });
    } else {
      Settings.set({ [name]: $field[this._relevantProp(type)] });
    }
  },

};

let timeoutId;
function debounce(callback, cooldown) {
	clearTimeout(timeoutId);
  timeoutId = setTimeout(callback, cooldown);
}


(async function init() {
  const settings = await Settings.getAll();
  for (const $field of $fields)
    Option.load(settings[$field.name], $field);
})();

$form.addEventListener('change', ({ target: $field }) => {
  Option.save($field);
  if ($form.enabled.checked) {
    // Restart extension after a 3s wait since the latest option change
    debounce(() => browser.runtime.reload(), DEBOUNCE_COOLDOWN_SECONDS * 1000);
  }
});
