import { AbstractControl } from '@angular/forms';
export function appEmailValidator(control: AbstractControl) {
  const regex = /(^[a-zA-Z0-9]+\.[a-zA-Z0-9]+\@[a-z]+\.[bg|com|uk]+$)/gm;
 
  return (control.value === '' || regex.exec(control.value)) ? null : { emailValidator: true };
}