import validate from 'validate.js';
import validation_rules from './validation_rules';

export default function validate_wrapper(field, value) {
  var formValues = {};
  formValues[field] = value;
  // console.log(formValues); // { email: '123@email.com' };
  var formFields = {};
  formFields[field] = validation_rules[field]; // { email: { presence, email } }

  // validate formValues against formFields
  // result will hold error messages of the field

  // let constraint = validation_rules[field];
  // console.log("=== constraint ===");
  // console.log(constraint)
  // const result = validate(object, constraint);
  // const result = validate(formValues, { [field]: constraint })
  const result = validate(formValues, formFields);

  console.log("=== Validation Result ===");
  console.log(result); // undefined : 'string'
  if(result) {
    return result[field][0];
  }
  return null;
}
