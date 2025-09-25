
// region:    --- Types

import { all, closest, first, getAttr, html } from 'dom-native';
import { asNum } from 'utils-min';

const FIELD_PREFIX = "n-";
export interface FormField {
	label: string;
	value: string;
}

export interface ValidationRule {
	validator: (field:FormField, depends:string[], dependsFields: FormField[]) => boolean | {[name:string]: string};
	message: string;
}

const VALIDATORS = {
	"required": {
		validator:function (field:FormField) {
			return field.value ? true : {var: field.label};
		}, 
		message: "{var} is required"
	},
	"number": {
		validator:function (field:FormField) {
			const v = asNum(field.value);
			return v != null ? true : {var: field.label};
		},
		message: "{var} should be a number"
	},
	"maxlength": {
		validator:function (field:FormField, depends:string[], dependsFields: FormField[]) {
			let maxLength = asNum(depends[0])!;
			return field.value.length <= maxLength ? true : { var: field.label, maxLength};
		},
		message: "{var} length should be less than {maxLength}"
	},
} as {[name:string]: ValidationRule};

// endregion: --- Types

// region:    --- Core Validation Functions
export function showValidateError(formEl:HTMLElement, message:string){
	const validateEl = first(formEl, ".ui-form-validate-message");
	if(validateEl){
		validateEl.innerHTML = `<div class="text">${message}</div>`;
	}else{
		const uiFormEl = formEl.classList.contains("ui-form") ? formEl : first(formEl, ".ui-form");
		const textEl = html`
			<div class="ui-form-validate-message"><div class="text">${message}</div></div>
		`;
		uiFormEl?.appendChild(textEl);
	}

}

export function clearValidateError(formEl:HTMLElement){
	first(formEl, ".ui-form-validate-message")?.remove();
}

export function validateValues(formEl:HTMLElement): string | null {
	const fieldEls = all(formEl, "input,textarea,select,.d-field");
	let validResult = null;
	const validatorsMap = fieldEls.reduce((pv, fieldEl) => {
		const name = getAttr(fieldEl, "name")!;
		const value = getAttr(fieldEl, "value")!;
		const label = getFormLabel(fieldEl);
		let field = {
			label,
			value
		}
		pv[name] = field;
		return pv;
	}, {} as  {[name:string]:FormField});
	for(const fieldEl of fieldEls){
		validResult = validateValue(fieldEl as HTMLInputElement, formEl, validatorsMap);
		if(validResult){
			break;
		}
	}
	return validResult;
}

function validateValue(fieldEl: HTMLInputElement, formEl:HTMLElement, fieldsMap?:{[name:string]:FormField}): string | null {
	const ruleStr = getAttr(fieldEl, "v-rules");
	const fieldValue = fieldEl.value;
	const currentFormField = {
		label: getFormLabel(fieldEl),
		value: fieldValue
	}
	if(ruleStr){
		const rules = ruleStr.split(";");
		for(const ruleName of rules){
			const ruleConf = VALIDATORS[ruleName];
			if(ruleConf){
				const dependsValues = [];
				const dependsFields = [];
				const ruleDependsOnStr = getAttr(fieldEl, `"v-${ruleName}-depends-on"`);
				if(ruleDependsOnStr){
					const ruleValues = ruleDependsOnStr.split(";");
					// load all rule values
					for(const ruleValue of ruleValues){
						if(ruleValue.startsWith(FIELD_PREFIX)){
							const dependName = ruleValue.slice(2);
							let dependVal;
							let dependFormField: FormField | undefined;
							if(fieldsMap){
								const dependField = fieldsMap[dependName];
								dependVal= dependField?.value;
							}else{
								const dependField = getDependOnField(formEl, dependName);
								dependVal = dependField.value;
								dependFormField = {
									label: getFormLabel(dependField),
									value: dependVal!
								};
							}
							dependsValues.push(ruleValue);
							dependsFields.push(dependFormField!);
						}else{
							dependsValues.push(ruleValue);
						}
					}
				}
			
				const validator = ruleConf.validator;
				const validResult = validator(currentFormField, dependsValues, dependsFields);
				let message;
				if(typeof validResult == "object"){
					message = replaceVariables(ruleConf.message, validResult);
					// boolean
				}else if(!validResult){
					message = ruleConf.message;
				}

				if(message){
					return message;
				}

			}
		}
	}
	return null;
}

function getFormLabel(fieldEl:HTMLElement){
	const rowEl =  closest(fieldEl, ".ui-form-row");
	const labelEl = first(rowEl, ".ui-form-lbl");
	return labelEl?.textContent ?? "";
}

function getDependOnField(formEl:HTMLElement, dependName:string){
	return first(formEl, `*[name='${dependName}']`) as HTMLInputElement
}

function replaceVariables(template: string, variables:{[name:string]:string}): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
		let val = variables[key] ?? match;
    return val.endsWith(":") ? val.slice(0, val.length - 1) : val;
  });
}

// endregion: --- Core Validation Functions